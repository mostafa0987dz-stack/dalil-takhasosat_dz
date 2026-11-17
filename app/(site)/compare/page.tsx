import { Suspense } from "react";
import type { Metadata } from "next";
import { getSpecialties } from "@/lib/data";
import CompareClient from "@/components/CompareClient";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "مقارنة التخصصات الجامعية",
  description: "قارن حتى ثلاثة تخصصات جامعية جزائرية من حيث المدة والعتبات والمهارات وآفاق التوظيف.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage() {
  const items = await getSpecialties();
  return (
    <Suspense fallback={<div className="container-page py-12">جارٍ التحميل...</div>}>
      <CompareClient items={items} />
    </Suspense>
  );
}
