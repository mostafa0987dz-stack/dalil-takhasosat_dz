/** رسم خطي صغير لتطور المعدل عبر السنوات (من الأقدم إلى الأحدث). */
export default function Sparkline({ points, label, width = 72, height = 22 }: { points: { year: number; score: number }[]; label: string; width?: number; height?: number }) {
  if (points.length < 2) return <span className="text-slate-300" aria-hidden>·</span>;
  const pts = [...points].sort((a, b) => a.year - b.year);
  const w = width, h = height, pad = 3;
  const min = Math.min(...pts.map((p) => p.score)), max = Math.max(...pts.map((p) => p.score));
  const span = max - min || 1;
  const xy = pts.map((p, i) => [pad + (i * (w - pad * 2)) / (pts.length - 1), h - pad - ((p.score - min) / span) * (h - pad * 2)] as const);
  const last = xy[xy.length - 1];
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="inline-block align-middle text-blue-600 dark:text-blue-400">
      <polyline points={xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill="currentColor" />
    </svg>
  );
}
