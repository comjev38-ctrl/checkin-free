-- ============================================================
-- CheckIn Free — Migration 11 : rôles et droits différenciés
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- Trois rôles :
--   - proprietaire   : tout, y compris gérer l'équipe (inviter,
--                       retirer, changer les rôles)
--   - organisateur    : crée/modifie/supprime des événements, scanne
--                       n'importe quel événement, mais ne touche pas
--                       à l'équipe (page Membres invisible)
--   - scanneur        : ne peut QUE scanner, et seulement pour les
--                       événements qui lui ont été explicitement
--                       autorisés (table ci-dessous)

alter table admins add column if not exists role text not null default 'organisateur'
  check (role in ('proprietaire', 'organisateur', 'scanneur'));

-- Tous les admins déjà présents avant cette migration deviennent
-- propriétaires (ils avaient déjà accès à tout de toute façon).
-- Les futures invitations utiliseront le rôle choisi dans le
-- formulaire (organisateur par défaut si non précisé).
update admins set role = 'proprietaire';

-- ---------- Événements qu'un scanneur a le droit de scanner ----------
create table if not exists admin_evenements_autorises (
  admin_email text not null references admins(email) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (admin_email, event_id)
);

alter table admin_evenements_autorises enable row level security;

drop policy if exists "Equipe admin gere les autorisations scan" on admin_evenements_autorises;
create policy "Equipe admin gere les autorisations scan"
  on admin_evenements_autorises for all
  using (public.est_admin())
  with check (public.est_admin());

-- ============================================================
-- Fonctions utilitaires (SECURITY DEFINER : même logique anti-
-- récursion que est_admin(), voir migration 03)
-- ============================================================

create or replace function public.est_proprietaire()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins where email = auth.jwt() ->> 'email' and role = 'proprietaire'
  );
$$;

create or replace function public.peut_gerer_evenements()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins
    where email = auth.jwt() ->> 'email'
    and role in ('proprietaire', 'organisateur')
  );
$$;

-- ============================================================
-- Mise à jour des policies existantes
-- ============================================================

-- ---------- events : lecture ouverte à l'équipe, écriture réservée
--                     aux propriétaires/organisateurs ----------
drop policy if exists "Equipe admin gere les evenements" on events;

create policy "Equipe admin lit les evenements"
  on events for select
  using (public.est_admin());

create policy "Organisateurs creent les evenements"
  on events for insert
  with check (public.peut_gerer_evenements());

create policy "Organisateurs modifient les evenements"
  on events for update
  using (public.peut_gerer_evenements());

create policy "Organisateurs suppriment les evenements"
  on events for delete
  using (public.peut_gerer_evenements());

-- ---------- admins : gérer l'équipe réservé aux propriétaires
--                     (l'auto-édition de son propre profil reste
--                     permise par la policy existante de la
--                     migration 05, inchangée) ----------
drop policy if exists "Admins invitent des membres" on admins;
create policy "Proprietaires invitent des membres"
  on admins for insert
  with check (public.est_proprietaire());

drop policy if exists "Admins retirent des membres" on admins;
create policy "Proprietaires retirent des membres"
  on admins for delete
  using (public.est_proprietaire());

drop policy if exists "Proprietaires modifient les roles" on admins;
create policy "Proprietaires modifient les roles"
  on admins for update
  using (public.est_proprietaire());
