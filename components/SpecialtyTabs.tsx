"use client";
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";

export type Tab = { id: string; label: string; content: ReactNode };

/** تبويبات: كل اللوحات موجودة في HTML (مفيد لمحركات البحث والطباعة) وتُخفى بالسمة hidden فقط. */
export default function SpecialtyTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h && tabs.some((t) => t.id === h)) setActive(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(id: string) {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  }

  function onKey(e: KeyboardEvent, i: number) {
    // RTL: السهم الأيسر = التالي
    const dir = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    select(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="أقسام التخصص" className="no-print mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t, i) => (
          <button
            key={t.id} id={`tab-${t.id}`} role="tab" type="button"
            aria-selected={active === t.id} aria-controls={`panel-${t.id}`} tabIndex={active === t.id ? 0 : -1}
            onClick={() => select(t.id)} onKeyDown={(e) => onKey(e, i)}
            className={`chip ${active === t.id ? "chip-active" : ""}`}
          >{t.label}</button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} hidden={active !== t.id} className="tab-panel mb-6">
          <h2 className="print-only mb-2 text-xl font-black">{t.label}</h2>
          {t.content}
        </div>
      ))}
    </div>
  );
}
