-- ============================================================
-- CheckIn Free — Migration 04 : événements "clos" visibles publiquement
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- Jusqu'ici, seuls les événements au statut "publie" étaient lisibles
-- par un visiteur anonyme. Un événement "clos" (page toujours visible,
-- inscriptions fermées) était donc invisible au lieu d'afficher le
-- message "inscriptions fermées".

drop policy if exists "Lecture publique evenements publies" on events;
create policy "Lecture publique evenements publies ou clos"
  on events for select
  using (statut in ('publie', 'clos'));
