-- نفّذ هذا الملف في Supabase: SQL Editor > New query
create table if not exists specialties (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nom_ar text not null,
  nom_fr text not null default '',
  domaine text not null,
  diplome text not null,
  duree text not null,
  description_ar text not null,
  filiere text[] not null default '{}',
  competences text[] not null default '{}',
  debouches text[] not null default '{}',
  universites text[] not null default '{}',
  tags text[] not null default '{}',
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists thresholds (
  id bigint generated always as identity primary key,
  specialty_slug text not null references specialties(slug) on delete cascade on update cascade,
  serie text not null,
  annee int not null check (annee between 2000 and 2100),
  moyenne numeric(4,2) check (moyenne is null or (moyenne >= 0 and moyenne <= 20)),
  remarque text,
  is_demo boolean not null default true,
  unique (specialty_slug, serie, annee)
);

create table if not exists audit_log (
  id bigint generated always as identity primary key,
  admin_email text not null,
  action text not null,
  slug text,
  created_at timestamptz not null default now()
);

alter table specialties enable row level security;
alter table thresholds enable row level security;
alter table audit_log enable row level security;

-- القراءة العامة للمنشور فقط. الكتابة تتم من الخادم بمفتاح service_role (يتجاوز RLS).
create policy "public read published" on specialties
  for select to anon, authenticated using (published);
create policy "public read thresholds" on thresholds
  for select to anon, authenticated
  using (exists (select 1 from specialties s where s.slug = specialty_slug and s.published));
-- audit_log: بدون سياسات = لا وصول إلا عبر service_role
