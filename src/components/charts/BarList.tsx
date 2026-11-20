export type BarRow = { label: string; value: number | null; display?: string };

const bn = (n: number) => n.toLocaleString("bn-BD");

// Server component: pure HTML/CSS bars. value null = suppressed (<৩), empty bar.
export function BarList({ rows, max }: { rows: BarRow[]; max?: number }) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value ?? 0));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate">{r.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span
              data-testid={`bar-${r.label}`}
              className="block h-full rounded-full bg-primary"
              style={{ width: `${r.value === null ? 0 : Math.min(100, (r.value / top) * 100)}%` }}
            />
          </span>
          <span className="min-w-10 text-right font-mono text-muted-foreground tabular-nums">
            {r.value === null ? "<৩" : (r.display ?? bn(r.value))}
          </span>
        </li>
      ))}
    </ul>
  );
}
