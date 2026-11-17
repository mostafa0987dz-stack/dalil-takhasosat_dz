"use client";
import { useMemo, useRef, useState, useTransition } from "react";
import { BadgeCheck, Plus, SlidersHorizontal, X } from "lucide-react";
import { deleteAcceptanceRate, saveAcceptanceRate, type RateRecord } from "@/app/admin/actions";

type Props = {
  universityId: string;
  specialties: { slug: string; name: string }[];
  branches: string[];
  years: number[]; // الأعمدة المعروضة (تنازلياً)
  initial: RateRecord[];
};
type Msg = { type: "ok" | "err"; text: string } | null;

const keyOf = (spec: string, branch: string, year: number) => `${spec}|${branch}|${year}`;
const fmt = (v: number | null) => (v === null ? "—" : v.toFixed(2));

export default function RatesEditor({ universityId, specialties, branches, years, initial }: Props) {
  const [rates, setRates] = useState<RateRecord[]>(initial);
  const [specFilter, setSpecFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, startTransition] = useTransition();
  const done = useRef(false);

  const index = useMemo(() => new Map(rates.map((r) => [keyOf(r.specialty_slug, r.bac_branch, r.year), r])), [rates]);

  function upsertLocal(rec: RateRecord) {
    setRates((prev) => [...prev.filter((r) => keyOf(r.specialty_slug, r.bac_branch, r.year) !== keyOf(rec.specialty_slug, rec.bac_branch, rec.year)), rec]);
  }

  function send(fd: FormData, after?: (rec: RateRecord) => void) {
    startTransition(async () => {
      const res = await saveAcceptanceRate(fd);
      if (res.error || !res.record) { setMsg({ type: "err", text: res.error ?? "تعذر الحفظ." }); return; }
      upsertLocal(res.record);
      const hidden = !years.includes(res.record.year);
      setMsg({ type: "ok", text: hidden ? `تم الحفظ (سنة ${res.record.year} خارج الأعمدة المعروضة).` : "تم الحفظ." });
      after?.(res.record);
    });
  }

  function formFor(rec: Pick<RateRecord, "specialty_slug" | "bac_branch" | "year"> & Partial<RateRecord>, score: string) {
    const fd = new FormData();
    fd.set("university_id", universityId);
    fd.set("specialty_slug", rec.specialty_slug);
    fd.set("bac_branch", rec.bac_branch);
    fd.set("year", String(rec.year));
    fd.set("score", score);
    // نحافظ على بيانات المصدر والرسمي عند تعديل الرقم فقط
    if (rec.is_official) fd.set("is_official", "on");
    fd.set("source_url", rec.source_url ?? "");
    fd.set("source_title", rec.source_title ?? "");
    fd.set("notes", rec.notes ?? "");
    return fd;
  }

  function commit(spec: string, branch: string, year: number, raw: string) {
    const value = raw.trim().replace(",", ".");
    if (value === "") return; // فراغ = لا تغيير (للحذف استعمل ×)
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 20) { setMsg({ type: "err", text: "المعدل يجب أن يكون بين 0 و20." }); return; }
    const rec = index.get(keyOf(spec, branch, year));
    if (rec && rec.score !== null && Math.abs(rec.score - n) < 0.005) return;
    send(formFor(rec ?? { specialty_slug: spec, bac_branch: branch, year }, value));
  }

  function remove(rec: RateRecord) {
    if (!window.confirm(`حذف معدل ${rec.bac_branch} لسنة ${rec.year} نهائياً؟`)) return;
    const fd = new FormData();
    fd.set("id", String(rec.id));
    startTransition(async () => {
      const res = await deleteAcceptanceRate(fd);
      if (res.error) { setMsg({ type: "err", text: res.error }); return; }
      setRates((prev) => prev.filter((r) => r.id !== rec.id));
      setDetail(null);
      setMsg({ type: "ok", text: "تم الحذف." });
    });
  }

  const visibleSpecs = specialties.filter((s) => !specFilter || s.slug === specFilter);
  const branchesFor = (spec: string) => {
    const present = new Set(rates.filter((r) => r.specialty_slug === spec).map((r) => r.bac_branch));
    const ordered = [...branches.filter((b) => present.has(b)), ...[...present].filter((b) => !branches.includes(b))];
    return ordered.filter((b) => !branchFilter || b === branchFilter);
  };

  const official = rates.filter((r) => r.is_official).length;
  const hiddenOld = rates.filter((r) => !years.includes(r.year)).length;
  const last = rates.map((r) => r.updated_at).filter(Boolean).sort().at(-1);
  const detailRec = detail ? rates.find((r) => String(r.id) === detail) : undefined;

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-end gap-3">
        <label className="min-w-[12rem] flex-1 text-sm font-bold">التخصص
          <select value={specFilter} onChange={(e) => setSpecFilter(e.target.value)} className="input mt-1">
            <option value="">كل التخصصات</option>{specialties.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </label>
        <label className="min-w-[12rem] flex-1 text-sm font-bold">الشعبة
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="input mt-1">
            <option value="">كل الشعب</option>{branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
      </div>

      <p role="status" aria-live="polite" className={`min-h-6 text-sm font-bold ${msg?.type === "err" ? "text-red-600" : "text-emerald-700 dark:text-emerald-400"}`}>{pending ? "جارٍ الحفظ…" : msg?.text}</p>

      {!specialties.length && <p className="card text-sm text-slate-600 dark:text-slate-400">لا توجد تخصصات مرتبطة بهذه الجامعة. اربط تخصصاً أولاً من صفحة الجامعة.</p>}

      <div className="table-wrap">
        <table className="w-full min-w-[46rem] text-center text-sm">
          <thead>
            <tr className="bg-white/50 dark:bg-slate-800/40">
              <th scope="col" className="th sticky right-0 z-10 bg-white/95 text-right dark:bg-slate-900/95">الشعبة</th>
              {years.map((y) => <th key={y} scope="col" className="th">{y}</th>)}
            </tr>
          </thead>
          {visibleSpecs.map((sp) => {
            const rows = branchesFor(sp.slug);
            return (
              <tbody key={sp.slug} className="border-t-2 border-slate-200/80 dark:border-slate-700/80">
                <tr className="bg-blue-50/60 dark:bg-blue-950/30">
                  <th colSpan={years.length + 1} scope="colgroup" className="p-3 text-right">
                    <span className="inline-flex flex-wrap items-center gap-3">
                      <b>{sp.name}</b>
                      <button type="button" onClick={() => setAdding(adding === sp.slug ? null : sp.slug)} aria-expanded={adding === sp.slug} className="btn-ghost !px-3 !py-1 text-xs"><Plus size={14} aria-hidden />إضافة معدل</button>
                    </span>
                  </th>
                </tr>
                {adding === sp.slug && (
                  <tr><td colSpan={years.length + 1} className="p-3 text-right">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        fd.set("university_id", universityId);
                        fd.set("specialty_slug", sp.slug);
                        send(fd, () => setAdding(null));
                      }}
                      className="grid gap-3 rounded-2xl border border-slate-200/70 p-4 md:grid-cols-[1.3fr_7rem_7rem_1.6fr_auto] md:items-end dark:border-slate-700/70"
                    >
                      <label className="text-xs font-bold">الشعبة<select name="bac_branch" required className="input mt-1">{branches.map((b) => <option key={b} value={b}>{b}</option>)}</select></label>
                      <label className="text-xs font-bold">السنة<input name="year" type="number" min={2000} max={2100} required defaultValue={years[0]} className="input mt-1" /></label>
                      <label className="text-xs font-bold">المعدل<input name="score" inputMode="decimal" placeholder="15,25" className="input mt-1" /></label>
                      <label className="text-xs font-bold">رابط المصدر (اختياري)<input name="source_url" dir="ltr" placeholder="https://…" className="input mt-1" /></label>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="is_official" />رسمي</label>
                        <button className="btn-primary !py-2" disabled={pending}>حفظ</button>
                        <button type="button" className="btn-ghost" onClick={() => setAdding(null)}>إلغاء</button>
                      </div>
                    </form>
                  </td></tr>
                )}
                {rows.map((b) => (
                  <tr key={b} className="border-t border-slate-200/60 dark:border-slate-700/60">
                    <th scope="row" className="sticky right-0 z-10 bg-white/95 p-3 text-right font-bold dark:bg-slate-900/95">{b}</th>
                    {years.map((y) => {
                      const k = keyOf(sp.slug, b, y);
                      const rec = index.get(k);
                      return (
                        <td key={y} className="group p-1">
                          {editing === k ? (
                            <input
                              autoFocus inputMode="decimal" dir="ltr" aria-label={`معدل ${b} ${y}`}
                              defaultValue={rec?.score ?? ""}
                              className="input !h-10 !w-20 !px-2 text-center"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { done.current = true; commit(sp.slug, b, y, e.currentTarget.value); setEditing(null); }
                                else if (e.key === "Escape") { done.current = true; setEditing(null); }
                              }}
                              onBlur={(e) => { if (!done.current) commit(sp.slug, b, y, e.currentTarget.value); setEditing(null); }}
                            />
                          ) : (
                            <div className="flex items-center justify-center gap-0.5">
                              <button type="button" onClick={() => { done.current = false; setEditing(k); }} aria-label={`تعديل معدل ${b} لسنة ${y}`}
                                className={`inline-flex min-h-10 min-w-14 items-center justify-center gap-1 rounded-lg px-2 font-bold hover:bg-blue-50 dark:hover:bg-slate-800 ${rec ? "" : "text-slate-400"}`}>
                                {rec ? fmt(rec.score) : "—"}{rec?.is_official && <BadgeCheck size={13} className="text-emerald-600" aria-label="رسمي" />}
                              </button>
                              {rec && (
                                <span className="flex opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                                  <button type="button" onClick={() => setDetail(String(rec.id))} aria-label="تفاصيل المصدر" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><SlidersHorizontal size={13} aria-hidden /></button>
                                  <button type="button" onClick={() => remove(rec)} aria-label={`حذف معدل ${b} لسنة ${y}`} className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950"><X size={14} aria-hidden /></button>
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={years.length + 1} className="p-4 text-right text-xs text-slate-500">لا توجد معدلات{branchFilter ? " لهذه الشعبة" : ""} بعد.</td></tr>}
              </tbody>
            );
          })}
        </table>
      </div>

      {detailRec && (
        <form
          key={detailRec.id}
          onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); fd.set("university_id", universityId); send(fd, () => setDetail(null)); }}
          className="card grid gap-3 md:grid-cols-2"
        >
          <h2 className="text-lg font-black md:col-span-2">تفاصيل السجل: {detailRec.bac_branch} · {detailRec.year}</h2>
          <input type="hidden" name="specialty_slug" value={detailRec.specialty_slug} />
          <input type="hidden" name="bac_branch" value={detailRec.bac_branch} />
          <input type="hidden" name="year" value={detailRec.year} />
          <label className="text-sm font-bold">المعدل (اتركه فارغاً إن لم يتوفر)<input name="score" inputMode="decimal" defaultValue={detailRec.score ?? ""} className="input mt-1" /></label>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-bold"><input type="checkbox" name="is_official" defaultChecked={detailRec.is_official} />مصدر رسمي (يتطلب رابطاً)</label>
          <label className="text-sm font-bold">رابط المصدر<input name="source_url" dir="ltr" defaultValue={detailRec.source_url ?? ""} className="input mt-1" /></label>
          <label className="text-sm font-bold">عنوان المصدر<input name="source_title" defaultValue={detailRec.source_title ?? ""} className="input mt-1" /></label>
          <label className="text-sm font-bold md:col-span-2">ملاحظات<input name="notes" defaultValue={detailRec.notes ?? ""} className="input mt-1" /></label>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button className="btn-primary" disabled={pending}>حفظ التفاصيل</button>
            <button type="button" className="btn-ghost" onClick={() => setDetail(null)}>إغلاق</button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="card !p-4"><b className="block text-2xl">{rates.length}</b><span className="text-sm text-slate-500">سجل معدل</span></div>
        <div className="card !p-4"><b className="block text-2xl">{official}</b><span className="text-sm text-slate-500">سجل رسمي</span></div>
        <div className="card !p-4"><b className="block text-lg">{last ? new Date(last).toLocaleDateString("ar-DZ", { dateStyle: "medium" }) : "—"}</b><span className="text-sm text-slate-500">آخر تحديث</span></div>
        <div className="card !p-4"><b className="block text-2xl">{hiddenOld}</b><span className="text-sm text-slate-500">سجل أقدم من الأعمدة المعروضة</span></div>
      </div>
    </div>
  );
}
