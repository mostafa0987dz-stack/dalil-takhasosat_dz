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
drop policy if exists "public read published" on specialties;
drop policy if exists "public read thresholds" on thresholds;
create policy "public read published" on specialties
  for select to anon, authenticated using (published = true);
create policy "public read thresholds" on thresholds
  for select to anon, authenticated
  using (exists (select 1 from specialties s where s.slug = specialty_slug and s.published = true));

create index if not exists specialties_published_updated_idx on specialties (published, updated_at desc);
create index if not exists specialties_domaine_idx on specialties (domaine);
create index if not exists thresholds_slug_annee_idx on thresholds (specialty_slug, annee desc);
create index if not exists audit_log_created_idx on audit_log (created_at desc);
-- audit_log: بدون سياسات = لا وصول إلا عبر service_role

-- حفظ التخصص وعتباته داخل معاملة واحدة حتى لا تبقى البيانات نصف محدثة عند الفشل.
create or replace function save_specialty_bundle(p_specialty jsonb, p_thresholds jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text := p_specialty->>'slug';
begin
  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Invalid specialty slug';
  end if;
  insert into specialties (slug, nom_ar, nom_fr, domaine, diplome, duree, description_ar, filiere, competences, debouches, universites, tags, published, updated_at)
  values (
    v_slug, p_specialty->>'nom_ar', coalesce(p_specialty->>'nom_fr',''), p_specialty->>'domaine',
    p_specialty->>'diplome', p_specialty->>'duree', p_specialty->>'description_ar',
    coalesce(array(select jsonb_array_elements_text(p_specialty->'filiere')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_specialty->'competences')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_specialty->'debouches')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_specialty->'universites')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_specialty->'tags')), '{}'),
    coalesce((p_specialty->>'published')::boolean, false), now()
  )
  on conflict (slug) do update set
    nom_ar=excluded.nom_ar, nom_fr=excluded.nom_fr, domaine=excluded.domaine, diplome=excluded.diplome,
    duree=excluded.duree, description_ar=excluded.description_ar, filiere=excluded.filiere,
    competences=excluded.competences, debouches=excluded.debouches, universites=excluded.universites,
    tags=excluded.tags, published=excluded.published, updated_at=now();

  delete from thresholds where specialty_slug = v_slug;
  insert into thresholds (specialty_slug, serie, annee, moyenne, remarque, is_demo)
  select v_slug, x.serie, x.annee, x.moyenne, x.remarque, coalesce(x.is_demo, true)
  from jsonb_to_recordset(coalesce(p_thresholds, '[]'::jsonb))
    as x(serie text, annee integer, moyenne numeric, remarque text, is_demo boolean);
end;
$$;
revoke all on function save_specialty_bundle(jsonb, jsonb) from public, anon, authenticated;
grant execute on function save_specialty_bundle(jsonb, jsonb) to service_role;


