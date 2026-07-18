create table public.leads (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text not null,
  phone text not null,
  need text not null,
  project_stage text not null,
  bottleneck text not null,
  consent_granted boolean not null,
  consented_at timestamptz not null,
  source text not null default 'landing_page',
  status text not null default 'new',

  constraint leads_name_length check (char_length(btrim(name)) between 2 and 120),
  constraint leads_email_length check (char_length(btrim(email)) between 5 and 254),
  constraint leads_company_length check (char_length(btrim(company)) between 2 and 160),
  constraint leads_phone_length check (char_length(btrim(phone)) between 7 and 32),
  constraint leads_bottleneck_length check (char_length(btrim(bottleneck)) between 10 and 4000),
  constraint leads_need_allowed check (
    need in ('backend', 'ai', 'ecommerce', 'optimization', 'not_sure')
  ),
  constraint leads_project_stage_allowed check (
    project_stage in ('idea', 'existing', 'migration', 'critical')
  ),
  constraint leads_consent_required check (consent_granted is true),
  constraint leads_source_allowed check (source in ('landing_page')),
  constraint leads_status_allowed check (status in ('new', 'contacted', 'qualified', 'closed', 'spam'))
);

comment on table public.leads is
  'Private lead submissions received through the DarkoSync diagnostic form.';

comment on column public.leads.request_id is
  'Client-generated idempotency key used to prevent duplicate submissions.';

alter table public.leads enable row level security;

revoke all on table public.leads from anon, authenticated;

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_created_at_idx on public.leads (status, created_at desc);

