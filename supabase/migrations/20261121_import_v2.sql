-- المرحلة 3: نظام الاستيراد (متخصص + عام ZIP) مع سجل الاستيراد والتراجع.
-- غير مدمّر. نفّذه أولاً على نسخة تجريبية من Supabase ثم على الإنتاج. يتطلب migration الجامعات والمدونة سابقاً.

create table if not exists wilayas (
  code text primary key check (code ~ '^[0-9]{2}$'),
  name_ar text not null,
  name_fr text,
  created_at timestamptz not null default now()
);

create table if not exists faculties (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id) on delete cascade,
  name_ar text not null,
  name_fr text,
  created_at timestamptz not null default now(),
  unique (university_id, name_ar)
);
alter table university_specialties add column if not exists faculty_id uuid references faculties(id) on delete set null;

create table if not exists import_runs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('specialized','general')),
  dataset text,
  status text not null default 'previewed' check (status in ('previewed','committed','failed','undone')),
  file_name text,
  policy text check (policy in ('skip','update')),
  summary jsonb not null default '{}'::jsonb,
  report jsonb,
  manifest jsonb,
  payload jsonb not null,
  error text,
  created_by text not null,
  created_at timestamptz not null default now(),
  committed_at timestamptz,
  undone_at timestamptz
);
create table if not exists import_run_items (
  id bigint generated always as identity primary key,
  run_id uuid not null references import_runs(id) on delete cascade,
  table_name text not null,
  row_key text not null
);
create index if not exists import_run_items_run_idx on import_run_items (run_id);
create index if not exists import_runs_created_idx on import_runs (created_at desc);

alter table wilayas enable row level security;
alter table faculties enable row level security;
alter table import_runs enable row level security;       -- بلا سياسات: مفتاح الخدمة فقط
alter table import_run_items enable row level security;
drop policy if exists "public read wilayas" on wilayas;
create policy "public read wilayas" on wilayas for select to anon, authenticated using (true);
drop policy if exists "public read faculties" on faculties;
create policy "public read faculties" on faculties for select to anon, authenticated
  using (exists (select 1 from universities u where u.id = university_id and u.is_published));

