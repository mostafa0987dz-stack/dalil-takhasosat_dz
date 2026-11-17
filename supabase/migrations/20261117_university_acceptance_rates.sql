-- نظام الجامعات ومعدلات القبول حسب الجامعة والتخصص والشعبة والسنة
create extension if not exists pgcrypto;

create table if not exists universities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ar text not null,
  name_fr text,
  type text,
  wilaya text,
  city text,
  address text,
  website_url text,
  latitude double precision,
  longitude double precision,
  description_ar text,
  logo_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint universities_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint universities_longitude_range check (longitude is null or longitude between -180 and 180)
);

create table if not exists university_specialties (
  id bigint generated always as identity primary key,
  university_id uuid not null references universities(id) on delete cascade,
  specialty_slug text not null references specialties(slug) on delete cascade,
  faculty_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (university_id, specialty_slug)
);

create table if not exists acceptance_rates (
  id bigint generated always as identity primary key,
  university_id uuid not null references universities(id) on delete cascade,
  specialty_slug text not null references specialties(slug) on delete cascade,
  bac_branch text not null,
  year int not null check (year between 2000 and 2100),
  score numeric(5,2) check (score is null or score between 0 and 20),
  source_url text,
  source_title text,
  verified_at timestamptz,
  notes text,
  is_official boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_id, specialty_slug, bac_branch, year)
);

create index if not exists university_specialties_specialty_idx on university_specialties(specialty_slug, is_active);
create index if not exists acceptance_rates_lookup_idx on acceptance_rates(university_id, specialty_slug, year desc);

alter table universities enable row level security;
alter table university_specialties enable row level security;
alter table acceptance_rates enable row level security;

drop policy if exists "public read published universities" on universities;
create policy "public read published universities" on universities for select to anon, authenticated using (is_published = true);

drop policy if exists "public read active university specialties" on university_specialties;
create policy "public read active university specialties" on university_specialties for select to anon, authenticated
using (is_active and exists (select 1 from universities u where u.id = university_id and u.is_published));

drop policy if exists "public read acceptance rates" on acceptance_rates;
create policy "public read acceptance rates" on acceptance_rates for select to anon, authenticated
using (exists (select 1 from universities u where u.id = university_id and u.is_published)
and exists (select 1 from university_specialties us where us.university_id = acceptance_rates.university_id and us.specialty_slug = acceptance_rates.specialty_slug and us.is_active));

-- لا توجد سياسة كتابة عامة؛ تتم الإدارة لاحقاً من خادم موثوق بمفتاح service_role.
