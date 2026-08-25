-- ============================================================
-- CheckIn Free — Migration 10 : anti-doublon + suppression de billets
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- ---------- 1. Un même email ne peut avoir qu'un seul billet actif
--               par événement (filet de sécurité en base, en plus de
--               la vérification côté application) ----------
create unique index if not exists idx_un_billet_par_email_et_evenement
  on tickets (event_id, lower(email))
  where statut <> 'annule' and email is not null;

-- ---------- 2. L'équipe admin peut supprimer un billet (nettoyage
--               de fausses inscriptions, par ex.) ----------
drop policy if exists "Equipe admin supprime les billets" on tickets;
create policy "Equipe admin supprime les billets"
  on tickets for delete
  using (public.est_admin());
