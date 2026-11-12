import { Suspense } from "react";
import type { Metadata } from "next";
import { getSpecialties } from "@/lib/data";
import SpecialtiesClient from "@/components/SpecialtiesClient";

export const revalidate = 600;
export const metadata: Metadata = { title: "جميع التخصصات" };

export default async function SpecialtiesPage() {
  const items = await getSpecialties();
  return (
    <Suspense fallback={<div className="container-page py-12">جارٍ التحميل...</div>}>
      <SpecialtiesClient items={items} />
    </Suspense>
  );
}
