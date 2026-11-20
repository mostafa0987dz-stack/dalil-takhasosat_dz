import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import JsonLd from "@/components/JsonLd";

export type Crumb = { name: string; href?: string };

/** فتات الخبز + BreadcrumbList JSON-LD. آخر عنصر بلا href = الصفحة الحالية. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const ld = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}) })),
  };
  return (
    <nav aria-label="مسار التنقل" className="no-print mb-6 text-sm">
      <JsonLd data={ld} />
      <ol className="flex flex-wrap items-center gap-2 text-slate-500">
        {items.map((c, i) => (
          <li key={`${c.name}-${i}`} className="flex items-center gap-2">
            {c.href ? <Link href={c.href} prefetch={false} className="text-blue-600 hover:underline">{c.name}</Link> : <span aria-current="page" className="text-slate-700 dark:text-slate-300">{c.name}</span>}
            {i < items.length - 1 && <span aria-hidden>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
