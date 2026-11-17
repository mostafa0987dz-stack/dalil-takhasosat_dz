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
