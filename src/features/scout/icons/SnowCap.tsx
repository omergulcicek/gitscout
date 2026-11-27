import type { SVGProps } from "react"

/**
 * Snow settled on the top edge of a card: a soft drift with a few drips hanging over the frame.
 * Drawn for a 320 px wide card; it scales with its box.
 */
export function SnowCap(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 320 64" preserveAspectRatio="none" aria-hidden {...props}>
      <defs>
        <linearGradient id="snow-cap-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6f1fb" />
        </linearGradient>
        <filter id="snow-cap-shadow" x="-5%" y="-20%" width="110%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#7aa7d6" floodOpacity="0.45" />
        </filter>
      </defs>
      <path
        filter="url(#snow-cap-shadow)"
        fill="url(#snow-cap-fill)"
        d="M14 22 C14 10 26 4 40 6 C56 -2 74 2 86 8 C100 0 122 0 136 7 C152 -1 176 0 190 8 C206 0 230 1 244 8 C260 1 284 3 296 10 C308 8 314 16 306 24
           C302 29 296 28 292 26 C290 34 284 42 279 41 C274 40 274 32 272 27 C262 30 250 28 242 26 C240 31 236 34 232 31
           C226 28 220 30 210 28 C206 38 200 50 194 49 C188 48 190 36 188 28 C176 30 162 30 152 28 C146 30 140 32 134 28
           C124 30 112 29 104 27 C102 33 97 37 92 34 C88 31 86 28 78 28 C70 30 60 30 54 28 C52 36 47 44 42 43 C37 42 38 34 36 28
           C28 30 18 29 14 22 Z"
      />
      <g fill="#ffffff" opacity="0.9">
        <circle cx="62" cy="12" r="1.6" />
        <circle cx="148" cy="10" r="1.2" />
        <circle cx="226" cy="13" r="1.5" />
        <circle cx="282" cy="15" r="1.1" />
      </g>
    </svg>
  )
}
