import { SITE_NAME } from "@/lib/constants";

export type PrintList = { title: string; items: string[]; max?: number };
type Props = {
  title: string;
  subtitle?: string;
  facts?: { label: string; value: string }[];
  lists?: PrintList[];
  table?: { title: string; head: string[]; rows: string[][] };
  note?: string;
  url: string;
};

/** ورقة طباعة مختصرة (صفحة A4 واحدة): تظهر عند الطباعة / حفظ PDF فقط، وتحل محل الصفحة الكاملة. */
export default function PrintSheet({ title, subtitle, facts = [], lists = [], table, note, url }: Props) {
  return (
    <section className="print-only print-sheet" aria-hidden="true">
      <p className="print-brand">{SITE_NAME}</p>
      <h1 className="print-title">{title}</h1>
      {subtitle && <p className="print-sub">{subtitle}</p>}
      {facts.length > 0 && (
        <dl className="print-facts">
          {facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
        </dl>
      )}
      {lists.length > 0 && (
        <div className="print-cols">
          {lists.filter((l) => l.items.length).map((l) => {
            const max = l.max ?? l.items.length;
            const shown = l.items.slice(0, max);
            return (
              <div key={l.title} className="print-block">
                <h2>{l.title}</h2>
                <ul>{shown.map((x) => <li key={x}>{x}</li>)}</ul>
                {l.items.length > max && <p className="print-more">+ {l.items.length - max} أخرى على الموقع</p>}
              </div>
            );
          })}
        </div>
      )}
      {table && table.rows.length > 0 && (
        <div className="print-block">
          <h2>{table.title}</h2>
          <table className="print-table">
            <thead><tr>{table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      <p className="print-foot">{note ? `${note} — ` : ""}البيانات إرشادية، والمرجع النهائي منشور وزارة التعليم العالي والبحث العلمي. <span dir="ltr">{url}</span></p>
    </section>
  );
}
