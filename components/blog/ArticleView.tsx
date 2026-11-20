import Link from "next/link";
import type { ReactNode } from "react";
import type { BlogCategory, BlogPost, BlogPostLite } from "@/lib/blog";
import { readingMinutes } from "@/lib/markdown";
import MarkdownView from "./MarkdownView";
import PostCard, { arDate } from "./PostCard";
import ShareActions from "@/components/ShareActions";

/** عرض المقال (للصفحة العامة ومعاينة الإدارة). adAfterP3/adEnd: مواضع إعلانية اختيارية. */
export default function ArticleView({ post, category, related = [], categories = [], adAfterP3, adEnd }: {
  post: Pick<BlogPost, "title" | "excerpt" | "content_md" | "tags" | "author_name" | "cover_image_url" | "cover_image_alt" | "related_specialties" | "related_universities"> & { published_at: string | null; updated_at: string | null };
  category?: BlogCategory | null; related?: BlogPostLite[]; categories?: BlogCategory[]; adAfterP3?: ReactNode; adEnd?: ReactNode;
}) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const updated = post.updated_at && post.published_at && new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() > 86400000 ? post.updated_at : null;
  return (
    <article>
      <header className="mb-8">
        {category && <Link href={`/blog/category/${category.slug}`} prefetch={false} className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">{category.name_ar}</Link>}
        <h1 className="text-3xl font-black leading-snug md:text-4xl">{post.title}</h1>
        {post.excerpt && <p className="mt-3 text-lg leading-8 text-slate-600 dark:text-slate-400">{post.excerpt}</p>}
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
          {post.author_name && <span>الكاتب: {post.author_name}</span>}
          {post.published_at && <time dateTime={post.published_at}>نُشر في {arDate(post.published_at)}</time>}
          {updated && <time dateTime={updated}>آخر تحديث {arDate(updated)}</time>}
          <span>{readingMinutes(post.content_md)} د للقراءة</span>
        </p>
        <div className="mt-4"><ShareActions title={post.title} /></div>
      </header>
      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image_url} alt={post.cover_image_alt || post.title} className="mb-8 max-h-[26rem] w-full rounded-3xl object-cover" />
      )}
      <MarkdownView md={post.content_md} inject={adAfterP3 ? { afterParagraph: 3, node: adAfterP3 } : undefined} />
      {adEnd}
      {post.tags.length > 0 && <ul className="mt-8 flex flex-wrap gap-2" aria-label="الوسوم">{post.tags.map((t) => <li key={t} className="rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800">#{t}</li>)}</ul>}
      {(post.related_specialties.length > 0 || post.related_universities.length > 0) && (
        <section className="card mt-8" aria-labelledby="related-links">
          <h2 id="related-links" className="mb-3 text-lg font-black">روابط ذات صلة</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {post.related_specialties.map((s) => <li key={`s-${s}`}><Link prefetch={false} href={`/specialties/${s}`} className="chip">تخصص: {s}</Link></li>)}
            {post.related_universities.map((u) => <li key={`u-${u}`}><Link prefetch={false} href={`/universities/${u}`} className="chip">جامعة: {u}</Link></li>)}
            <li><Link prefetch={false} href="/calculator" className="chip">حاسبة المعدل</Link></li>
          </ul>
        </section>
      )}
      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related-posts">
          <h2 id="related-posts" className="section-title mb-4">مقالات ذات صلة</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((p) => <PostCard key={p.id} post={p} category={p.category_id ? byId.get(p.category_id) : null} />)}</div>
        </section>
      )}
    </article>
  );
}
