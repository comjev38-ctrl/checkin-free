-- ============================================================
-- CheckIn Free — Migration 06 : logo + bannière d'événement
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- "image_url" existait déjà et sert de bannière (grande image en
-- haut de la page événement). On ajoute une colonne dédiée au logo.
alter table events add column if not exists logo_url text;

-- ---------- Bucket de stockage public ----------
insert into storage.buckets (id, name, public)
values ('evenements', 'evenements', true)
on conflict (id) do nothing;

-- Lecture publique (tout le monde doit pouvoir voir les images sur
-- la page événement, sans être connecté).
drop policy if exists "Lecture publique bucket evenements" on storage.objects;
create policy "Lecture publique bucket evenements"
  on storage.objects for select
  using (bucket_id = 'evenements');

-- Seuls les membres de l'équipe admin peuvent envoyer/modifier/
-- supprimer des images (réutilise la fonction est_admin() créée
-- dans la migration 03, pas de récursion possible ici).
drop policy if exists "Admins envoient des images evenements" on storage.objects;
create policy "Admins envoient des images evenements"
  on storage.objects for insert
  with check (bucket_id = 'evenements' and public.est_admin());

drop policy if exists "Admins modifient des images evenements" on storage.objects;
create policy "Admins modifient des images evenements"
  on storage.objects for update
  using (bucket_id = 'evenements' and public.est_admin());

drop policy if exists "Admins suppriment des images evenements" on storage.objects;
create policy "Admins suppriment des images evenements"
  on storage.objects for delete
  using (bucket_id = 'evenements' and public.est_admin());
