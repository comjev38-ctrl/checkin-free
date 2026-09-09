-- ============================================================
-- CheckIn Free — Migration 16 : suivi des envois de rappels
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

create table if not exists rappels_envois (
  id uuid primary key default gen_random_uuid(),
  rappel_id uuid not null references rappels_planifies(id) on delete cascade,
  destinataire_email text not null,
  destinataire_nom text,
  statut text not null check (statut in ('envoye', 'echec')),
  declencheur text not null default 'planifie' check (declencheur in ('planifie', 'manuel')),
  erreur text,
  envoye_at timestamptz not null default now()
);

create index if not exists idx_rappels_envois_rappel on rappels_envois(rappel_id, envoye_at desc);

alter table rappels_envois enable row level security;

drop policy if exists "Equipe admin lit le suivi des rappels" on rappels_envois;
create policy "Equipe admin lit le suivi des rappels"
  on rappels_envois for select
  using (public.est_admin());
