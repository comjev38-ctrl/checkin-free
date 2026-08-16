-- ============================================================
-- CheckIn Free — Migration 02 : équipe multi-admin
-- À exécuter dans Supabase > SQL Editor, APRÈS schema.sql
-- ============================================================

-- ---------- Table des membres admin autorisés ----------
-- Un email présent ici peut se connecter et gérer TOUS les
-- événements de l'association (espace de travail partagé, pas de
-- notion de propriétaire individuel).
create table if not exists admins (
  email text primary key,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- Un membre admin peut voir la liste complète des membres
drop policy if exists "Admins voient la liste des membres" on admins;
create policy "Admins voient la liste des membres"
  on admins for select
  using (
    exists (select 1 from admins a2 where a2.email = auth.jwt() ->> 'email')
  );

-- Un membre admin peut inviter/retirer d'autres membres
drop policy if exists "Admins invitent des membres" on admins;
create policy "Admins invitent des membres"
  on admins for insert
  with check (
    exists (select 1 from admins a2 where a2.email = auth.jwt() ->> 'email')
  );

drop policy if exists "Admins retirent des membres" on admins;
create policy "Admins retirent des membres"
  on admins for delete
  using (
    exists (select 1 from admins a2 where a2.email = auth.jwt() ->> 'email')
  );

-- Relie automatiquement le user_id dès la première connexion d'un
-- membre déjà invité par email (pratique pour l'affichage).
create or replace function public.lier_admin_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update admins
  set user_id = new.id
  where email = new.email and user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_lier_admin on auth.users;
create trigger on_auth_user_created_lier_admin
  after insert or update of email on auth.users
  for each row execute function public.lier_admin_user_id();

-- ============================================================
-- Remplacement des policies : ownership individuel -> équipe partagée
-- ============================================================

drop policy if exists "Admin gere ses evenements" on events;
create policy "Equipe admin gere les evenements"
  on events for all
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

drop policy if exists "Admin lit les billets de ses evenements" on tickets;
create policy "Equipe admin lit les billets"
  on tickets for select
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

drop policy if exists "Admin met a jour les billets de ses evenements" on tickets;
create policy "Equipe admin met a jour les billets"
  on tickets for update
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

drop policy if exists "Admin gere les check-ins" on checkins;
create policy "Equipe admin gere les check-ins"
  on checkins for all
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

-- ============================================================
-- ÉTAPE MANUELLE OBLIGATOIRE
-- ============================================================
-- Ajoute-toi comme premier membre admin (remplace par ton email) :
--
-- insert into admins (email) values ('ton-email@exemple.fr');
--
-- Sans cette ligne, PERSONNE n'aura accès à /admin, toi y compris,
-- même déjà connecté. Ensuite, tu pourras inviter le reste de
-- l'équipe directement depuis /admin/membres dans l'application.
