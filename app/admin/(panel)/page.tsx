import { Suspense } from "react";
import Link from "next/link";
import { Download, FileUp } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { ActivitySection, DomainsSection, KpiSection, KpiSkeleton, SectionSkeleton, SpecialtiesSection, TrendSection } from "@/components/admin/DashboardSections";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await requireAdmin();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">لوحة التحكم</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">نظرة سريعة على المحتوى والجامعات والإعلانات.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/import#universities" className="btn-ghost"><FileUp size={14} />رفع جامعات ومعدلات</Link>
          <a href="/admin/export?format=json" className="btn-ghost"><Download size={14} />تخصصات JSON</a>
          <a href="/admin/export?format=csv" className="btn-ghost"><Download size={14} />CSV</a>
          <Link href="/admin/specialties/new" className="btn-primary !py-2">+ تخصص جديد</Link>
        </div>
      </div>

      <Suspense fallback={<KpiSkeleton />}><KpiSection /></Suspense>
      <Suspense fallback={<SectionSkeleton h="h-72" />}><TrendSection /></Suspense>
      <Suspense fallback={<SectionSkeleton h="h-56" />}><DomainsSection /></Suspense>
      <Suspense fallback={<SectionSkeleton h="h-96" />}><SpecialtiesSection /></Suspense>
      <Suspense fallback={<SectionSkeleton h="h-48" />}><ActivitySection /></Suspense>
    </div>
  );
}
