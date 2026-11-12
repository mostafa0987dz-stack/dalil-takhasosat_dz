import type { Metadata } from "next";
import { getSpecialties } from "@/lib/data";
import FavoritesClient from "@/components/FavoritesClient";

export const metadata: Metadata = { title: "المفضلة" };

export default async function FavoritesPage() {
  return <FavoritesClient items={await getSpecialties()} />;
}
