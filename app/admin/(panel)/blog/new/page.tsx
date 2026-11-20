import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import BlogPostForm from "@/components/admin/BlogPostForm";

export const dynamic = "force-dynamic";
export default async function NewPostPage() {
  await requireAdmin();
  const sb = adminClient();
  const [cats, specs, unis] = await Promise.all([sb.from("blog_categories").select("id,name_ar").order("sort_order"), sb.from("specialties").select("slug").order("slug").limit(500), sb.from("universities").select("slug").order("slug").limit(500)]);
  return <div className="space-y-6"><div><Link href="/admin/blog" className="text-sm text-blue-600">← المقالات</Link><h1 className="section-title mt-2">مقال جديد</h1></div>
    <BlogPostForm categories={(cats.data ?? []) as any} specialtySlugs={((specs.data ?? []) as any[]).map((x) => x.slug)} universitySlugs={((unis.data ?? []) as any[]).map((x) => x.slug)} /></div>;
}
