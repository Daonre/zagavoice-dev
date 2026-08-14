-- ZagaVoice schema: run this once in Supabase SQL Editor.
-- Multi-tenant: every client business is an "org". Row Level Security
-- guarantees each client only ever sees their own data.

create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_color text default '#22D3EE',
  logo_url text,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid references orgs on delete cascade,
  full_name text,
  role text default 'owner', -- owner | member
  created_at timestamptz default now()
);

create table agents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs on delete cascade not null,
  vapi_assistant_id text unique,
  name text not null default 'Receptionist',
  business_name text,
  greeting text,
  voice text default 'jennifer',
  knowledge text,          -- business info / FAQs the agent can answer from
  phone_number text,       -- the Vapi/Twilio number attached to this agent
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table calls (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs on delete cascade not null,
  agent_id uuid references agents on delete set null,
  vapi_call_id text unique,
  caller_number text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int default 0,
  ended_reason text,
  summary text,
  transcript text,
  recording_url text,
  created_at timestamptz default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs on delete cascade not null,
  call_id uuid references calls on delete set null,
  name text,
  phone text,
  email text,
  reason text,
  created_at timestamptz default now()
);

-- New signup: create an org and profile automatically
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare new_org uuid;
begin
  insert into orgs (name) values (coalesce(new.raw_user_meta_data->>'business_name', 'My Business'))
  returning id into new_org;
  insert into profiles (id, org_id, full_name)
  values (new.id, new_org, new.raw_user_meta_data->>'full_name');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security
alter table orgs enable row level security;
alter table profiles enable row level security;
alter table agents enable row level security;
alter table calls enable row level security;
alter table leads enable row level security;

create or replace function my_org() returns uuid language sql stable as
  $$ select org_id from profiles where id = auth.uid() $$;

create policy "own org" on orgs for select using (id = my_org());
create policy "own org update" on orgs for update using (id = my_org());
create policy "own profile" on profiles for select using (id = auth.uid());
create policy "org agents" on agents for all using (org_id = my_org());
create policy "org calls" on calls for select using (org_id = my_org());
create policy "org leads" on leads for all using (org_id = my_org());

create index calls_org_idx on calls (org_id, created_at desc);
create index leads_org_idx on leads (org_id, created_at desc);
