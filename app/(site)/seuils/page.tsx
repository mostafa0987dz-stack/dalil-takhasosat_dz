import type { Metadata } from "next";
import { getSpecialties } from "@/lib/data";
import SeuilsClient from "@/components/SeuilsClient";

export const revalidate = 600;
export const metadata: Metadata = { title: "عتبات القبول" };

export default async function SeuilsPage() {
  const items = await getSpecialties();
  const rows = items.flatMap((s) =>
    s.seuils.map((x) => ({ name: s.nom_ar, slug: s.slug, serie: x.serie, annee: x.annee, score: x.moyenne, note: x.remarque ?? "", demo: Boolean(x.demo) })),
  );
  return <SeuilsClient rows={rows} />;
}
