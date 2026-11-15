import type { Metadata } from "next";
import { getSpecialties } from "@/lib/data";
import SeuilsClient from "@/components/SeuilsClient";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "عتبات القبول الجامعي حسب الشعبة والسنة",
  description: "جدول قابل للبحث والفلترة لعتبات القبول في التخصصات الجامعية الجزائرية حسب شعبة البكالوريا والسنة.",
  alternates: { canonical: "/seuils" },
};

export default async function SeuilsPage() {
  const items = await getSpecialties();
  const rows = items.flatMap((s) =>
    s.seuils.map((x) => ({ name: s.nom_ar, slug: s.slug, domaine: s.domaine, serie: x.serie, annee: x.annee, score: x.moyenne, note: x.remarque ?? "", demo: Boolean(x.demo) })),
  );
  return <SeuilsClient rows={rows} />;
}
