-- ============================================================
-- CheckIn Free — Migration 14 : anciens contacts (sans billet)
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- Jusqu'ici, la cible "anciens participants" d'un rappel se
-- déduisait uniquement des billets déjà émis sur les séances
-- passées. Cette table permet d'ajouter des contacts à cette liste
-- sans créer de billet — utile pour importer un fichier de contacts
-- qu'on veut relancer, sans les inscrire directement à la séance en
-- cours.

create table if not exists anciens_contacts (
  id uuid primary key default gen_random_uuid(),
  -- Toujours l'id du MODÈLE (série récurrente), jamais une séance
  -- précise — comme pour rappels_planifies, pour que ça reste valable
  -- semaine après semaine.
  event_id uuid not null references events(id) on delete cascade,
  prenom text not null,
  nom text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_ancien_contact_unique
  on anciens_contacts (event_id, lower(email));

alter table anciens_contacts enable row level security;

drop policy if exists "Equipe admin gere les anciens contacts" on anciens_contacts;
create policy "Equipe admin gere les anciens contacts"
  on anciens_contacts for all
  using (public.peut_gerer_evenements())
  with check (public.peut_gerer_evenements());
