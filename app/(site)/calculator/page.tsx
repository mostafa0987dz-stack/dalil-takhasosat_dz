import { Suspense } from "react";
import type { Metadata } from "next";
import { getSpecialties } from "@/lib/data";
import CalculatorClient from "@/components/CalculatorClient";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "حاسبة المعدل الموزون للتوجيه الجامعي",
  description: "احسب معدلك الموزون حسب شعبة البكالوريا والميدان الجامعي وقارنه بعتبات القبول في الجزائر.",
  alternates: { canonical: "/calculator" },
};

export default async function CalculatorPage() {
  const items = await getSpecialties();
  return (
    <Suspense fallback={<div className="container-page py-12 text-center">جاري التحميل...</div>}>
      <CalculatorClient items={items} />
    </Suspense>
  );
}
