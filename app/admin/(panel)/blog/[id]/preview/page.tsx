import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import ArticleView from "@/components/blog/ArticleView";
import { postState } from "@/lib/blog-validate";

export const dynamic = "force-dynamic";
export default async function PreviewPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = adminClient();
  const [post, cats] = await Promise.all([sb.from("blog_posts").select("*").eq("id", id).maybeSingle(), sb.from("blog_categories").select("id,slug,name_ar,description_ar,sort_order")]);
  if (!post.data) notFound();
  const p = post.data as any;
  const categories = (cats.data ?? []) as any[];
  const st = postState(p);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
        <span>معاينة للمدير فقط — الحالة: {st === "draft" ? "مسودة" : st === "scheduled" ? "مجدول" : "منشور"}</span>
        <Link href={`/admin/blog/${id}`} className="font-bold underline">العودة للتعديل</Link>
      </div>
      <div className="mx-auto max-w-3xl"><ArticleView post={p} category={categories.find((c) => c.id === p.category_id) ?? null} categories={categories} /></div>
    </div>
  );
}
