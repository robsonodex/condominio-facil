-- Enable pgcrypto for UUIDs if not already enabled (though gen_random_uuid is built-in for modern PG)
create extension if not exists pgcrypto;

-- 1. Table for Active Impersonations
create table if not exists impersonations (
  id uuid primary key default gen_random_uuid(),
  impersonator_id uuid not null references auth.users(id) on delete cascade, -- The SUPERADMIN
  target_user_id uuid not null references auth.users(id) on delete cascade,  -- The Syndic being impersonated
  started_at timestamptz default now(),
  expires_at timestamptz not null,
  ended_at timestamptz, -- If set, session is over
  reason text
);

-- Index for fast lookup of active sessions
create index idx_impersonations_active on impersonations (id) where ended_at is null;
create index idx_impersonations_expires on impersonations (expires_at);

-- 2. Audit Log for every action performed while impersonating
create table if not exists impersonation_action_logs (
  id uuid primary key default gen_random_uuid(),
  impersonation_id uuid references impersonations(id),
  impersonator_id uuid not null, -- Redundant but safe for direct querying
  target_user_id uuid,           -- The effective user
  method text,                   -- GET, POST, DELETE etc
  path text,                     -- The API path or Resource
  payload jsonb,                 -- Request body or summary of action
  response_status int,           -- (Optional) Status code of result
  created_at timestamptz default now()
);

-- RLS: Only Superadmin (via Service Role usually) should touch these.
-- But we can add RLS for extra safety.
alter table impersonations enable row level security;
alter table impersonation_action_logs enable row level security;

-- Policies
-- READ/WRITE: Only Service Role or Superadmin (using our is_superadmin() function)
create policy "Superadmin can manage impersonations"
  on impersonations
  for all
  using ( is_superadmin() );

create policy "Superadmin can view logs"
  on impersonation_action_logs
  for select
  using ( is_superadmin() );
