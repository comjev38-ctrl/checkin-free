-- ============================================================
-- CheckIn Free — Migration 15 : mode d'envoi des rappels
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- "planifie" : envoyé automatiquement par la tâche planifiée
--              quotidienne, au jour/heure configurés.
-- "manuel"   : jamais envoyé automatiquement — seulement via le
--              bouton "Envoyer maintenant", quand l'admin décide.

alter table rappels_planifies add column if not exists mode_envoi text not null default 'planifie'
  check (mode_envoi in ('planifie', 'manuel'));
