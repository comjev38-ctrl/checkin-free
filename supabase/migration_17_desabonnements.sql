-- ============================================================
-- CheckIn Free — Migration 17 : désabonnement des invitations
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- Une fois désabonné d'une série (ex: "Repas chaud du jeudi"), un
-- email n'apparaît plus jamais dans les destinataires "anciens
-- participants" de cette série — ni via l'historique des billets,
-- ni via un import manuel. Le désabonnement est spécifique à la
-- série (voir la discussion RGPD : granularité par série, pas
-- globale à tout le site).

create table if not exists desabonnements_rappels (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  event_id uuid not null references events(id) on delete cascade, -- id de la série (modèle)
  created_at timestamptz not null default now()
);

create unique index if not exists idx_desabonnement_unique
  on desabonnements_rappels (lower(email), event_id);

alter table desabonnements_rappels enable row level security;

-- Seule l'équipe admin peut consulter la liste (utile pour un futur
-- réabonnement manuel, par exemple). L'ajout se fait uniquement via
-- la route serveur dédiée (clé service_role), jamais directement
-- depuis le navigateur d'un visiteur anonyme.
drop policy if exists "Equipe admin lit les desabonnements" on desabonnements_rappels;
create policy "Equipe admin lit les desabonnements"
  on desabonnements_rappels for select
  using (public.peut_gerer_evenements());
