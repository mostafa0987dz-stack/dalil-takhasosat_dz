-- المرحلة 2: المدونة + إعدادات الفوتر. غير مدمّر. نفّذه في Supabase SQL Editor.
create table if not exists blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ar text not null,
  description_ar text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  excerpt text not null default '',
  content_md text not null default '',
  category_id uuid references blog_categories(id) on delete set null,
  tags text[] not null default '{}',
  author_name text not null default '',
  cover_image_url text,
  cover_image_alt text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,            -- وقت النشر؛ إن كان مستقبلياً فالمقال «مجدول»
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  keywords text[] not null default '{}',
  related_specialties text[] not null default '{}',
  related_universities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_status_pub_idx on blog_posts (status, published_at desc);
create index if not exists blog_posts_category_idx on blog_posts (category_id);

alter table blog_categories enable row level security;
alter table blog_posts enable row level security;
drop policy if exists "public read blog categories" on blog_categories;
create policy "public read blog categories" on blog_categories for select to anon, authenticated using (true);
drop policy if exists "public read published posts" on blog_posts;
create policy "public read published posts" on blog_posts for select to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now());

-- الفوتر: قراءة عامة لمفتاح footer فقط من site_settings (الكتابة عبر الخادم بمفتاح الخدمة)
alter table site_settings enable row level security;
drop policy if exists "public read footer settings" on site_settings;
create policy "public read footer settings" on site_settings for select to anon, authenticated using (key = 'footer');
