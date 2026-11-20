import type { MetadataRoute } from "next";
import { getSpecialties } from "@/lib/data";
import { SITE_URL } from "@/lib/constants";
import { getBacSeries } from "@/lib/series";
import { getSitemapPairs, getSitemapUniversities } from "@/lib/universities";
import { getBlogCategories, getPublishedPosts } from "@/lib/blog";

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];
const MAX_URLS = 50000; // حد بروتوكول sitemap لملف واحد

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [specialties, series, universities, pairs, posts, blogCats] = await Promise.all([getSpecialties(), getBacSeries(), getSitemapUniversities(), getSitemapPairs(), getPublishedPosts(500), getBlogCategories()]);
  const built = new Date(); // تاريخ البناء/آخر إعادة توليد للصفحات الثابتة
  const date = (d: string | null | undefined) => (d ? new Date(d) : built);

  const fixed: [string, Entry["changeFrequency"], number][] = [
    ["", "daily", 1],
    ["/specialties", "weekly", 0.8], ["/universities", "weekly", 0.8], ["/bac", "weekly", 0.8], ["/finder", "weekly", 0.8], ["/calculator", "weekly", 0.8],
    ["/blog", "daily", 0.8], ["/discover", "weekly", 0.7], ["/compare", "weekly", 0.5], ["/faq", "monthly", 0.3], ["/terms", "monthly", 0.3], ["/contact", "monthly", 0.3],
    ["/about", "monthly", 0.3], ["/privacy", "monthly", 0.3],
  ];
  const entries: MetadataRoute.Sitemap = [
    ...fixed.map(([p, changeFrequency, priority]) => ({ url: `${SITE_URL}${p}`, lastModified: built, changeFrequency, priority })),
    ...specialties.map((s) => ({ url: `${SITE_URL}/specialties/${s.slug}`, lastModified: date(s.updated_at), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...universities.map((u) => ({ url: `${SITE_URL}/universities/${u.slug}`, lastModified: date(u.lastmod), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: date(p.updated_at), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...blogCats.map((c) => ({ url: `${SITE_URL}/blog/category/${c.slug}`, lastModified: built, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...series.map((s) => ({ url: `${SITE_URL}/bac/${s.slug}`, lastModified: built, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...pairs.map((p) => ({ url: `${SITE_URL}/specialties/${p.specialty_slug}/${p.university_slug}`, lastModified: date(p.lastmod), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
  // TODO: عند تجاوز 50000 رابط قسّم إلى عدة sitemaps (generateSitemaps أو route لفهرس)؛ الحجم الحالي أقل بكثير.
  return entries.slice(0, MAX_URLS);
}
