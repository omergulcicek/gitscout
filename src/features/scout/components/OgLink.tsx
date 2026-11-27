const LINK_COLOR = "#a3a3a3"

/**
 * The site address for link previews: muted grey with a small chain icon, so it never competes with
 * the card or the score. Drawn with Satori, so only inline styles.
 */
export function OgLink() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 19, color: LINK_COLOR }}>
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={LINK_COLOR}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      gitscout.io
    </div>
  )
}
