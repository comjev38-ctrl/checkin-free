-- ============================================================
-- CheckIn Free — Migration 12 : rappel automatique la veille
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

alter table events add column if not exists rappel_envoye boolean not null default false;
