import { getBlogCategories, getPublishedPosts } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const revalidate = 3600;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function GET() {
  const [posts, cats] = await Promise.all([getPublishedPosts(50), getBlogCategories()]);
  const byId = new Map(cats.map((c) => [c.id, c.name_ar]));
  const items = posts.map((p) => `<item><title>${esc(p.title)}</title><link>${SITE_URL}/blog/${p.slug}</link><guid isPermaLink="true">${SITE_URL}/blog/${p.slug}</guid><pubDate>${new Date(p.published_at).toUTCString()}</pubDate>${p.category_id && byId.get(p.category_id) ? `<category>${esc(byId.get(p.category_id)!)}</category>` : ""}<description>${esc(p.excerpt)}</description></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(`${SITE_NAME} — المدونة`)}</title><link>${SITE_URL}/blog</link><description>${esc("مقالات التوجيه الجامعي في الجزائر")}</description><language>ar</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600, s-maxage=3600" } });
}
