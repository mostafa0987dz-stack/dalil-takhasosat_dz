import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlogList from "@/components/blog/BlogList";
import { getBlogCategories, getPublishedPosts } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const revalidate = 600;
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getBlogCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getBlogCategories()).find((x) => x.slug === slug);
  if (!c) return {};
  const url = `${SITE_URL}/blog/category/${slug}`;
  return {
    title: `${c.name_ar} — المدونة`,
    description: c.description_ar || `مقالات تصنيف ${c.name_ar} في دليل التوجيه الجامعي.`,
    alternates: { canonical: url },
    openGraph: { type: "website", locale: "ar_DZ", siteName: SITE_NAME, url, title: c.name_ar, images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }] },
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  const [categories, posts] = await Promise.all([getBlogCategories(), getPublishedPosts(200)]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const filtered = posts.filter((p) => p.category_id === category.id);
  return (
    <section className="container-page py-12">
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: "المدونة", href: "/blog" }, { name: category.name_ar }]} />
      <h1 className="section-title mb-3">{category.name_ar}</h1>
      {category.description_ar && <p className="mb-8 max-w-3xl leading-8 text-slate-600 dark:text-slate-400">{category.description_ar}</p>}
      {filtered.length ? <BlogList posts={filtered} categories={categories} activeCategory={slug} /> : <p className="card text-slate-600 dark:text-slate-400">لا توجد مقالات في هذا التصنيف بعد.</p>}
    </section>
  );
}
