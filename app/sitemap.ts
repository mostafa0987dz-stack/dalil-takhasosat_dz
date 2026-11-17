import type { MetadataRoute } from "next";
import { getSpecialties } from "@/lib/data";
import { SITE_URL } from "@/lib/constants";
import { getBacSeries } from "@/lib/series";
import { getPublishedUniversities } from "@/lib/universities";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [specialties, series, universities] = await Promise.all([getSpecialties(), getBacSeries(), getPublishedUniversities()]);
  const fixed: [string, number][] = [["", 1], ["/specialties", 0.9], ["/seuils", 0.8], ["/calculator", 0.8], ["/universities", 0.9], ["/finder", 0.7], ["/compare", 0.6], ["/bac", 0.7], ["/about", 0.3], ["/privacy", 0.2]];
  return [
    ...fixed.map(([p, priority]) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority })),
    ...universities.map((u) => ({ url: `${SITE_URL}/universities/${u.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...series.map((s) => ({ url: `${SITE_URL}/bac/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...specialties.map((s) => ({
      url: `${SITE_URL}/specialties/${s.slug}`,
      ...(s.updated_at ? { lastModified: new Date(s.updated_at) } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
