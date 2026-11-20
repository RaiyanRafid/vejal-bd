// Server component: inline SVG polyline, no client JS.
export function Sparkline({ points, width = 120, height = 32 }: { points: number[]; width?: number; height?: number }) {
  const min = Math.min(...points);
  const span = Math.max(...points) - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const pts = points
    .map((p, i) => `${(i * step).toFixed(1)},${(height - 2 - ((p - min) / span) * (height - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="প্রবণতা" className="text-primary">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
