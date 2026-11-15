export type TrendPoint = { day: string; actions: number; impressions: number; clicks: number };
export default function AdminTrendChart({ points }: { points: TrendPoint[] }) {
  const width = 760, height = 230, pad = 30;
  const max = Math.max(1, ...points.flatMap(p => [p.actions, p.impressions, p.clicks]));
  const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(1, points.length - 1);
  const y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const line = (key: "actions" | "impressions" | "clicks") => points.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
  return <div className="card space-y-3">
    <div><h2 className="text-xl font-black">النشاط خلال آخر 30 يوماً</h2><p className="text-xs text-slate-500">عمليات الإدارة ومشاهدات الإعلانات والنقرات المسجلة فعلياً</p></div>
    <div className="flex flex-wrap gap-4 text-xs"><span className="flex items-center gap-2"><i className="h-2 w-5 rounded bg-blue-600"/> عمليات الإدارة</span><span className="flex items-center gap-2"><i className="h-2 w-5 rounded bg-emerald-500"/> مشاهدات الإعلانات</span><span className="flex items-center gap-2"><i className="h-2 w-5 rounded bg-amber-500"/> النقرات</span></div>
    <div className="w-full overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="رسم بياني للنشاط خلال آخر ثلاثين يوماً" className="min-w-[560px] w-full">
      {[0, .25, .5, .75, 1].map(v => <g key={v}><line x1={pad} x2={width-pad} y1={y(max*v)} y2={y(max*v)} stroke="currentColor" opacity=".12" strokeDasharray="4 5"/><text x={pad-8} y={y(max*v)+4} fontSize="10" textAnchor="end" fill="currentColor" opacity=".6">{Math.round(max*v)}</text></g>)}
      <polyline points={line("actions")} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      <polyline points={line("impressions")} fill="none" stroke="#10b981" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      <polyline points={line("clicks")} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      {points.map((p,i) => i % 5 === 0 ? <text key={p.day} x={x(i)} y={height-5} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".65">{p.day.slice(5)}</text> : null)}
    </svg></div>
    {!points.some(p => p.actions || p.impressions || p.clicks) && <p className="text-center text-sm text-slate-500">لا توجد أحداث مسجلة بعد؛ سيظهر المنحنى تلقائياً عند تسجيل النشاط.</p>}
  </div>;
}
