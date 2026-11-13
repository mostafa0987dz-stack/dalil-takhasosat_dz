import type { Metadata } from "next";
import { getSpecialties } from "@/lib/data";
import FavoritesClient from "@/components/FavoritesClient";

export const metadata: Metadata = { title: "المفضلة", robots: { index: false, follow: true } };

export default async function FavoritesPage() {
  return <FavoritesClient items={await getSpecialties()} />;
}