-- تطبيق الاستيراد في معاملة واحدة: أي خطأ = تراجع كامل. لا نشر تلقائي: الجديد يُنشأ غير منشور/مسودة.
create or replace function apply_import_v2(p_run_id uuid, p_policy text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run import_runs%rowtype;
  v_payload jsonb;
  v_rep jsonb := '{}'::jsonb;
  v_a int; v_u int; v_total int;
  r record;
  v_slug text;
  v_pub boolean;
begin
  if p_policy not in ('skip','update') then raise exception 'Invalid policy'; end if;
  select * into v_run from import_runs where id = p_run_id for update;
  if not found then raise exception 'Import run not found'; end if;
  if v_run.status <> 'previewed' then raise exception 'Import run is not in previewed state'; end if;
  v_payload := v_run.payload;

  -- 1) شعب البكالوريا
  v_total := jsonb_array_length(coalesce(v_payload->'bac_series','[]'::jsonb));
  with ins as (
    insert into bac_series (slug, name_ar, name_fr, name_en, sort_order, is_active)
    select x.slug, x.name_ar, coalesce(x.name_fr,''), coalesce(x.name_en,''), coalesce(x.sort_order,0), coalesce(x.is_active,true)
    from jsonb_to_recordset(coalesce(v_payload->'bac_series','[]'::jsonb)) as x(slug text, name_ar text, name_fr text, name_en text, sort_order int, is_active boolean)
    on conflict (slug) do update set name_ar = excluded.name_ar, name_fr = excluded.name_fr, name_en = excluded.name_en,
      sort_order = excluded.sort_order, is_active = excluded.is_active
      where p_policy = 'update'
    returning slug, (xmax = 0) as inserted
  ), logi as (
    insert into import_run_items (run_id, table_name, row_key) select p_run_id, 'bac_series', slug from ins where inserted
  )
  select count(*) filter (where inserted), count(*) filter (where not inserted) into v_a, v_u from ins;
  v_rep := v_rep || jsonb_build_object('bac_series', jsonb_build_object('added', v_a, 'updated', v_u, 'skipped', v_total - v_a - v_u));

  -- 2) الولايات
  v_total := jsonb_array_length(coalesce(v_payload->'wilayas','[]'::jsonb));
  with ins as (
    insert into wilayas (code, name_ar, name_fr)
    select x.code, x.name_ar, x.name_fr
    from jsonb_to_recordset(coalesce(v_payload->'wilayas','[]'::jsonb)) as x(code text, name_ar text, name_fr text)
    on conflict (code) do update set name_ar = excluded.name_ar, name_fr = coalesce(excluded.name_fr, wilayas.name_fr)
      where p_policy = 'update'
    returning code, (xmax = 0) as inserted
  ), logi as (
    insert into import_run_items (run_id, table_name, row_key) select p_run_id, 'wilayas', code from ins where inserted
  )
  select count(*) filter (where inserted), count(*) filter (where not inserted) into v_a, v_u from ins;
  v_rep := v_rep || jsonb_build_object('wilayas', jsonb_build_object('added', v_a, 'updated', v_u, 'skipped', v_total - v_a - v_u));

  -- 3) الجامعات (الجديدة غير منشورة؛ المنشورة تبقى كما هي)
  v_total := jsonb_array_length(coalesce(v_payload->'universities','[]'::jsonb));
  with ins as (
    insert into universities (slug, name_ar, name_fr, type, wilaya, city, address, website_url, latitude, longitude, description_ar, is_published)
    select x.slug, x.name_ar, x.name_fr, x.type, x.wilaya, x.city, x.address, x.website_url, x.latitude, x.longitude, x.description_ar, false
    from jsonb_to_recordset(coalesce(v_payload->'universities','[]'::jsonb)) as x(
      slug text, name_ar text, name_fr text, type text, wilaya text, city text, address text, website_url text,
      latitude double precision, longitude double precision, description_ar text)
    on conflict (slug) do update set
      name_ar = excluded.name_ar,
      name_fr = coalesce(excluded.name_fr, universities.name_fr),
      type = coalesce(excluded.type, universities.type),
      wilaya = coalesce(excluded.wilaya, universities.wilaya),
      city = coalesce(excluded.city, universities.city),
      address = coalesce(excluded.address, universities.address),
      website_url = coalesce(excluded.website_url, universities.website_url),
      latitude = coalesce(excluded.latitude, universities.latitude),
      longitude = coalesce(excluded.longitude, universities.longitude),
      description_ar = coalesce(excluded.description_ar, universities.description_ar),
      updated_at = now()
      where p_policy = 'update'
    returning id, (xmax = 0) as inserted
  ), logi as (
    insert into import_run_items (run_id, table_name, row_key) select p_run_id, 'universities', id::text from ins where inserted
  )
  select count(*) filter (where inserted), count(*) filter (where not inserted) into v_a, v_u from ins;
  v_rep := v_rep || jsonb_build_object('universities', jsonb_build_object('added', v_a, 'updated', v_u, 'skipped', v_total - v_a - v_u));

  -- 4) الكليات والمعاهد
  v_total := jsonb_array_length(coalesce(v_payload->'faculties','[]'::jsonb));
  with ins as (
    insert into faculties (university_id, name_ar, name_fr)
    select u.id, x.name_ar, x.name_fr
    from jsonb_to_recordset(coalesce(v_payload->'faculties','[]'::jsonb)) as x(university_slug text, name_ar text, name_fr text)
    join universities u on u.slug = x.university_slug
    on conflict (university_id, name_ar) do update set name_fr = coalesce(excluded.name_fr, faculties.name_fr)
      where p_policy = 'update'
    returning id, (xmax = 0) as inserted
  ), logi as (
    insert into import_run_items (run_id, table_name, row_key) select p_run_id, 'faculties', id::text from ins where inserted
  )
  select count(*) filter (where inserted), count(*) filter (where not inserted) into v_a, v_u from ins;
  v_rep := v_rep || jsonb_build_object('faculties', jsonb_build_object('added', v_a, 'updated', v_u, 'skipped', v_total - v_a - v_u));
  update university_specialties us set faculty_id = f.id
    from faculties f
    where f.university_id = us.university_id and us.faculty_name = f.name_ar and us.faculty_id is null;

  -- 5) التخصصات (حلقة: save_specialty_bundle تستبدل عتبات التخصص؛ منشور يبقى كما هو)
  v_a := 0; v_u := 0; v_total := 0;
  for r in select value as s from jsonb_array_elements(coalesce(v_payload->'specialties','[]'::jsonb)) loop
    v_total := v_total + 1;
    v_slug := r.s->>'slug';
    select published into v_pub from specialties where slug = v_slug;
    if found then
      if p_policy = 'update' then
        perform save_specialty_bundle(jsonb_set(r.s - 'thresholds', '{published}', to_jsonb(v_pub)), coalesce(r.s->'thresholds','[]'::jsonb));
        v_u := v_u + 1;
      end if;
    else
      perform save_specialty_bundle(jsonb_set(r.s - 'thresholds', '{published}', 'false'::jsonb), coalesce(r.s->'thresholds','[]'::jsonb));
      insert into import_run_items (run_id, table_name, row_key) values (p_run_id, 'specialties', v_slug);
      v_a := v_a + 1;
    end if;
  end loop;
  v_rep := v_rep || jsonb_build_object('specialties', jsonb_build_object('added', v_a, 'updated', v_u, 'skipped', v_total - v_a - v_u));

  -- 6) العتبات ومعدلات القبول (يُنشأ ربط الجامعة بالتخصص إن لم يوجد)
  v_total := jsonb_array_length(coalesce(v_payload->'thresholds','[]'::jsonb));
  with newlinks as (
    insert into university_specialties (university_id, specialty_slug)
    select distinct u.id, x.specialty_slug
    from jsonb_to_recordset(coalesce(v_payload->'thresholds','[]'::jsonb)) as x(university_slug text, specialty_slug text)
    join universities u on u.slug = x.university_slug
    on conflict (university_id, specialty_slug) do nothing
    returning id
  )
  insert into import_run_items (run_id, table_name, row_key) select p_run_id, 'university_specialties', id::text from newlinks;

  with ins as (
    insert into acceptance_rates (university_id, specialty_slug, bac_branch, year, score, source_url, source_title, notes, is_official, verified_at, updated_at)
    select u.id, x.specialty_slug, x.bac_branch, x.year, x.score, x.source_url, x.source_title, x.notes,
           coalesce(x.is_official, false), case when coalesce(x.is_official, false) then now() else null end, now()
    from jsonb_to_recordset(coalesce(v_payload->'thresholds','[]'::jsonb)) as x(
      university_slug text, specialty_slug text, bac_branch text, year int, score numeric,
      source_url text, source_title text, notes text, is_official boolean)
    join universities u on u.slug = x.university_slug
    on conflict (university_id, specialty_slug, bac_branch, year) do update set
      score = excluded.score, source_url = excluded.source_url, source_title = excluded.source_title,
      notes = excluded.notes, is_official = excluded.is_official, verified_at = excluded.verified_at, updated_at = now()
      where p_policy = 'update'
    returning id, (xmax = 0) as inserted
  ), logi as (
    insert into import_run_items (run_id, table_name, row_key) select p_run_id, 'acceptance_rates', id::text from ins where inserted
  )
  select count(*) filter (where inserted), count(*) filter (where not inserted) into v_a, v_u from ins;
  v_rep := v_rep || jsonb_build_object('thresholds', jsonb_build_object('added', v_a, 'updated', v_u, 'skipped', v_total - v_a - v_u));

  -- 7) تصنيفات المدونة
  v_total := jsonb_array_length(coalesce(v_payload->'categories','[]'::jsonb));
  with ins as (
    insert into blog_categories (slug, name_ar, description_ar, sort_order)
    select x.slug, x.name_ar, x.description_ar, coalesce(x.sort_order, 0)
    from jsonb_to_recordset(coalesce(v_payload->'categories','[]'::jsonb)) as x(slug text, name_ar text, description_ar text, sort_order int)
    on conflict (slug) do update set name_ar = excluded.name_ar, description_ar = coalesce(excluded.description_ar, blog_categories.description_ar), sort_order = excluded.sort_order
      where p_policy = 'update'
    returning id, (xmax = 0) as inserted
  ), logi as (
    insert into import_run_items (run_id, table_name, row_key) select p_run_id, 'blog_categories', id::text from ins where inserted
  )
  select count(*) filter (where inserted), count(*) filter (where not inserted) into v_a, v_u from ins;
  v_rep := v_rep || jsonb_build_object('categories', jsonb_build_object('added', v_a, 'updated', v_u, 'skipped', v_total - v_a - v_u));

  -- 8) المقالات (دائماً مسودة عند الإنشاء؛ حالة المنشور الموجود لا تتغير)
  v_total := jsonb_array_length(coalesce(v_payload->'articles','[]'::jsonb));
  with ins as (
    insert into blog_posts (slug, title, excerpt, content_md, category_id, tags, author_name, cover_image_url, cover_image_alt,
                            status, published_at, seo_title, seo_description, og_image_url, canonical_url, keywords,
                            related_specialties, related_universities)
    select x.slug, x.title, coalesce(x.excerpt,''), coalesce(x.content_md,''),
           (select c.id from blog_categories c where c.slug = x.category_slug),
           coalesce(array(select jsonb_array_elements_text(x.tags)), '{}'), coalesce(x.author_name,''), x.cover_image_url, x.cover_image_alt,
           'draft', x.published_at, x.seo_title, x.seo_description, x.og_image_url, x.canonical_url,
           coalesce(array(select jsonb_array_elements_text(x.keywords)), '{}'),
           coalesce(array(select jsonb_array_elements_text(x.related_specialties)), '{}'),
           coalesce(array(select jsonb_array_elements_text(x.related_universities)), '{}')
    from jsonb_to_recordset(coalesce(v_payload->'articles','[]'::jsonb)) as x(
      slug text, title text, excerpt text, content_md text, category_slug text, tags jsonb, author_name text,
      cover_image_url text, cover_image_alt text, published_at timestamptz, seo_title text, seo_description text,
      og_image_url text, canonical_url text, keywords jsonb, related_specialties jsonb, related_universities jsonb)
    on conflict (slug) do update set
      title = excluded.title, excerpt = excluded.excerpt, content_md = excluded.content_md,
      category_id = coalesce(excluded.category_id, blog_posts.category_id), tags = excluded.tags, author_name = excluded.author_name,
      cover_image_url = excluded.cover_image_url, cover_image_alt = excluded.cover_image_alt,
      seo_title = excluded.seo_title, seo_description = excluded.seo_description, og_image_url = excluded.og_image_url,
      canonical_url = excluded.canonical_url, keywords = excluded.keywords,
      related_specialties = excluded.related_specialties, related_universities = excluded.related_universities, updated_at = now()
      where p_policy = 'update'
    returning id, (xmax = 0) as inserted
  ), logi as (
    insert into import_run_items (run_id, table_name, row_key) select p_run_id, 'blog_posts', id::text from ins where inserted
  )
  select count(*) filter (where inserted), count(*) filter (where not inserted) into v_a, v_u from ins;
  v_rep := v_rep || jsonb_build_object('articles', jsonb_build_object('added', v_a, 'updated', v_u, 'skipped', v_total - v_a - v_u));

  update import_runs set status = 'committed', policy = p_policy, report = v_rep, committed_at = now(), error = null where id = p_run_id;
  return v_rep;
