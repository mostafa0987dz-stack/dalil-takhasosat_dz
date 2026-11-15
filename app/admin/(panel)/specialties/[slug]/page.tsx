import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import SpecialtyForm from "@/components/admin/SpecialtyForm";

export const dynamic = "force-dynamic";

export default async function EditSpecialty({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const sb = adminClient();
  const isNew = slug === "new";
  let initial: any = null;
  if (!isNew) {
    const { data } = await sb.from("specialties").select("*, thresholds(*)").eq("slug", slug).maybeSingle();
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
