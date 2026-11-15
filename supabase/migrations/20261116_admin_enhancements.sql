-- تحديث آمن لإضافة إدارة شعب البكالوريا وبياناتها متعددة اللغات.
create table if not exists public.bac_series (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ar text not null,
  name_fr text not null default '',
  name_en text not null default '',
  sort_order integer not null default 0 check (sort_order between 0 and 999),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bac_series enable row level security;
drop policy if exists "public read active bac series" on public.bac_series;
create policy "public read active bac series" on public.bac_series for select to anon, authenticated using (is_active = true);
create index if not exists bac_series_active_order_idx on public.bac_series(is_active, sort_order);
insert into public.bac_series (slug, name_ar, name_fr, name_en, sort_order, is_active) values
('sciences-experimentales','علوم تجريبية','Sciences expérimentales','Experimental Sciences',10,true),
('mathematiques','رياضيات','Mathématiques','Mathematics',20,true),
('technique-mathematique','تقني رياضي','Technique Mathématique','Technical Mathematics',30,true),
('lettres-philosophie','آداب وفلسفة','Lettres et Philosophie','Literature and Philosophy',40,true),
('langues-etrangeres','لغات أجنبية','Langues étrangères','Foreign Languages',50,true),
('gestion-economie','تسيير واقتصاد','Gestion et Économie','Management and Economics',60,true)
on conflict (slug) do update set name_ar=excluded.name_ar, name_fr=excluded.name_fr, name_en=excluded.name_en, sort_order=excluded.sort_order;
create index if not exists audit_log_action_created_idx on public.audit_log(action, created_at desc);
