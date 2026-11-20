import Link from "next/link";
import type { BlogCategory, BlogPostLite } from "@/lib/blog";

export const arDate = (d: string) => new Date(d).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric", timeZone: "Africa/Algiers" });

export default function PostCard({ post, category }: { post: BlogPostLite; category?: BlogCategory | null }) {
  return (
    <article className="card card-hover group flex flex-col overflow-hidden !p-0">
      <Link href={`/blog/${post.slug}`} prefetch={false} className="flex flex-1 flex-col">
        {post.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt={post.cover_image_alt || post.title} loading="lazy" className="h-44 w-full object-cover" />
        ) : <div aria-hidden className="h-44 w-full bg-gradient-to-bl from-blue-900 via-blue-700 to-indigo-600" />}
        <div className="flex flex-1 flex-col gap-2 p-5">
          {category && <span className="w-fit rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">{category.name_ar}</span>}
          <h3 className="text-lg font-black leading-8 group-hover:text-blue-600">{post.title}</h3>
          {post.excerpt && <p className="line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{post.excerpt}</p>}
          <p className="mt-auto pt-2 text-xs text-slate-500">{arDate(post.published_at)}{post.author_name ? ` · ${post.author_name}` : ""}</p>
        </div>
      </Link>
    </article>
  );
}
