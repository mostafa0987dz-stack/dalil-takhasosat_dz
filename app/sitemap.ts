import type { MetadataRoute } from "next";
import { getSpecialties } from "@/lib/data";
import { SERIES, SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const specialties = await getSpecialties();
  const fixed = ["", "/specialties", "/calculator", "/seuils", "/bac", "/compare", "/about", "/privacy"];
  return [
    ...fixed.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...SERIES.map((s) => ({ url: `${SITE_URL}/bac/${s.slug}` })),
    ...specialties.map((s) => ({ url: `${SITE_URL}/specialties/${s.slug}` })),
  ];
}