end;
$$;

-- التراجع بعد النجاح: يحذف فقط السجلات التي أنشأها ذلك الاستيراد (لا يُعيد قيم السجلات المحدَّثة).
create or replace function undo_import_v2(p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_rep jsonb := '{}'::jsonb;
  n int;
  t text;
begin
  select status into v_status from import_runs where id = p_run_id for update;
  if not found then raise exception 'Import run not found'; end if;
  if v_status <> 'committed' then raise exception 'Only committed imports can be undone'; end if;

  with d as (delete from acceptance_rates where id::text in (select row_key from import_run_items where run_id = p_run_id and table_name = 'acceptance_rates') returning 1)
    select count(*) into n from d;  v_rep := v_rep || jsonb_build_object('acceptance_rates', n);
  with d as (delete from university_specialties where id::text in (select row_key from import_run_items where run_id = p_run_id and table_name = 'university_specialties') returning 1)
    select count(*) into n from d;  v_rep := v_rep || jsonb_build_object('university_specialties', n);
  with d as (delete from faculties where id::text in (select row_key from import_run_items where run_id = p_run_id and table_name = 'faculties') returning 1)
    select count(*) into n from d;  v_rep := v_rep || jsonb_build_object('faculties', n);
  with d as (delete from blog_posts where id::text in (select row_key from import_run_items where run_id = p_run_id and table_name = 'blog_posts') returning 1)
    select count(*) into n from d;  v_rep := v_rep || jsonb_build_object('blog_posts', n);
  with d as (delete from blog_categories where id::text in (select row_key from import_run_items where run_id = p_run_id and table_name = 'blog_categories') returning 1)
    select count(*) into n from d;  v_rep := v_rep || jsonb_build_object('blog_categories', n);
  with d as (delete from universities where id::text in (select row_key from import_run_items where run_id = p_run_id and table_name = 'universities') returning 1)
    select count(*) into n from d;  v_rep := v_rep || jsonb_build_object('universities', n);
  with d as (delete from specialties where slug in (select row_key from import_run_items where run_id = p_run_id and table_name = 'specialties') returning 1)
    select count(*) into n from d;  v_rep := v_rep || jsonb_build_object('specialties', n);
  with d as (delete from wilayas where code in (select row_key from import_run_items where run_id = p_run_id and table_name = 'wilayas') returning 1)
    select count(*) into n from d;  v_rep := v_rep || jsonb_build_object('wilayas', n);
  with d as (delete from bac_series where slug in (select row_key from import_run_items where run_id = p_run_id and table_name = 'bac_series') returning 1)
    select count(*) into n from d;  v_rep := v_rep || jsonb_build_object('bac_series', n);

  update import_runs set status = 'undone', undone_at = now() where id = p_run_id;
  return v_rep;
end;
$$;

revoke all on function apply_import_v2(uuid, text) from public, anon, authenticated;
grant execute on function apply_import_v2(uuid, text) to service_role;
revoke all on function undo_import_v2(uuid) from public, anon, authenticated;
grant execute on function undo_import_v2(uuid) to service_role;
