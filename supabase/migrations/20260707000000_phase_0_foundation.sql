create extension if not exists "pgcrypto";

create type search_run_status as enum (
  'queued',
  'running',
  'done',
  'partial',
  'failed'
);

create type source_status as enum (
  'pending',
  'scanning',
  'ai_approved',
  'ai_rejected',
  'needs_review',
  'approved',
  'rejected'
);

create type ai_verdict as enum (
  'approve',
  'reject',
  'needs_review'
);

create type scan_job_status as enum (
  'queued',
  'running',
  'paused',
  'done',
  'failed'
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table search_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  enabled boolean not null default false,
  api_key_env text not null,
  default_result_cap int not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_search_providers_updated_at
before update on search_providers
for each row
execute function set_updated_at();

create table app_settings (
  id uuid primary key default gen_random_uuid(),
  include_domains text[] not null default array[]::text[],
  result_cap_per_query int not null,
  crawl_max_pages int not null,
  crawl_max_depth int not null,
  crawl_char_budget int not null,
  chunk_size int not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_app_settings_updated_at
before update on app_settings
for each row
execute function set_updated_at();

create table keywords (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  location text null,
  notes text null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index keywords_topic_location_dedup_idx
on keywords (
  lower(btrim(topic)),
  lower(btrim(coalesce(location, '')))
);

create trigger set_keywords_updated_at
before update on keywords
for each row
execute function set_updated_at();

create table search_runs (
  id uuid primary key default gen_random_uuid(),
  status search_run_status not null default 'queued',
  started_at timestamptz null,
  finished_at timestamptz null,
  query_count int not null default 0,
  result_count int not null default 0,
  credits_spent_est int not null default 0,
  keywords_snapshot jsonb not null default '[]'::jsonb,
  providers_snapshot jsonb not null default '[]'::jsonb
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  site_url text not null unique,
  domain text not null,
  title text not null,
  snippet text not null,
  status source_status not null default 'pending',
  ai_verdict ai_verdict null,
  ai_confidence numeric null,
  ai_reason text null,
  extractable_fields text[] null,
  sample_preview jsonb null,
  evidence_urls text[] null,
  scan_step text null,
  human_note text null,
  first_discovered_at timestamptz not null default timezone('utc', now()),
  last_scanned_at timestamptz null
);

create table source_discoveries (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  keyword_id uuid not null references keywords(id) on delete cascade,
  run_id uuid not null references search_runs(id) on delete cascade,
  discovered_at timestamptz not null default timezone('utc', now())
);

create index source_discoveries_source_id_idx on source_discoveries(source_id);
create index source_discoveries_keyword_id_idx on source_discoveries(keyword_id);
create index source_discoveries_run_id_idx on source_discoveries(run_id);

create table scan_jobs (
  id uuid primary key default gen_random_uuid(),
  status scan_job_status not null default 'queued',
  total_sites int not null default 0,
  processed_sites int not null default 0,
  current_source_id uuid null references sources(id) on delete set null,
  started_at timestamptz null,
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_scan_jobs_updated_at
before update on scan_jobs
for each row
execute function set_updated_at();

insert into search_providers (
  name,
  enabled,
  api_key_env,
  default_result_cap,
  config
)
values (
  'Tavily',
  true,
  'TAVILY_API_KEY',
  10,
  '{}'::jsonb
);

insert into app_settings (
  include_domains,
  result_cap_per_query,
  crawl_max_pages,
  crawl_max_depth,
  crawl_char_budget,
  chunk_size
)
values (
  array[]::text[],
  10,
  15,
  1,
  60000,
  5
);
