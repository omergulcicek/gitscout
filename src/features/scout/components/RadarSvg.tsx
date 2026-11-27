import { useLayoutEffect, useRef, useState } from "react"
import type { PointerEvent, ReactNode } from "react"

/**
 * Layout in CSS pixels, following Recharts' `RadarChart`: the radius is `outerRatio` of half the smaller side
 * of the box inside the margins. The width is measured, so the chart matches Recharts at every size.
 */
export type RadarGeometry = {
  height: number
  outerRatio: number
  /** Side and top/bottom margins; the tooltip is also kept inside them. */
  margin: { x: number; y: number }
  /** Width used for the server render, before the box is measured. */
  fallbackWidth: number
}

export type RadarSeries = {
  /** One value per axis, 0–100, in axis order. */
  values: readonly number[]
  /** CSS color, e.g. `var(--chart-home)`. */
  color: string
  fillOpacity: number
  dotRadius: number
}

type RadarSvgProps = {
  labels: readonly string[]
  series: readonly RadarSeries[]
  geometry: RadarGeometry
  /** Tooltip body for the axis under the pointer. */
  tooltip: (index: number) => ReactNode
  className?: string
}

/** Grid rings, like Recharts' default `PolarGrid` (its innermost ring has zero radius). */
const RINGS = 4
/** Gap between the outer ring and the axis labels. */
const LABEL_GAP = 8
/** Distance between the pointer and the tooltip. */
const TOOLTIP_OFFSET = 10

/** The first axis points straight up and the rest follow clockwise. */
function axisAngle(index: number, count: number): number {
  return Math.PI / 2 - (index * 2 * Math.PI) / count
}

function point(cx: number, cy: number, radius: number, angle: number) {
  return { x: cx + radius * Math.cos(angle), y: cy - radius * Math.sin(angle) }
}

const polygon = (points: readonly { x: number; y: number }[]) =>
  points.map(({ x, y }) => `${x},${y}`).join(" ")

/**
 * A dependency-free radar chart: hexagon grid, axis labels, one filled shape per series and a tooltip for
 * the axis nearest the pointer. Replaces Recharts, which cost ~95 KB gzip for these two charts.
 */
export function RadarSvg({ labels, series, geometry, tooltip, className }: RadarSvgProps) {
  const { height, outerRatio, margin, fallbackWidth } = geometry
  const boxRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [measured, setMeasured] = useState<number | null>(null)
  const [active, setActive] = useState<{ index: number; x: number; y: number } | null>(null)

  // Follow the box width like Recharts' ResponsiveContainer did.
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setMeasured(entry.contentRect.width)
    })
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  const width = measured || fallbackWidth
  const radius =
    (outerRatio * Math.max(0, Math.min(width - 2 * margin.x, height - 2 * margin.y))) / 2
  const cx = width / 2
  const cy = height / 2
  const count = labels.length
  const angles = labels.map((_, index) => axisAngle(index, count))

  // The nearest axis by angle from the centre, like Recharts' radar tooltip.
  const handlePointer = (event: PointerEvent<SVGSVGElement>) => {
    const svg = event.currentTarget
    const box = boxRef.current
    const matrix = svg.getScreenCTM()
    if (!box || !matrix) return
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const angle = Math.atan2(cy - local.y, local.x - cx)
    const step = (2 * Math.PI) / count
    const index = ((Math.round((Math.PI / 2 - angle) / step) % count) + count) % count
    const rect = box.getBoundingClientRect()
    setActive({ index, x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  // The tooltip's size is only known once it's in the DOM, so it's placed right after layout, before paint.
  // It stays inside the chart box, flipping to the other side of the pointer when it would overflow.
  useLayoutEffect(() => {
    const box = boxRef.current
    const tip = tooltipRef.current
    if (!active || !box || !tip) return
    // Recharts' rule: right of / below the pointer if it fits inside the margins, else the other side,
    // never past the left or top margin.
    const place = (pointer: number, size: number, start: number, end: number) => {
      const after = pointer + TOOLTIP_OFFSET
      return after + size > end
        ? Math.max(start, pointer - size - TOOLTIP_OFFSET)
        : Math.max(start, after)
    }
    const x = place(active.x, tip.offsetWidth, margin.x, box.clientWidth - margin.x)
    const y = place(active.y, tip.offsetHeight, margin.y, box.clientHeight - margin.y)
    // The first placement jumps straight there; later moves glide, as Recharts' tooltip did.
    const first = tip.dataset.placed !== "true"
    if (first) tip.style.transition = "none"
    tip.style.transform = `translate(${x}px, ${y}px)`
    if (first) {
      void tip.offsetHeight
      tip.style.transition = ""
      tip.dataset.placed = "true"
    }
  }, [active, margin.x, margin.y])

  return (
    <div ref={boxRef} className={className} style={{ position: "relative", height }}>
      <svg
        aria-hidden
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible text-xs"
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => setActive(null)}
      >
        <g fill="none" stroke="var(--border)">
          {Array.from({ length: RINGS }, (_, ring) => {
            const r = (radius * (ring + 1)) / RINGS
            return <polygon key={ring} points={polygon(angles.map((a) => point(cx, cy, r, a)))} />
          })}
          {angles.map((angle, index) => {
            const end = point(cx, cy, radius, angle)
            return <line key={labels[index]} x1={cx} y1={cy} x2={end.x} y2={end.y} />
          })}
        </g>

        <g fontSize={12} fill="var(--muted-foreground)">
          {angles.map((angle, index) => {
            const { x, y } = point(cx, cy, radius + LABEL_GAP, angle)
            const cos = Math.cos(angle)
            const anchor = Math.abs(cos) < 1e-6 ? "middle" : cos > 0 ? "start" : "end"
            // Same baseline shifts Recharts uses: top label sits above, bottom below, sides centred.
            const dy = anchor !== "middle" ? "0.355em" : y < cy ? "0em" : "0.71em"
            return (
              <text key={labels[index]} x={x} y={y} dy={dy} textAnchor={anchor}>
                {labels[index]}
              </text>
            )
          })}
        </g>

        {series.map((item) => {
          const points = angles.map((angle, index) =>
            point(
              cx,
              cy,
              (radius * Math.min(100, Math.max(0, item.values[index] ?? 0))) / 100,
              angle
            )
          )
          return (
            <g key={item.color} fill={item.color} stroke={item.color} strokeWidth={2}>
              <polygon points={polygon(points)} fillOpacity={item.fillOpacity} />
              {points.map((p, index) => (
                <circle key={labels[index]} cx={p.x} cy={p.y} r={item.dotRadius} />
              ))}
            </g>
          )
        })}
      </svg>

      {active ? (
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute top-0 left-0 z-10 transition-transform duration-300 ease-out motion-reduce:transition-none"
        >
          {tooltip(active.index)}
        </div>
      ) : null}
    </div>
  )
}
