"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import { Toast, type ToastTone } from "./Toast.js"

// ToastRegion — where toasts appear, how many at once, and for how long.
//
// No provider: the app owns the list (`toasts`) and removes entries in
// `onDismiss`, the same way Dialog leaves `open` to its owner. Mount it once,
// near the root, and keep it mounted — its live regions have to exist before
// the first toast does. A region created together with its text is announced
// unreliably; one that is already there and changes is announced. So the
// cards themselves carry no role, and their text is written into one of two
// persistent regions: assertive for danger, polite for everything else.
//
// Timers pause while the pointer is over the region or focus is inside it,
// so nobody loses a toast while reading it or reaching for its close button.

export type ToastEntry = {
  id: string
  tone?: ToastTone
  title: string
  message?: string
  /** ms; overrides the region's `duration`. `null` stays until closed. */
  duration?: number | null
}

const POSITION = {
  "top-center": "inset-x-16 top-16 items-center",
  "top-right": "right-16 top-16 items-end",
  "bottom-center": "inset-x-16 bottom-16 items-center",
  "bottom-right": "right-16 bottom-16 items-end",
} as const

type ToastRegionProps = {
  toasts: ToastEntry[]
  /** Remove the entry from `toasts`. Called on close and on timeout. */
  onDismiss: (id: string) => void
  position?: keyof typeof POSITION
  /** Shown at once; the rest wait their turn, timers not yet running. */
  max?: number
  /**
   * Default auto-dismiss in ms, `null` for none. Danger toasts default to
   * staying until closed — an error should not vanish unread.
   */
  duration?: number | null
  /** Name of the region landmark. */
  label?: string
  closeLabel?: string
  className?: string
}

type Timer = { remaining: number; started: number; handle?: number }

const textOf = (t: ToastEntry) => (t.message ? `${t.title}，${t.message}` : t.title)

export function ToastRegion({
  toasts,
  onDismiss,
  position = "top-center",
  max = 3,
  duration = 5000,
  label = "通知",
  closeLabel = "關閉通知",
  className,
}: ToastRegionProps) {
  const visible = toasts.slice(0, Math.max(1, max))
  const closeButtons = useRef(new Map<string, HTMLButtonElement>())
  const rootRef = useRef<HTMLElement>(null)
  // The element focused before focus entered the region, to return to.
  const returnFocus = useRef<HTMLElement | null>(null)

  // ── Announcements: each toast once, when it becomes visible ──────────────
  // `n` makes the same text twice in a row (two 已儲存 toasts) a change.
  type Notice = { text: string; n: number } | null
  const [polite, setPolite] = useState<Notice>(null)
  const [assertive, setAssertive] = useState<Notice>(null)
  const next = (text: string) => (prev: Notice) => ({ text, n: (prev?.n ?? 0) + 1 })
  const announced = useRef(new Set<string>())
  const visibleIds = visible.map((t) => t.id).join("\n")
  useEffect(() => {
    const fresh = visible.filter((t) => !announced.current.has(t.id))
    if (fresh.length === 0) return
    fresh.forEach((t) => announced.current.add(t.id))
    const urgent = fresh.filter((t) => t.tone === "danger").map(textOf)
    const calm = fresh.filter((t) => t.tone !== "danger").map(textOf)
    if (urgent.length) setAssertive(next(urgent.join("。")))
    if (calm.length) setPolite(next(calm.join("。")))
    // Keyed on the ids: re-renders with the same toasts announce nothing.
  }, [visibleIds])

  // ── Timers ───────────────────────────────────────────────────────────────
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const paused = hovered || focused
  const timers = useRef(new Map<string, Timer>())
  const dismiss = useRef(onDismiss)
  dismiss.current = onDismiss

  useEffect(() => {
    const now = Date.now()
    const live = new Set(visible.map((t) => t.id))
    for (const [id, timer] of timers.current) {
      if (!live.has(id)) {
        window.clearTimeout(timer.handle)
        timers.current.delete(id)
      }
    }
    for (const t of visible) {
      const ms = t.duration !== undefined ? t.duration : t.tone === "danger" ? null : duration
      if (ms === null || ms === Infinity) continue
      let timer = timers.current.get(t.id)
      if (!timer) {
        timer = { remaining: ms, started: now }
        timers.current.set(t.id, timer)
      }
      if (paused && timer.handle !== undefined) {
        window.clearTimeout(timer.handle)
        timer.handle = undefined
        timer.remaining -= now - timer.started
      } else if (!paused && timer.handle === undefined) {
        timer.started = now
        timer.handle = window.setTimeout(() => dismiss.current(t.id), Math.max(0, timer.remaining))
      }
    }
    // Keyed on the ids, not the array, so a parent re-render does not touch
    // running timers.
  }, [visibleIds, paused, duration])

  useEffect(() => {
    const all = timers.current
    return () => all.forEach((t) => window.clearTimeout(t.handle))
  }, [])

  // ── Closing by hand: keep focus somewhere sensible ───────────────────────
  const close = (index: number) => {
    const id = visible[index]!.id
    const neighbour = visible[index + 1] ?? visible[index - 1]
    onDismiss(id)
    const target = neighbour ? closeButtons.current.get(neighbour.id) : returnFocus.current
    if (target?.isConnected) target.focus()
    else (document.activeElement as HTMLElement | null)?.blur()
    if (!neighbour) setFocused(false)
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) {
          returnFocus.current = e.relatedTarget as HTMLElement | null
        }
        setFocused(true)
      }}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      className={cn(
        "pointer-events-none fixed z-50 flex flex-col gap-8",
        POSITION[position],
        className,
      )}
    >
      {visible.map((t, i) => (
        <Toast
          key={t.id}
          tone={t.tone}
          title={t.title}
          message={t.message}
          announce={false}
          closeLabel={closeLabel}
          onClose={() => close(i)}
          closeRef={(el) => {
            if (el) closeButtons.current.set(t.id, el)
            else closeButtons.current.delete(t.id)
          }}
          className="pointer-events-auto"
        />
      ))}
      <div role="status" className="sr-only">
        {polite ? <span key={polite.n}>{polite.text}</span> : null}
      </div>
      <div role="alert" className="sr-only">
        {assertive ? <span key={assertive.n}>{assertive.text}</span> : null}
      </div>
    </section>
  )
}
