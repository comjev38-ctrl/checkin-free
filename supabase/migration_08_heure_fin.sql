-- ============================================================
-- CheckIn Free — Migration 08 : heure de fin des séances récurrentes
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

alter table events add column if not exists heure_fin time;
