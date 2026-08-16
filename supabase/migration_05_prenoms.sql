-- ============================================================
-- CheckIn Free — Migration 05 : prénom / nom séparés
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- ---------- Billets ----------
-- "nom" existait déjà et servait de "nom complet" ; on ajoute
-- "prenom" à côté. Les anciens billets auront prenom = null,
-- l'app affiche alors juste le contenu de "nom" tel quel.
alter table tickets add column if not exists prenom text;

-- ---------- Admins ----------
alter table admins add column if not exists prenom text;
alter table admins add column if not exists nom text;

-- Un membre admin peut mettre à jour sa propre fiche (prénom/nom).
-- Comparaison directe email = email : pas de sous-requête sur la
-- même table, donc pas de risque de récursion RLS ici.
drop policy if exists "Admin modifie son propre profil" on admins;
create policy "Admin modifie son propre profil"
  on admins for update
  using (email = auth.jwt() ->> 'email')
  with check (email = auth.jwt() ->> 'email');
