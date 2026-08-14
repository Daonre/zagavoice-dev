-- Profiles: maps auth users to an org
create table if not exists profiles (
  id uuid primary key references auth.users(id),
  org_id uuid not null default gen_random_uuid()
);

-- Agents: one Vapi assistant config per row
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  vapi_assistant_id text unique,
  name text not null,
  business_name text,
  greeting text,
  voice text,
  knowledge text,
  phone_number text,
  updated_at timestamptz default now()
);

-- Calls: one row per call, upserted on vapi_call_id
create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  agent_id uuid references agents(id),
  vapi_call_id text unique not null,
  caller_number text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  ended_reason text,
  summary text,
  transcript text,
  recording_url text
);

-- Leads: captured from structured call data
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  call_id uuid references calls(id),
  name text,
  phone text,
  email text,
  reason text
);