-- منصة الإعلانات والإعدادات والتحليلات
create table if not exists advertisers (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text, phone text, website text, notes text,
  created_at timestamptz not null default now()
);
create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid references advertisers(id) on delete set null,
  name text not null, source text not null check (source in ('direct','adsense','sponsored')),
  status text not null default 'draft' check (status in ('draft','pending','active','paused','ended','rejected')),
  starts_at timestamptz, ends_at timestamptz, pricing_model text not null default 'monthly' check (pricing_model in ('monthly','impressions','clicks','hybrid')),
  monthly_price numeric(12,2) not null default 0 check (monthly_price >= 0), currency text not null default 'DZD',
  budget numeric(12,2) not null default 0 check (budget >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists ads (
  id uuid primary key default gen_random_uuid(), campaign_id uuid references ad_campaigns(id) on delete cascade,
  title text not null, description text not null default '', image_url text, target_url text not null,
  placement text not null default 'inline' check (placement in ('home','specialty_top','inline','sidebar','footer')),
  locale text not null default 'all' check (locale in ('all','ar','fr','en')), device text not null default 'all' check (device in ('all','mobile','desktop')),
  specialty_slug text references specialties(slug) on delete set null, approved_by text, approved_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists ad_events (
  id bigint generated always as identity primary key, ad_id uuid not null references ads(id) on delete cascade,
  event_type text not null check (event_type in ('impression','click')), event_day date not null default current_date,
  created_at timestamptz not null default now()
);
create table if not exists site_settings (
  key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
alter table advertisers enable row level security;
alter table ad_campaigns enable row level security;
alter table ads enable row level security;
alter table ad_events enable row level security;
alter table site_settings enable row level security;
create index if not exists ad_campaigns_status_dates_idx on ad_campaigns(status, starts_at, ends_at);
create index if not exists ads_campaign_idx on ads(campaign_id);
create index if not exists ad_events_day_type_idx on ad_events(event_day, event_type);
create index if not exists ad_events_ad_day_idx on ad_events(ad_id, event_day);
-- لا توجد سياسات عامة لهذه الجداول؛ الإدارة عبر service_role فقط.

-- عرض الإعلانات النشطة والمعتمدة فقط للزوار.
drop policy if exists "public read approved ads" on ads;
create policy "public read approved ads" on ads for select to anon, authenticated
using (exists (select 1 from ad_campaigns c where c.id = campaign_id and c.status = 'active' and (c.starts_at is null or c.starts_at <= now()) and (c.ends_at is null or c.ends_at >= now())));

-- حقول إثراء بطاقات التخصصات والترجمة متعددة اللغات
alter table specialties add column if not exists nom_en text not null default '';
alter table specialties add column if not exists description_fr text not null default '';
alter table specialties add column if not exists description_en text not null default '';
alter table specialties add column if not exists subjects text[] not null default '{}';
alter table specialties add column if not exists study_fields text[] not null default '{}';
alter table specialties add column if not exists translations jsonb not null default '{}'::jsonb;

-- إنشاء الحملة والإعلان كوحدة ذرّية: إما ينجح الاثنان أو لا يُحفظ أيّ منهما.
create or replace function create_ad_campaign_bundle(p_campaign jsonb, p_ad jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_id uuid;
begin
  insert into ad_campaigns (name, source, status, pricing_model, monthly_price, currency)
  values (
    left(coalesce(p_campaign->>'name', ''), 120),
    p_campaign->>'source', 'pending', 'hybrid',
    greatest(coalesce((p_campaign->>'monthly_price')::numeric, 0), 0), 'DZD'
  ) returning id into v_campaign_id;

  insert into ads (campaign_id, title, target_url, placement, description, image_url, locale)
  values (
    v_campaign_id,
    left(coalesce(p_ad->>'title', ''), 120),
    p_ad->>'target_url',
    coalesce(p_ad->>'placement', 'inline'),
    left(coalesce(p_ad->>'description', ''), 300),
    nullif(p_ad->>'image_url', ''),
    coalesce(p_ad->>'locale', 'all')
  );
  return v_campaign_id;
end;
$$;
revoke all on function create_ad_campaign_bundle(jsonb, jsonb) from public, anon, authenticated;
grant execute on function create_ad_campaign_bundle(jsonb, jsonb) to service_role;

-- تسجيل حدث فقط لإعلان تمت الموافقة عليه وحملته نشطة وفي فترة العرض.
create or replace function record_ad_event(p_ad_id uuid, p_event_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type not in ('impression', 'click') then
    raise exception 'Invalid ad event type';
  end if;
  insert into ad_events (ad_id, event_type)
  select a.id, p_event_type
  from ads a
  join ad_campaigns c on c.id = a.campaign_id
  where a.id = p_ad_id
    and a.approved_at is not null
    and c.status = 'active'
    and (c.starts_at is null or c.starts_at <= now())
    and (c.ends_at is null or c.ends_at >= now());
end;
$$;
revoke all on function record_ad_event(uuid, text) from public, anon, authenticated;
grant execute on function record_ad_event(uuid, text) to service_role;

-- لا تعرض أي إعلان لم تتم الموافقة عليه صراحة.
drop policy if exists "public read approved ads" on ads;
create policy "public read approved ads" on ads for select to anon, authenticated
using (
  approved_at is not null
  and exists (
    select 1 from ad_campaigns c
    where c.id = campaign_id
      and c.status = 'active'
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at >= now())
  )
);

-- فحص حالة الحملة عبر دالة محدودة بدلاً من منح الزوار قراءة جدول الحملات.
create or replace function is_ad_campaign_active(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from ad_campaigns c
    where c.id = p_campaign_id
      and c.status = 'active'
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at >= now())
  );
$$;
revoke all on function is_ad_campaign_active(uuid) from public, anon, authenticated;
grant execute on function is_ad_campaign_active(uuid) to anon, authenticated, service_role;

drop policy if exists "public read approved ads" on ads;
create policy "public read approved ads" on ads for select to anon, authenticated
using (approved_at is not null and is_ad_campaign_active(campaign_id));

-- ===== تحديث 20261118: حفظ حقول الإثراء/الترجمة =====
-- إصلاح: دالة save_specialty_bundle لم تكن تحفظ حقول الإثراء/الترجمة
-- (nom_en, description_fr, description_en, subjects, study_fields) رغم وجود أعمدتها في الجدول.
-- آمن لإعادة التشغيل. خذ نسخة احتياطية قبل التنفيذ.
alter table specialties add column if not exists nom_en text not null default '';
alter table specialties add column if not exists description_fr text not null default '';
alter table specialties add column if not exists description_en text not null default '';
alter table specialties add column if not exists subjects text[] not null default '{}';
alter table specialties add column if not exists study_fields text[] not null default '{}';
alter table specialties add column if not exists translations jsonb not null default '{}'::jsonb;

create or replace function save_specialty_bundle(p_specialty jsonb, p_thresholds jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text := p_specialty->>'slug';
begin
  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Invalid specialty slug';
  end if;
  insert into specialties (
    slug, nom_ar, nom_fr, nom_en, domaine, diplome, duree, description_ar, description_fr, description_en,
    filiere, competences, debouches, universites, tags, subjects, study_fields, published, updated_at
  )
  values (
    v_slug, p_specialty->>'nom_ar', coalesce(p_specialty->>'nom_fr',''), coalesce(p_specialty->>'nom_en',''), p_specialty->>'domaine',
    p_specialty->>'diplome', p_specialty->>'duree', p_specialty->>'description_ar',
    coalesce(p_specialty->>'description_fr',''), coalesce(p_specialty->>'description_en',''),
    coalesce(array(select jsonb_array_elements_text(p_specialty->'filiere')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_specialty->'competences')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_specialty->'debouches')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_specialty->'universites')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_specialty->'tags')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_specialty->'subjects')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_specialty->'study_fields')), '{}'),
    coalesce((p_specialty->>'published')::boolean, false), now()
  )
  on conflict (slug) do update set
    nom_ar=excluded.nom_ar, nom_fr=excluded.nom_fr, nom_en=excluded.nom_en, domaine=excluded.domaine, diplome=excluded.diplome,
    duree=excluded.duree, description_ar=excluded.description_ar, description_fr=excluded.description_fr, description_en=excluded.description_en,
    filiere=excluded.filiere, competences=excluded.competences, debouches=excluded.debouches, universites=excluded.universites,
    tags=excluded.tags, subjects=excluded.subjects, study_fields=excluded.study_fields, published=excluded.published, updated_at=now();

  delete from thresholds where specialty_slug = v_slug;
  insert into thresholds (specialty_slug, serie, annee, moyenne, remarque, is_demo)
  select v_slug, x.serie, x.annee, x.moyenne, x.remarque, coalesce(x.is_demo, true)
  from jsonb_to_recordset(coalesce(p_thresholds, '[]'::jsonb))
    as x(serie text, annee integer, moyenne numeric, remarque text, is_demo boolean);
end;
$$;
revoke all on function save_specialty_bundle(jsonb, jsonb) from public, anon, authenticated;
grant execute on function save_specialty_bundle(jsonb, jsonb) to service_role;

-- فهرس مفيد لاختيار الإعلان حسب الموضع
create index if not exists ads_placement_idx on ads(placement, locale);
