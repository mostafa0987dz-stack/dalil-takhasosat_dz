import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleView from "@/components/blog/ArticleView";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";
import { getBlogCategories, getPostBySlug, getPublishedPosts, relatedPosts } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const revalidate = 600;
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPublishedPosts(500)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "المقال غير موجود", robots: { index: false } };
  const title = post.seo_title?.trim() || post.title;
  const description = post.seo_description?.trim() || post.excerpt || undefined;
  const url = post.canonical_url?.trim() || `${SITE_URL}/blog/${slug}`;
  const image = post.og_image_url || post.cover_image_url || "/og-image.png";
  return {
    title: { absolute: `${title} | ${SITE_NAME}` },
    description,
    keywords: post.keywords.length ? post.keywords : undefined,
    alternates: { canonical: url },
    openGraph: { type: "article", locale: "ar_DZ", siteName: SITE_NAME, url, title, description, publishedTime: post.published_at, modifiedTime: post.updated_at, authors: post.author_name ? [post.author_name] : undefined, tags: post.tags, images: [{ url: image, alt: post.cover_image_alt || title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, categories, all] = await Promise.all([getPostBySlug(slug), getBlogCategories(), getPublishedPosts(60)]);
  if (!post) notFound();
  const category = categories.find((c) => c.id === post.category_id) ?? null;
  const url = post.canonical_url?.trim() || `${SITE_URL}/blog/${slug}`;
  const image = post.og_image_url || post.cover_image_url;
  const ld = {
    "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.excerpt || undefined,
    ...(image ? { image: [image.startsWith("http") ? image : `${SITE_URL}${image}`] } : {}),
    datePublished: post.published_at, dateModified: post.updated_at, mainEntityOfPage: url, url,
    ...(post.author_name ? { author: { "@type": "Person", name: post.author_name } } : {}),
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` } },
    ...(post.keywords.length ? { keywords: post.keywords.join(", ") } : {}),
    ...(category ? { articleSection: category.name_ar } : {}),
  };
  return (
    <div className="container-page max-w-3xl py-12">
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: "المدونة", href: "/blog" }, ...(category ? [{ name: category.name_ar, href: `/blog/category/${category.slug}` }] : []), { name: post.title }]} />
      <ArticleView post={post} category={category} categories={categories} related={relatedPosts(all, post, 3)}
        adAfterP3={<AdSlot placement="article_after_p3" />} adEnd={<AdSlot placement="article_end" />} />
    </div>
  );
}
