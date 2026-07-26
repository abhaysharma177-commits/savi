-- ─────────────────────────────────────────────────────────────────────────────
-- Second Opinion, Supabase schema
-- Run this in the Supabase SQL editor. Optional: the app runs on an in-memory
-- store when Supabase env vars are absent. Writes use the service-role key,
-- which bypasses RLS, so no policies are required for the demo.
-- ─────────────────────────────────────────────────────────────────────────────

-- Cases -----------------------------------------------------------------------
create table if not exists cases (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  raw_input text not null,
  structured_case jsonb,
  anonymised_case jsonb,
  triage jsonb,
  documents jsonb default '[]'::jsonb,
  user_id uuid,
  status text default 'created',
  session_id text
);

-- Reviews ---------------------------------------------------------------------
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  case_id uuid references cases(id) on delete cascade,
  specialist_type text not null,
  specialist_persona jsonb,
  review_content text,
  primary_diagnosis text,
  confidence_score integer,
  differential_diagnoses jsonb,
  red_flags jsonb,
  recommended_tests jsonb,
  status text default 'pending'
);

create index if not exists reviews_case_id_idx on reviews (case_id);

-- Consensus -------------------------------------------------------------------
create table if not exists consensus (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  case_id uuid references cases(id) on delete cascade,
  agreed_diagnosis text,
  confidence_distribution jsonb,
  disagreement_points jsonb,
  recommended_next_steps jsonb,
  gp_summary text,
  minority_view text,
  -- Full consensus object for lossless rehydration by the summary page.
  raw jsonb,
  -- The AI red-team safety pass.
  red_team jsonb
);

create index if not exists consensus_case_id_idx on consensus (case_id);

-- Clinician reviews (human sign-off) -----------------------------------------
create table if not exists clinician_reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  case_id uuid references cases(id) on delete cascade,
  clinician_id text not null,
  clinician jsonb,
  decision text not null,
  amended_diagnosis text,
  amended_summary text,
  note text,
  safety_confirmed boolean default false
);

create index if not exists clinician_reviews_case_id_idx on clinician_reviews (case_id);

-- Doctor opinions (several per case) and their AI-condensed consensus ----------
create table if not exists opinions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  case_id uuid references cases(id) on delete cascade,
  clinician_id text not null,
  clinician jsonb,
  diagnosis text,
  assessment text
);
create index if not exists opinions_case_id_idx on opinions (case_id);

create table if not exists doctor_consensus (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  case_id uuid references cases(id) on delete cascade,
  raw jsonb
);
create index if not exists doctor_consensus_case_id_idx on doctor_consensus (case_id);

-- Storage bucket for optional scan / blood-work uploads.
insert into storage.buckets (id, name, public)
values ('case-files', 'case-files', false)
on conflict (id) do nothing;
