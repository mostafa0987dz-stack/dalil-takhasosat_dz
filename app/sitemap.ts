import type { MetadataRoute } from "next";
import { getSpecialties } from "@/lib/data";
import { SERIES, SITE_URL } from "@/lib/constants";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const specialties = await getSpecialties();
  const fixed: [string, number][] = [["", 1], ["/specialties", 0.9], ["/seuils", 0.8], ["/calculator", 0.8], ["/compare", 0.6], ["/bac", 0.7], ["/about", 0.3], ["/privacy", 0.2]];
  return [
    ...fixed.map(([p, priority]) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority })),
    ...SERIES.map((s) => ({ url: `${SITE_URL}/bac/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...specialties.map((s) => ({
      url: `${SITE_URL}/specialties/${s.slug}`,
      ...(s.updated_at ? { lastModified: new Date(s.updated_at) } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
