import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import SpecialtyForm from "@/components/admin/SpecialtyForm";

export const dynamic = "force-dynamic";

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
    <div>
      <h1 className="section-title mb-6">{isNew ? "تخصص جديد" : `تعديل: ${initial.nom_ar}`}</h1>
      <SpecialtyForm isNew={isNew} initial={initial} domains={domains} />
    </div>
  );
}
