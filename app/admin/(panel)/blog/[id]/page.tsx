import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import BlogPostForm from "@/components/admin/BlogPostForm";

export const dynamic = "force-dynamic";
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = adminClient();
  const [post, cats, specs, unis] = await Promise.all([sb.from("blog_posts").select("*").eq("id", id).maybeSingle(), sb.from("blog_categories").select("id,name_ar").order("sort_order"), sb.from("specialties").select("slug").order("slug").limit(500), sb.from("universities").select("slug").order("slug").limit(500)]);
  if (!post.data) notFound();
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><Link href="/admin/blog" className="text-sm text-blue-600">← المقالات</Link><h1 className="section-title mt-2">تعديل المقال</h1></div><Link href={`/admin/blog/${id}/preview`} className="btn-ghost">معاينة</Link></div>
    <BlogPostForm post={post.data as any} categories={(cats.data ?? []) as any} specialtySlugs={((specs.data ?? []) as any[]).map((x) => x.slug)} universitySlugs={((unis.data ?? []) as any[]).map((x) => x.slug)} /></div>;
}
