import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

export type BlogCategory = { id: string; slug: string; name_ar: string; description_ar: string | null; sort_order: number };
export type BlogPostLite = {
  id: string; slug: string; title: string; excerpt: string; category_id: string | null; tags: string[];
  author_name: string; cover_image_url: string | null; cover_image_alt: string | null; published_at: string; updated_at: string;
};
export type BlogPost = BlogPostLite & {
  content_md: string; status: "draft" | "published"; seo_title: string | null; seo_description: string | null; og_image_url: string | null;
  canonical_url: string | null; keywords: string[]; related_specialties: string[]; related_universities: string[];
};

const LITE = "id,slug,title,excerpt,category_id,tags,author_name,cover_image_url,cover_image_alt,published_at,updated_at";
const FULL = `${LITE},content_md,status,seo_title,seo_description,og_image_url,canonical_url,keywords,related_specialties,related_universities`;

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

/** المنشور فقط (RLS تضمن status=published وpublished_at <= now). */
async function load_getBlogCategories(): Promise<BlogCategory[]> {
  const sb = client();
  if (!sb) return [];
  const { data, error } = await sb.from("blog_categories").select("id,slug,name_ar,description_ar,sort_order").order("sort_order").order("name_ar");
  if (error) { console.error("blog categories", error.message); return []; }
  return (data ?? []) as BlogCategory[];
}
export const getBlogCategories = cache(load_getBlogCategories);

async function load_getPublishedPosts(limit: number): Promise<BlogPostLite[]> {
  const sb = client();
  if (!sb) return [];
  const { data, error } = await sb.from("blog_posts").select(LITE).order("published_at", { ascending: false }).limit(limit);
  if (error) { console.error("blog posts", error.message); return []; }
  return (data ?? []) as BlogPostLite[];
}
export const getPublishedPosts = cache(load_getPublishedPosts);

async function load_getPostBySlug(slug: string): Promise<BlogPost | null> {
  const sb = client();
  if (!sb) return null;
  const { data, error } = await sb.from("blog_posts").select(FULL).eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return data as BlogPost;
}
export const getPostBySlug = cache(load_getPostBySlug);

/** مقالات ذات صلة: نفس التصنيف أولاً ثم الأحدث. */
export function relatedPosts(all: BlogPostLite[], post: { id: string; category_id: string | null }, n = 3): BlogPostLite[] {
  const others = all.filter((p) => p.id !== post.id);
  const same = others.filter((p) => post.category_id && p.category_id === post.category_id);
  return [...same, ...others.filter((p) => !same.includes(p))].slice(0, n);
}

export const postPath = (slug: string) => `/blog/${slug}`;
