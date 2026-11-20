import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import BlogCategoryForm from "@/components/admin/BlogCategoryForm";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { deleteBlogCategory } from "@/app/admin/content-actions";

export const dynamic = "force-dynamic";
export default async function BlogCategoriesPage() {
  await requireAdmin();
  const { data, error } = await adminClient().from("blog_categories").select("id,slug,name_ar,description_ar,sort_order").order("sort_order").order("name_ar");
  const cats = (data ?? []) as any[];
  return (
    <div className="space-y-6">
      <div><Link href="/admin/blog" className="text-sm text-blue-600">← المقالات</Link><h1 className="section-title mt-2">تصنيفات المدونة</h1></div>
      {error && <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{error.message} — نفّذ migration المدونة أولاً.</p>}
      <section className="card"><h2 className="mb-3 text-lg font-black">تصنيف جديد</h2><BlogCategoryForm /></section>
      <div className="space-y-3">
        {cats.map((c) => (
          <div key={c.id} className="card space-y-3"><BlogCategoryForm cat={c} />
            <form action={deleteBlogCategory}><input type="hidden" name="id" value={c.id} /><ConfirmSubmit message="حذف التصنيف؟ تبقى مقالاته بلا تصنيف." className="text-xs text-red-600 underline">حذف التصنيف</ConfirmSubmit></form>
          </div>
        ))}
      </div>
    </div>
  );
}
