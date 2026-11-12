import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import SpecialtyForm from "@/components/admin/SpecialtyForm";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function EditSpecialty({ params }: { params: { slug: string } }) {
  await requireAdmin();
  const sb = adminClient();
  const isNew = params.slug === "new";
  let initial: any = null;
  
  if (!isNew) {
    const { data } = await sb.from("specialties").select("*, thresholds(*)").eq("slug", params.slug).maybeSingle();
    if (!data) notFound();
    initial = data;
  }
  
  const { data: doms } = await sb.from("specialties").select("domaine");
  const domains = Array.from(new Set(((doms ?? []) as any[]).map((d) => d.domaine as string)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white">
          {isNew ? "إضافة تخصص جديد" : `تعديل: ${initial.nom_ar}`}
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {isNew ? "املأ الحقول أدناه لإضافة تخصص جديد للدليل." : "قم بتعديل بيانات هذا التخصص."}
        </p>
      </div>
      
      {/* ملاحظة: سنقوم بتصميم نموذج SpecialtyForm لاحقاً ليكون زجاجياً أيضاً */}
      <div className="rounded-3xl border border-white/50 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60">
        <SpecialtyForm isNew={isNew} initial={initial} domains={domains} />
      </div>
    </div>
  );
}
