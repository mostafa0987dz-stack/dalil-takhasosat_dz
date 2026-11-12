import type { Metadata } from "next";
import { getSpecialties } from "@/lib/data";
import CalculatorClient from "@/components/CalculatorClient";

export const metadata: Metadata = { title: "حاسبة المعدل" };

export default async function CalculatorPage({ searchParams }: { searchParams: { specialty?: string } }) {
  const items = await getSpecialties();
  return <CalculatorClient items={items} initialSpecialty={searchParams.specialty ?? ""} />;
}
