import { Suspense } from "react";
import CalculatorClient from "@/components/CalculatorClient";

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="container-page py-12 text-center">جاري التحميل...</div>}>
      <CalculatorClient />
    </Suspense>
  );
}
