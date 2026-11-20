import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlogList from "@/components/blog/BlogList";
import { getBlogCategories, getPublishedPosts } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "المدونة — دليل التوجيه الجامعي في الجزائر",
  description: "مقالات في دليل البكالوريا والتوجيه الجامعي واختيار التخصص والحياة الجامعية والمنح والمهن في الجزائر.",
  alternates: { canonical: `${SITE_URL}/blog`, types: { "application/rss+xml": `${SITE_URL}/blog/rss.xml` } },
  openGraph: { type: "website", locale: "ar_DZ", siteName: SITE_NAME, url: `${SITE_URL}/blog`, title: "المدونة", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }] },
};

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getPublishedPosts(200), getBlogCategories()]);
  return (
    <section className="container-page py-12">
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: "المدونة" }]} />
      <h1 className="section-title mb-3">المدونة</h1>
      <p className="mb-8 max-w-3xl leading-8 text-slate-600 dark:text-slate-400">مقالات تساعدك على فهم التوجيه الجامعي واختيار التخصص المناسب لك.</p>
      {posts.length ? <BlogList posts={posts} categories={categories} /> : <p className="card text-slate-600 dark:text-slate-400">لم تُنشر مقالات بعد.</p>}
    </section>
  );
}
