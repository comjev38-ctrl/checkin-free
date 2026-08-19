-- ============================================================
-- CheckIn Free — Migration 09 : mot de passe provisoire obligatoire
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

alter table admins add column if not exists mot_de_passe_provisoire boolean not null default false;
