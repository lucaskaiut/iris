import type { ReactNode } from 'react'

function colorForLevel(value: number) {
  const v = Math.max(0, Math.min(100, value))
  if (v <= 25) return '#ef4444'
  if (v <= 50) return '#f97316'
  if (v <= 75) return '#eab308'
  return '#22c55e'
}

export type StatusRingProps = {
  label: string
  value: number
  icon: ReactNode
}

export default function StatusRing({ label, value, icon }: StatusRingProps) {
  const v = Math.max(0, Math.min(100, value))
  const color = colorForLevel(v)
  const tooltip = `${label}: ${v}/100`
  const ringBg = `conic-gradient(from -90deg, ${color} ${v}%, color-mix(in oklab, var(--border) 70%, transparent) 0)`

  return (
    <div
      className="group relative grid place-items-center justify-self-center outline-none"
      aria-label={tooltip}
      tabIndex={0}
    >
      <div
        className="pointer-events-none absolute left-1/2 bottom-[-10px] z-10 -translate-x-1/2 translate-y-full whitespace-nowrap rounded-[10px] border border-(--border) bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] px-2 py-1 font-(--mono) text-[12px] text-(--text-h) opacity-0 shadow-(--shadow) transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden="true"
      >
        {tooltip}
      </div>

      <div
        className="relative h-10 w-10 rounded-full border border-(--border) shadow-(--shadow)"
        style={{ backgroundImage: ringBg }}
      >
        <div className="absolute inset-[7px] z-0 rounded-full border border-(--border) bg-[color-mix(in_oklab,var(--bg)_80%,transparent)]" />
        <div className="absolute inset-[7px] z-10 grid place-items-center text-(--text-h)">
          <div className="grid place-items-center opacity-90" aria-hidden="true">
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}

