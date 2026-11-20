import type { ReactNode } from "react";
import { parseMarkdown, type Block, type Inline } from "@/lib/markdown";

function inline(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text": return n.v;
      case "bold": return <strong key={i}>{inline(n.c)}</strong>;
      case "italic": return <em key={i}>{inline(n.c)}</em>;
      case "code": return <code key={i} dir="ltr" className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] dark:bg-slate-800">{n.v}</code>;
      case "link": {
        const external = /^https?:\/\//i.test(n.href);
        return <a key={i} href={n.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="font-semibold text-blue-600 underline underline-offset-2">{inline(n.c)}</a>;
      }
    }
  });
}

/** يعرض Markdown كعناصر React (بلا dangerouslySetInnerHTML). inject: عنصر يُدرج بعد الفقرة رقم n (مثلاً موضع إعلاني). */
export default function MarkdownView({ md, inject }: { md: string; inject?: { afterParagraph: number; node: ReactNode } }) {
  const blocks = parseMarkdown(md);
  let paragraphs = 0;
  const render = (b: Block, i: number): ReactNode => {
    switch (b.t) {
      case "heading": {
        const cls = b.level === 2 ? "mt-10 mb-3 text-2xl font-black" : b.level === 3 ? "mt-8 mb-2 text-xl font-extrabold" : "mt-6 mb-2 text-lg font-bold";
        const H = (`h${b.level}`) as "h2" | "h3" | "h4";
        return <H key={i} id={b.id} className={`${cls} scroll-mt-24`}>{inline(b.c)}</H>;
      }
      case "paragraph": return <p key={i} className="my-4 leading-9 text-slate-800 dark:text-slate-200">{inline(b.c)}</p>;
      case "list": {
        const L = b.ordered ? "ol" : "ul";
        return <L key={i} className={`my-4 space-y-2 pr-6 leading-8 ${b.ordered ? "list-decimal" : "list-disc"}`}>{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</L>;
      }
      case "quote": return <blockquote key={i} className="my-5 border-r-4 border-blue-500 bg-blue-50/60 px-4 py-3 leading-8 dark:bg-blue-950/30">{inline(b.c)}</blockquote>;
      case "image": return <figure key={i} className="my-6"><img src={b.src} alt={b.alt} loading="lazy" className="mx-auto max-h-[28rem] w-full rounded-2xl object-cover" />{b.alt && <figcaption className="mt-2 text-center text-sm text-slate-500">{b.alt}</figcaption>}</figure>;
      case "code": return <pre key={i} dir="ltr" className="my-5 overflow-x-auto rounded-2xl bg-slate-900 p-4 text-left text-sm text-slate-100"><code>{b.v}</code></pre>;
      case "hr": return <hr key={i} className="my-8 border-slate-200 dark:border-slate-700" />;
    }
  };
  return (
    <div className="max-w-none">
      {blocks.map((b, i) => {
        const el = render(b, i);
        if (b.t === "paragraph") {
          paragraphs++;
          if (inject && paragraphs === inject.afterParagraph) return <div key={`w-${i}`}>{el}{inject.node}</div>;
        }
        return el;
      })}
    </div>
  );
}
