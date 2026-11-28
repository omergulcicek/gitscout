/** A piece's place and turn at one moment, relative to where it started. */
export type ShardFrame = { x: number; y: number; angle: number }

export type ShardLaunch = {
  /** The piece's middle and its rough radius, in px. */
  center: readonly [number, number]
  radius: number
  /** Starting speed in px/ms and spin in degrees/ms. */
  vx: number
  vy: number
  spin: number
  /** The floor and the side walls, in the same px as `center`; `Infinity` lets the piece fly off. */
  floor: number
  left: number
  right: number
  /** Downward pull in px/ms²; lighter for pieces flung far. */
  gravity?: number
  /** Air drag per ms: a burst piece shoots out, then slows down and drifts. */
  drag?: number
}

/** The usual downward pull in px/ms², and how much speed a bounce keeps off the floor and off a wall. */
const GRAVITY = 0.0034
const FLOOR_BOUNCE = 0.32
const WALL_BOUNCE = 0.45
/** Below this speed off a bounce, the piece stops bouncing and slides to rest. */
const REST_SPEED = 0.06
const STEP_MS = 8

/**
 * Where a broken-off piece is over time: it flies out, falls under gravity, bounces off the floor a couple
 * of times, losing speed and spin, then slides to a stop and stays there. Side walls keep it on screen. Pure,
 * so the same launch always gives the same path; one frame per `every` ms for `duration` ms.
 */
export function simulateShard(launch: ShardLaunch, duration: number, every: number): ShardFrame[] {
  let { vx, vy, spin } = launch
  let x = 0
  let y = 0
  let angle = 0
  let resting = false
  const frames: ShardFrame[] = [{ x, y, angle }]
  // Where the piece's middle sits when it touches the floor or a wall: a flat piece lies lower than its radius.
  const lowest = launch.floor - launch.center[1] - launch.radius * 0.45
  const leftmost = launch.left - launch.center[0] + launch.radius * 0.5
  const rightmost = launch.right - launch.center[0] - launch.radius * 0.5

  for (let time = STEP_MS; time <= duration; time += STEP_MS) {
    if (!resting) vy += (launch.gravity ?? GRAVITY) * STEP_MS
    if (launch.drag) {
      const keep = 1 - launch.drag * STEP_MS
      vx *= keep
      vy *= keep
      spin *= keep
    }
    x += vx * STEP_MS
    y += vy * STEP_MS
    angle += spin * STEP_MS

    if (y >= lowest) {
      y = lowest
      if (resting || Math.abs(vy) * FLOOR_BOUNCE < REST_SPEED) {
        resting = true
        vy = 0
        // Sliding on the floor: friction stops it and its spin.
        vx *= 0.9
        spin *= 0.8
      } else {
        vy = -vy * FLOOR_BOUNCE
        vx *= 0.7
        spin *= 0.55
      }
    }
    if (x <= leftmost || x >= rightmost) {
      x = Math.min(rightmost, Math.max(leftmost, x))
      vx = -vx * WALL_BOUNCE
    }

    if (time % every < STEP_MS) frames.push({ x, y, angle })
  }
  return frames
}
