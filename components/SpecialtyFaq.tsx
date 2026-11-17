export type FaqItem = { q: string; a: string };

/** أسئلة شائعة بـ <details> (بلا JS). الأسئلة مُولَّدة من بيانات التخصص، وJSON-LD يُضاف في الصفحة. */
export default function SpecialtyFaq({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-10" aria-labelledby="faq-title">
      <h2 id="faq-title" className="section-title mb-4">أسئلة شائعة</h2>
      <div className="space-y-3">
        {items.map((f) => (
          <details key={f.q} className="card group !p-0">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 p-4 font-bold">
              <span>{f.q}</span><span aria-hidden className="text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="px-4 pb-4 leading-8 text-slate-700 dark:text-slate-300">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
