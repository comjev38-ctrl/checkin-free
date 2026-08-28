-- ============================================================
-- CheckIn Free — Migration 11 : niveaux de droits admin
-- À exécuter dans Supabase > SQL Editor, en une seule fois
-- ============================================================
--
-- Trois droits indépendants, combinables :
--   - peut_gerer_equipe        : inviter/retirer des admins, changer
--                                 leurs droits
--   - peut_gerer_evenements    : créer/modifier/supprimer des
--                                 événements (implique de voir tous
--                                 les billets/inscrits/stats)
--   - peut_scanner_tous_evenements : si faux, la personne ne peut
--                                 scanner QUE les événements listés
--                                 dans admin_evenements_scannables
--
-- Un compte "propriétaire" (est_proprietaire) a toujours tous les
-- droits, et ne peut jamais être supprimé ni rétrogradé par
-- quelqu'un d'autre — filet de sécurité pour ne jamais se retrouver
-- bloqué hors de sa propre appli.

alter table admins add column if not exists est_proprietaire boolean not null default false;
alter table admins add column if not exists peut_gerer_equipe boolean not null default false;
alter table admins add column if not exists peut_gerer_evenements boolean not null default false;
alter table admins add column if not exists peut_scanner_tous_evenements boolean not null default true;

-- Rétroactif : les comptes déjà existants avant cette migration
-- gardent tous les droits (ils étaient déjà des admins de confiance
-- dans l'ancien système, où tout le monde avait tous les droits).
update admins
set peut_gerer_equipe = true,
    peut_gerer_evenements = true,
    peut_scanner_tous_evenements = true;

-- Le tout premier compte créé devient propriétaire.
update admins
set est_proprietaire = true
where email = (select email from admins order by created_at asc limit 1);

-- ---------- Table de restriction de scan par événement ----------
create table if not exists admin_evenements_scannables (
  admin_email text not null references admins(email) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (admin_email, event_id)
);

alter table admin_evenements_scannables enable row level security;

-- ============================================================
-- Fonctions de vérification des droits (SECURITY DEFINER : même
-- principe que est_admin(), pour éviter toute récursion RLS)
-- ============================================================

create or replace function public.peut_gerer_equipe()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select est_proprietaire or peut_gerer_equipe
     from admins where email = auth.jwt() ->> 'email'),
    false
  );
$$;

create or replace function public.peut_gerer_evenements()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select est_proprietaire or peut_gerer_evenements
     from admins where email = auth.jwt() ->> 'email'),
    false
  );
$$;

create or replace function public.peut_scanner_evenement(id_evenement uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select
        a.est_proprietaire
        or a.peut_gerer_evenements
        or a.peut_scanner_tous_evenements
        or exists (
          select 1 from admin_evenements_scannables aes
          where aes.admin_email = a.email and aes.event_id = id_evenement
        )
      from admins a
      where a.email = auth.jwt() ->> 'email'
    ),
    false
  );
$$;

-- ============================================================
-- Policies — table admins
-- ============================================================

drop policy if exists "Admins invitent des membres" on admins;
create policy "Gestionnaires equipe invitent des membres"
  on admins for insert
  with check (public.peut_gerer_equipe());

-- Chacun peut modifier son PROPRE profil (prénom, nom, mot de passe
-- provisoire), mais jamais ses propres droits — le WITH CHECK force
-- les colonnes de droits à rester identiques à ce qu'elles étaient.
drop policy if exists "Admin modifie son propre profil" on admins;
create policy "Admin modifie son propre profil"
  on admins for update
  using (email = auth.jwt() ->> 'email')
  with check (
    email = auth.jwt() ->> 'email'
    and est_proprietaire = (select a2.est_proprietaire from admins a2 where a2.email = auth.jwt() ->> 'email')
    and peut_gerer_equipe = (select a2.peut_gerer_equipe from admins a2 where a2.email = auth.jwt() ->> 'email')
    and peut_gerer_evenements = (select a2.peut_gerer_evenements from admins a2 where a2.email = auth.jwt() ->> 'email')
    and peut_scanner_tous_evenements = (select a2.peut_scanner_tous_evenements from admins a2 where a2.email = auth.jwt() ->> 'email')
  );

-- Un gestionnaire d'équipe peut modifier les droits de N'IMPORTE QUI
-- (sauf lui-même via cette policy — il passe par celle du dessus).
drop policy if exists "Gestionnaires equipe modifient les membres" on admins;
create policy "Gestionnaires equipe modifient les membres"
  on admins for update
  using (public.peut_gerer_equipe())
  with check (public.peut_gerer_equipe());

-- On ne peut jamais retirer le propriétaire.
drop policy if exists "Admins retirent des membres" on admins;
create policy "Gestionnaires equipe retirent des membres"
  on admins for delete
  using (public.peut_gerer_equipe() and not est_proprietaire);

-- ============================================================
-- Policies — table events
-- ============================================================

drop policy if exists "Equipe admin gere les evenements" on events;

drop policy if exists "Lecture evenements par equipe" on events;
create policy "Lecture evenements par equipe"
  on events for select
  using (public.est_admin());

drop policy if exists "Creation evenements par droits" on events;
create policy "Creation evenements par droits"
  on events for insert
  with check (public.peut_gerer_evenements());

drop policy if exists "Modification evenements par droits" on events;
create policy "Modification evenements par droits"
  on events for update
  using (public.peut_gerer_evenements())
  with check (public.peut_gerer_evenements());

drop policy if exists "Suppression evenements par droits" on events;
create policy "Suppression evenements par droits"
  on events for delete
  using (public.peut_gerer_evenements());

-- ============================================================
-- Policies — table tickets
-- ============================================================

drop policy if exists "Equipe admin lit les billets" on tickets;
create policy "Lecture billets selon droits"
  on tickets for select
  using (public.peut_gerer_evenements() or public.peut_scanner_evenement(event_id));

drop policy if exists "Equipe admin met a jour les billets" on tickets;
create policy "Maj billets selon droits"
  on tickets for update
  using (public.peut_gerer_evenements() or public.peut_scanner_evenement(event_id));

drop policy if exists "Equipe admin supprime les billets" on tickets;
create policy "Suppression billets par droits"
  on tickets for delete
  using (public.peut_gerer_evenements());

-- ============================================================
-- Policies — table checkins
-- ============================================================

drop policy if exists "Equipe admin gere les check-ins" on checkins;
create policy "Checkins selon droits de scan"
  on checkins for all
  using (
    exists (
      select 1 from tickets t
      where t.id = checkins.ticket_id
      and (public.peut_gerer_evenements() or public.peut_scanner_evenement(t.event_id))
    )
  )
  with check (
    exists (
      select 1 from tickets t
      where t.id = checkins.ticket_id
      and (public.peut_gerer_evenements() or public.peut_scanner_evenement(t.event_id))
    )
  );

-- ============================================================
-- Policies — table admin_evenements_scannables
-- ============================================================

drop policy if exists "Gestion assignations scan" on admin_evenements_scannables;
create policy "Gestion assignations scan"
  on admin_evenements_scannables for all
  using (public.peut_gerer_equipe() or public.peut_gerer_evenements())
  with check (public.peut_gerer_equipe() or public.peut_gerer_evenements());

drop policy if exists "Voir ses propres assignations" on admin_evenements_scannables;
create policy "Voir ses propres assignations"
  on admin_evenements_scannables for select
  using (admin_email = auth.jwt() ->> 'email');
