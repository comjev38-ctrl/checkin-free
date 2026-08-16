-- ============================================================
-- CheckIn Free — Migration 03 : correctif récursion infinie RLS
-- À exécuter dans Supabase > SQL Editor, en une seule fois
-- ============================================================
--
-- Problème : les policies de la migration 02 vérifient
-- l'appartenance à l'équipe en interrogeant la table "admins"
-- DEPUIS une policy SUR la table "admins" elle-même. Postgres
-- réapplique la policy à chaque sous-requête → boucle infinie
-- ("infinite recursion detected in policy for relation admins").
--
-- Solution : une fonction SECURITY DEFINER qui vérifie
-- l'appartenance en contournant le RLS (comme le recommande la
-- documentation Supabase pour ce cas précis).

create or replace function public.est_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins where email = auth.jwt() ->> 'email'
  );
$$;

-- ---------- Table admins ----------
drop policy if exists "Admins voient la liste des membres" on admins;
create policy "Admins voient la liste des membres"
  on admins for select
  using (public.est_admin());

drop policy if exists "Admins invitent des membres" on admins;
create policy "Admins invitent des membres"
  on admins for insert
  with check (public.est_admin());

drop policy if exists "Admins retirent des membres" on admins;
create policy "Admins retirent des membres"
  on admins for delete
  using (public.est_admin());

-- ---------- Table events ----------
drop policy if exists "Equipe admin gere les evenements" on events;
create policy "Equipe admin gere les evenements"
  on events for all
  using (public.est_admin())
  with check (public.est_admin());

-- ---------- Table tickets ----------
drop policy if exists "Equipe admin lit les billets" on tickets;
create policy "Equipe admin lit les billets"
  on tickets for select
  using (public.est_admin());

drop policy if exists "Equipe admin met a jour les billets" on tickets;
create policy "Equipe admin met a jour les billets"
  on tickets for update
  using (public.est_admin());

-- ---------- Table checkins ----------
drop policy if exists "Equipe admin gere les check-ins" on checkins;
create policy "Equipe admin gere les check-ins"
  on checkins for all
  using (public.est_admin())
  with check (public.est_admin());
