-- رفع الجامعات وروابط التخصصات ومعدلات القبول من ملف JSON داخل معاملة واحدة:
-- إما ينجح كل شيء أو لا يُحفظ شيء. آمن لإعادة التشغيل. خذ نسخة احتياطية قبل التنفيذ.
create or replace function import_universities_bundle(
  p_universities jsonb,
  p_links jsonb,
  p_rates jsonb,
  p_replace boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n_u int := 0;
  n_l int := 0;
  n_r int := 0;
begin
  -- 1) الجامعات الموجودة: تحديث الحقول المرسلة فقط (الحقل الفارغ في الملف لا يمسح القيمة الحالية)
  update universities u set
    name_ar = x.name_ar,
    name_fr = coalesce(x.name_fr, u.name_fr),
    type = coalesce(x.type, u.type),
    wilaya = coalesce(x.wilaya, u.wilaya),
    city = coalesce(x.city, u.city),
    address = coalesce(x.address, u.address),
    website_url = coalesce(x.website_url, u.website_url),
    latitude = coalesce(x.latitude, u.latitude),
    longitude = coalesce(x.longitude, u.longitude),
    description_ar = coalesce(x.description_ar, u.description_ar),
    is_published = coalesce(x.is_published, u.is_published),
    updated_at = now()
  from jsonb_to_recordset(coalesce(p_universities, '[]'::jsonb)) as x(
    slug text, name_ar text, name_fr text, type text, wilaya text, city text, address text,
    website_url text, latitude double precision, longitude double precision,
    description_ar text, is_published boolean
  )
  where u.slug = x.slug;

  -- 2) الجامعات الجديدة
  insert into universities (slug, name_ar, name_fr, type, wilaya, city, address, website_url, latitude, longitude, description_ar, is_published)
  select x.slug, x.name_ar, x.name_fr, x.type, x.wilaya, x.city, x.address, x.website_url, x.latitude, x.longitude, x.description_ar, coalesce(x.is_published, false)
  from jsonb_to_recordset(coalesce(p_universities, '[]'::jsonb)) as x(
    slug text, name_ar text, name_fr text, type text, wilaya text, city text, address text,
    website_url text, latitude double precision, longitude double precision,
    description_ar text, is_published boolean
  )
  where not exists (select 1 from universities u where u.slug = x.slug);
  n_u := jsonb_array_length(coalesce(p_universities, '[]'::jsonb));

  -- 3) وضع الاستبدال: حذف معدلات الجامعات المذكورة في الملف ثم إدراج ما في الملف فقط
  if p_replace then
    delete from acceptance_rates ar
    using universities u
    where ar.university_id = u.id
      and u.slug in (select y.slug from jsonb_to_recordset(coalesce(p_universities, '[]'::jsonb)) as y(slug text));
  end if;

  -- 4) ربط الجامعة بالتخصص
  insert into university_specialties (university_id, specialty_slug, faculty_name, is_active)
  select u.id, x.specialty_slug, x.faculty_name, coalesce(x.is_active, true)
  from jsonb_to_recordset(coalesce(p_links, '[]'::jsonb)) as x(university_slug text, specialty_slug text, faculty_name text, is_active boolean)
  join universities u on u.slug = x.university_slug
  on conflict (university_id, specialty_slug) do update set
    faculty_name = coalesce(excluded.faculty_name, university_specialties.faculty_name),
    is_active = excluded.is_active;
  n_l := jsonb_array_length(coalesce(p_links, '[]'::jsonb));

  -- 5) معدلات القبول (جامعة + تخصص + شعبة + سنة فريدة؛ إعادة الرفع تحدّث السجل ولا تكرره)
  insert into acceptance_rates (university_id, specialty_slug, bac_branch, year, score, source_url, source_title, notes, is_official, verified_at, updated_at)
  select u.id, x.specialty_slug, x.bac_branch, x.year, x.score,
         nullif(x.source_url, ''), nullif(x.source_title, ''), nullif(x.notes, ''),
         coalesce(x.is_official, false),
         case when coalesce(x.is_official, false) then now() else null end,
         now()
  from jsonb_to_recordset(coalesce(p_rates, '[]'::jsonb)) as x(
    university_slug text, specialty_slug text, bac_branch text, year integer, score numeric,
    source_url text, source_title text, notes text, is_official boolean
  )
  join universities u on u.slug = x.university_slug
  on conflict (university_id, specialty_slug, bac_branch, year) do update set
    score = excluded.score,
    source_url = excluded.source_url,
    source_title = excluded.source_title,
    notes = excluded.notes,
    is_official = excluded.is_official,
    verified_at = excluded.verified_at,
    updated_at = now();
  n_r := jsonb_array_length(coalesce(p_rates, '[]'::jsonb));

  return jsonb_build_object('universities', n_u, 'links', n_l, 'rates', n_r);
end;
$$;
revoke all on function import_universities_bundle(jsonb, jsonb, jsonb, boolean) from public, anon, authenticated;
grant execute on function import_universities_bundle(jsonb, jsonb, jsonb, boolean) to service_role;
