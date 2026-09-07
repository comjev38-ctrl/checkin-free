-- ============================================================
-- CheckIn Free — Migration 13 : rappels configurables
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- Remplace le rappel fixe (1 jour avant, contenu figé) par un
-- système où chaque événement peut avoir PLUSIEURS rappels, chacun
-- avec son propre délai, son contenu, et sa cible (inscrits actuels,
-- ou anciens participants pour relancer sur une nouvelle séance).

create table if not exists rappels_planifies (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,

  jours_avant integer not null check (jours_avant >= 0),
  heure time not null default '09:00',

  cible text not null default 'inscrits' check (cible in ('inscrits', 'anciens_participants')),

  sujet text not null,
  accroche text not null,
  description text,
  texte_bouton text not null default 'Voir l''événement',
  lien_bouton text,
  couleur_accent text not null default '#5B5FEF',
  nom_expediteur text,

  actif boolean not null default true,
  derniere_execution_paris date,

  created_at timestamptz not null default now()
);

create index if not exists idx_rappels_event on rappels_planifies(event_id);

alter table rappels_planifies enable row level security;

drop policy if exists "Equipe admin gere les rappels" on rappels_planifies;
create policy "Equipe admin gere les rappels"
  on rappels_planifies for all
  using (public.peut_gerer_evenements())
  with check (public.peut_gerer_evenements());

-- L'ancienne colonne rappel_envoye (migration 12) n'est plus utilisée
-- par ce nouveau système — elle peut rester en base sans gêner (elle
-- n'est simplement plus lue), pas besoin de la supprimer.
