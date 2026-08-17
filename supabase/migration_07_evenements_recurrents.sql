-- ============================================================
-- CheckIn Free — Migration 07 : événements récurrents
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- Principe : un événement "récurrent" (ex: repas chaud hebdomadaire)
-- est stocké comme un événement MODÈLE (recurrence = 'hebdomadaire',
-- jour_semaine + heure_debut définissent le rythme, pas de date
-- fixe qui compte vraiment). Chaque semaine, une SÉANCE est créée
-- automatiquement : un événement normal, avec sa propre date, ses
-- propres billets, reliée au modèle via parent_event_id.
--
-- Le modèle apparaît sur la page d'accueil (lien stable, jamais
-- changé). Les séances ne s'affichent jamais toutes seules sur la
-- page d'accueil (elles sont "enfants"), seulement via l'historique
-- admin ou en étant "la séance actuelle" du modèle.

alter table events add column if not exists parent_event_id uuid references events(id) on delete cascade;
alter table events add column if not exists recurrence text check (recurrence in ('hebdomadaire'));
alter table events add column if not exists jour_semaine int check (jour_semaine between 1 and 7); -- 1=lundi ... 7=dimanche (ISO)
alter table events add column if not exists heure_debut time;

-- Une seule séance par date pour un même modèle (évite les doublons
-- si deux visiteurs déclenchent la création en même temps).
create unique index if not exists idx_une_seance_par_date
  on events (parent_event_id, date_debut)
  where parent_event_id is not null;

create index if not exists idx_events_parent on events(parent_event_id);
