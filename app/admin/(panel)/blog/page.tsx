import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { postState } from "@/lib/blog-validate";
import { deleteBlogPost, setPostStatus } from "@/app/admin/content-actions";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";

export const dynamic = "force-dynamic";
const BADGE = { draft: ["مسودة", "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"], scheduled: ["مجدول", "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"], published: ["منشور", "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"] } as const;

export default async function AdminBlogPage() {
  await requireAdmin();
  const sb = adminClient();
  const [postsRes, catsRes] = await Promise.all([
    sb.from("blog_posts").select("id,slug,title,status,published_at,updated_at,category_id").order("updated_at", { ascending: false }).limit(300),
    sb.from("blog_categories").select("id,name_ar"),
  ]);
  const cats = new Map(((catsRes.data ?? []) as any[]).map((c) => [c.id, c.name_ar]));
  const posts = (postsRes.data ?? []) as any[];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="section-title">المدونة</h1><p className="mt-2 text-sm text-slate-500">مقالات بصيغة Markdown، مسودة أو منشورة أو مجدولة.</p></div>
        <div className="flex gap-2"><Link href="/admin/blog/categories" className="btn-ghost">التصنيفات</Link><Link href="/admin/blog/new" className="btn-primary">+ مقال جديد</Link></div>
      </div>
      {postsRes.error && <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">تعذر تحميل المقالات. نفّذ migration المدونة (20261120_blog_footer.sql). التفاصيل: {postsRes.error.message}</p>}
      <div className="table-wrap">
        <table className="w-full min-w-[40rem] text-right text-sm">
          <thead><tr className="bg-white/50 dark:bg-slate-800/40"><th className="th">العنوان</th><th className="th">التصنيف</th><th className="th">الحالة</th><th className="th">إجراءات</th></tr></thead>
          <tbody>
            {posts.map((p) => {
              const st = postState(p); const [label, cls] = BADGE[st];
              return (
                <tr key={p.id} className="border-t border-slate-200/60 dark:border-slate-700/60">
                  <td className="p-3"><Link href={`/admin/blog/${p.id}`} className="font-bold hover:text-blue-600">{p.title}</Link><div dir="ltr" className="text-xs text-slate-500">{p.slug}</div></td>
                  <td className="p-3">{p.category_id ? cats.get(p.category_id) ?? "—" : "—"}</td>
                  <td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span></td>
                  <td className="p-3"><div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/blog/${p.id}`} className="btn-ghost !px-3 !py-1 text-xs">تعديل</Link>
                    <Link href={`/admin/blog/${p.id}/preview`} className="btn-ghost !px-3 !py-1 text-xs">معاينة</Link>
                    <form action={setPostStatus}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="publish" value={st === "draft" ? "1" : "0"} /><button className="btn-ghost !px-3 !py-1 text-xs">{st === "draft" ? "نشر" : "إلغاء النشر"}</button></form>
                    <form action={deleteBlogPost}><input type="hidden" name="id" value={p.id} /><ConfirmSubmit message="حذف المقال نهائياً؟" className="text-xs text-red-600 underline">حذف</ConfirmSubmit></form>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!posts.length && !postsRes.error && <p className="p-8 text-center text-slate-500">لا مقالات بعد.</p>}
      </div>
    </div>
  );
}
