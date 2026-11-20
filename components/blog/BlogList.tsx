"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { BlogCategory, BlogPostLite } from "@/lib/blog";
import PostCard from "./PostCard";

const PAGE = 9;

/** قائمة مقالات مع بحث وتصفية بالتصنيف (يعمل عند العميل فتبقى الصفحة ثابتة). */
export default function BlogList({ posts, categories, activeCategory }: { posts: BlogPostLite[]; categories: BlogCategory[]; activeCategory?: string }) {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return posts.filter((p) => !n || [p.title, p.excerpt, ...p.tags].some((x) => x.toLowerCase().includes(n)));
  }, [posts, q]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[14rem] flex-1">
          <span className="sr-only">بحث في المقالات</span>
          <Search size={16} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="ابحث في المقالات" className="input !pr-11" />
        </label>
      </div>
      <nav aria-label="تصنيفات المدونة" className="flex flex-wrap gap-2">
        <Link href="/blog" prefetch={false} className={`chip ${!activeCategory ? "chip-active" : ""}`}>الكل</Link>
        {categories.map((c) => <Link key={c.id} href={`/blog/category/${c.slug}`} prefetch={false} className={`chip ${activeCategory === c.slug ? "chip-active" : ""}`}>{c.name_ar}</Link>)}
      </nav>
      <p className="text-xs text-slate-500" aria-live="polite">{list.length} مقالاً</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.slice(0, limit).map((p) => <PostCard key={p.id} post={p} category={p.category_id ? byId.get(p.category_id) : null} />)}
      </div>
      {!list.length && <p className="card text-slate-600 dark:text-slate-400">لا توجد مقالات مطابقة.</p>}
      {list.length > limit && <div className="text-center"><button type="button" onClick={() => setLimit((n) => n + PAGE)} className="btn-ghost">عرض المزيد ({list.length - limit} متبقية)</button></div>}
    </div>
  );
}
