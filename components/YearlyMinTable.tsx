type Rate = { bac_branch: string; year: number; score: number };

/** أدنى معدل مسجّل عبر الجامعات لكل شعبة ولكل سنة على حدة (بلا خلط بين السنوات). */
export default function YearlyMinTable({ rates, maxYears = 6 }: { rates: Rate[]; maxYears?: number }) {
  if (!rates.length) return null;
  const years = Array.from(new Set(rates.map((r) => r.year))).sort((a, b) => b - a).slice(0, maxYears);
  const branches = Array.from(new Set(rates.map((r) => r.bac_branch)));
  const min = new Map<string, number>();
  for (const r of rates) { const k = `${r.bac_branch}|${r.year}`; const cur = min.get(k); if (cur === undefined || r.score < cur) min.set(k, r.score); }
  return (
    <section className="card mb-6" aria-labelledby="yearly-min">
      <h3 id="yearly-min" className="mb-1 text-lg font-black">العتبات حسب السنة</h3>
      <p className="mb-3 text-xs text-slate-500">أدنى معدل قبول مسجّل عبر الجامعات لكل شعبة، لكل سنة على حدة.</p>
      <div className="table-wrap">
        <table className="w-full min-w-[26rem] text-center text-sm">
          <thead><tr className="bg-white/50 dark:bg-slate-800/40"><th scope="col" className="th sticky right-0 z-10 bg-white/95 text-right dark:bg-slate-900/95">الشعبة</th>{years.map((y) => <th key={y} scope="col" className="th">{y}</th>)}</tr></thead>
          <tbody>{branches.map((b) => (
            <tr key={b} className="border-t border-slate-200/60 dark:border-slate-700/60">
              <th scope="row" className="sticky right-0 z-10 bg-white/95 p-3 text-right font-bold dark:bg-slate-900/95">{b}</th>
              {years.map((y) => { const v = min.get(`${b}|${y}`); return <td key={y} className="p-3 font-bold">{v === undefined ? <span className="text-slate-300">·</span> : v.toFixed(2)}</td>; })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}
