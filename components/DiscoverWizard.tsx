"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** معالج من 4 خطوات: الشعبة ← المعدل ← المجالات ← الولاية ثم ينتقل إلى «أين أقبل؟» بالمعاملات. */
export default function DiscoverWizard({ branches, domains, wilayas }: { branches: string[]; domains: string[]; wilayas: string[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [branch, setBranch] = useState("");
  const [avg, setAvg] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [wilaya, setWilaya] = useState("");
  const [error, setError] = useState("");
  const average = Number(avg.replace(",", "."));

  function next() {
    setError("");
    if (step === 1 && !branch) return setError("اختر شعبتك أولاً.");
    if (step === 2 && (avg.trim() === "" || !Number.isFinite(average) || average < 0 || average > 20)) return setError("أدخل معدلاً بين 0 و20.");
    if (step < 4) return setStep(step + 1);
    const q = new URLSearchParams({ b: branch, s: avg.trim().replace(",", ".") });
    if (wilaya) q.set("w", wilaya);
    if (picked.length) q.set("d", picked.join(","));
    router.push(`/finder?${q.toString()}`);
  }
  const toggle = (d: string) => setPicked((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));
  const titles = ["ما شعبتك في البكالوريا؟", "ما معدلك؟", "ما المجالات التي تهمك؟ (اختياري)", "هل تفضّل ولاية معينة؟ (اختياري)"];

  return (
    <div className="card mx-auto max-w-2xl space-y-6">
      <div aria-label={`الخطوة ${step} من 4`} role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-blue-600 transition-all motion-reduce:transition-none" style={{ width: `${(step / 4) * 100}%` }} />
      </div>
      <h2 className="text-xl font-black">{titles[step - 1]}</h2>
      {step === 1 && <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="الشعبة">{branches.map((b) => <button key={b} type="button" role="radio" aria-checked={branch === b} onClick={() => setBranch(b)} className={`chip ${branch === b ? "chip-active" : ""}`}>{b}</button>)}</div>}
      {step === 2 && <label className="block text-sm font-bold">المعدل العام في البكالوريا<input value={avg} onChange={(e) => setAvg(e.target.value)} inputMode="decimal" placeholder="مثال: 14.5" className="input mt-2" autoFocus /></label>}
      {step === 3 && <div className="flex flex-wrap gap-2">{domains.map((d) => <button key={d} type="button" aria-pressed={picked.includes(d)} onClick={() => toggle(d)} className={`chip ${picked.includes(d) ? "chip-active" : ""}`}>{d}</button>)}</div>}
      {step === 4 && <label className="block text-sm font-bold">الولاية<select value={wilaya} onChange={(e) => setWilaya(e.target.value)} className="input mt-2"><option value="">كل الولايات</option>{wilayas.map((w) => <option key={w} value={w}>{w}</option>)}</select></label>}
      {error && <p role="alert" className="text-sm font-bold text-red-600">{error}</p>}
      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" className="btn-ghost" disabled={step === 1} onClick={() => { setError(""); setStep(step - 1); }}>السابق</button>
        <button type="button" className="btn-primary" onClick={next}>{step < 4 ? "التالي" : "اعرض النتائج"}</button>
      </div>
    </div>
  );
}
