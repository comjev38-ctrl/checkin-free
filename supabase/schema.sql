-- ============================================================
-- CheckIn Free — Schéma Supabase
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Table événements ----------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titre text not null,
  description text,
  lieu text,
  date_debut timestamptz not null,
  image_url text,
  capacite_max integer, -- null = illimité
  statut text not null default 'brouillon' check (statut in ('brouillon','publie','clos')),
  admin_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- Table billets ----------
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  nom text not null,
  email text,
  -- Code court (8 caractères hex) encodé dans le QR : plus simple à
  -- ressaisir à la main que l'UUID complet si la caméra ne peut pas
  -- être utilisée à l'entrée.
  code text not null unique default encode(gen_random_bytes(4), 'hex'),
  statut text not null default 'valide' check (statut in ('valide','utilise','annule')),
  created_at timestamptz not null default now()
);

-- ---------- Table check-ins (historique des scans) ----------
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  scanned_by uuid references auth.users(id),
  scanned_at timestamptz not null default now()
);

create index if not exists idx_tickets_event on tickets(event_id);
create index if not exists idx_events_slug on events(slug);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table events enable row level security;
alter table tickets enable row level security;
alter table checkins enable row level security;

-- Lecture publique des événements publiés (page publique)
create policy "Lecture publique evenements publies"
  on events for select
  using (statut = 'publie');

-- L'admin authentifié voit et gère tous ses événements
create policy "Admin gere ses evenements"
  on events for all
  using (auth.uid() = admin_id)
  with check (auth.uid() = admin_id);

-- Inscription publique : n'importe qui peut créer un billet
-- (la vérification de capacité/statut se fait côté API route, avec la service_role key)
create policy "Inscription publique billets"
  on tickets for insert
  with check (true);

-- L'admin voit les billets de ses événements
create policy "Admin lit les billets de ses evenements"
  on tickets for select
  using (
    exists (
      select 1 from events
      where events.id = tickets.event_id
      and events.admin_id = auth.uid()
    )
  );

create policy "Admin met a jour les billets de ses evenements"
  on tickets for update
  using (
    exists (
      select 1 from events
      where events.id = tickets.event_id
      and events.admin_id = auth.uid()
    )
  );

-- Check-ins : lecture/écriture réservée à l'admin propriétaire
create policy "Admin gere les check-ins"
  on checkins for all
  using (
    exists (
      select 1 from tickets
      join events on events.id = tickets.event_id
      where tickets.id = checkins.ticket_id
      and events.admin_id = auth.uid()
    )
  );

-- Note : les routes API /api/register et /api/checkin utilisent la
-- clé service_role côté serveur (jamais exposée au client) pour
-- contourner RLS de façon contrôlée sur les opérations sensibles
-- (vérif capacité, marquage "utilisé", etc.)
