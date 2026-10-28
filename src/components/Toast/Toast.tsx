"use client"

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { cn } from "../../lib/cn.js"
import { PlusIcon } from "../Icons/Icons.js"
import { iconButtonClasses } from "../Button/Button.js"
import { LiveRegion, useAnnouncer } from "../LiveRegion/LiveRegion.js"
import {
  parse,
  register,
  returnFocusOf,
  snapshot,
  subscribe,
  unregister,
  type ToastPosition,
} from "./toastStack.js"

// Toast — design-system extension (not in Figma). A dark teal card matching the
// SiteNav band, with a tone icon (see ToneIcon below).
//
// It was a light tint fill per tone, but green-100 is a lime that sits outside
// this palette's warm teal/orange/beige range, and a pale fill on a pale page
// is easy to miss — which it was. Sharing the nav's teal instead makes it read
// as chrome, separates it from the page at a glance, and keeps one surface for
// all four tones so the colour never has to carry contrast on its own.
//
// Two ways to use it:
//
// - Without `open`: a static card, rendered where it is written. No timer, no
//   announcement — for content that is on the page from the start.
// - With `open`: one component per notification, like Dialog. Put it in the
//   JSX, flip `open`, and it appears in the stack for its `position`, times
//   out after `autoHide` (paused while the pointer or focus is in the stack),
//   and calls `onClose`. No list to manage, no provider.
//
// Announcing: the card never carries role="alert" / "status" — a live region
// inserted together with its text is announced unreliably. Each managed Toast
// instead keeps its own LiveRegion mounted for as long as the component is,
// open or not, and writes the text into it when the toast appears (assertive
// for danger, polite otherwise). The text clears after a few seconds, so the
// hidden copy does not linger next to the card.

export type ToastTone = "info" | "success" | "warning" | "danger"
export type { ToastPosition }

// The tone is never carried by colour alone (WCAG 1.4.1). It was a coloured
// dot, which told colour-blind users nothing and screen reader users less.
// Now each tone has its own icon *shape* — circle-i, circle-check,
// triangle-!, octagon-! — and its name is spoken: a visually hidden prefix
// on the card (錯誤：儲存失敗) and the same prefix in the announcement.
// Danger is an octagon, not an ×, which the close button already is.

/** Spoken before the title; overridable through `toneLabels`. */
const DEFAULT_TONE_LABELS: Record<ToastTone, string> = {
  info: "提示",
  success: "成功",
  warning: "警告",
  danger: "錯誤",
}

// Mid-ramp steps, chosen to stay legible against teal-PRIMARY (≥3.7:1).
const TONE_COLOUR: Record<ToastTone, string> = {
  info: "text-blue-300",
  success: "text-green-300",
  warning: "text-orange-PRIMARY",
  danger: "text-red-300",
}

/** The tone's shape, filled in its colour, glyph cut out in the card teal. */
function ToneIcon({ tone }: { tone: ToastTone }) {
  const glyph = "fill-teal-PRIMARY"
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      data-tone-icon={tone}
      className={cn("mt-2 size-20 shrink-0", TONE_COLOUR[tone])}
    >
      {tone === "warning" ? (
        <path
          d="M10 2 18.5 17.5H1.5Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      ) : tone === "danger" ? (
        <polygon
          points="6.3,1 13.7,1 19,6.3 19,13.7 13.7,19 6.3,19 1,13.7 1,6.3"
          fill="currentColor"
        />
      ) : (
        <circle cx="10" cy="10" r="9" fill="currentColor" />
      )}
      {tone === "info" ? (
        <>
          <circle cx="10" cy="5.8" r="1.25" className={glyph} />
          <rect x="9" y="8.5" width="2" height="6" rx="1" className={glyph} />
        </>
      ) : tone === "success" ? (
        <path
          d="M6 10.5 8.75 13.25 14 7.75"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-teal-PRIMARY"
        />
      ) : (
        <>
          <rect x="9" y={tone === "warning" ? 7 : 5} width="2" height="5.5" rx="1" className={glyph} />
          <circle cx="10" cy={tone === "warning" ? 14.75 : 14} r="1.2" className={glyph} />
        </>
      )}
    </svg>
  )
}

const DEFAULT_AUTO_HIDE = 5000

// Each position's stack is its own region landmark, so two open at once must
// not share a name — a landmark list reading 通知, 通知 tells nobody which is
// which. The default (top-center) stays plain 通知.
const DEFAULT_REGION_LABEL: Record<ToastPosition, string> = {
  "top-center": "通知",
  "top-right": "通知（右上）",
  "bottom-center": "通知（下方）",
  "bottom-right": "通知（右下）",
}

type ToastProps = {
  tone?: ToastTone
  title: string
  message?: string
  /**
   * Managed mode: show while true. Leave undefined for a static card.
   */
  open?: boolean
  /** Shows a close button; in managed mode also called on timeout. */
  onClose?: () => void
  /** Accessible name for the close button. */
  closeLabel?: string
  /** The spoken tone names (提示／成功／警告／錯誤). */
  toneLabels?: Partial<Record<ToastTone, string>>
  /**
   * Managed mode: ms before `onClose` is called; `null` = until closed.
   * Defaults to 5000, except danger, which stays — an error should not vanish
   * unread.
   */
  autoHide?: number | null
  /** Managed mode: which stack to appear in. */
  position?: ToastPosition
  /**
   * Managed mode: how many toasts in this stack show at once. Later ones wait,
   * unannounced and with their timers stopped, until an earlier one closes.
   */
  max?: number
  /**
   * Managed mode: name of the stack's region landmark. Defaults to 通知, with
   * the position added for the other stacks (通知（右上）) so names stay unique.
   */
  regionLabel?: string
  className?: string
}

export function Toast(props: ToastProps) {
  return props.open === undefined ? <ToastCard {...props} /> : <ManagedToast {...props} open={props.open} />
}

function ToastCard({
  tone = "info",
  title,
  message,
  onClose,
  closeLabel = "關閉通知",
  toneLabels,
  className,
}: ToastProps) {
  const toneLabel = { ...DEFAULT_TONE_LABELS, ...toneLabels }[tone]
  return (
    <div
      className={cn(
        "flex w-full max-w-[40rem] items-start gap-12 rounded-[1.2rem] bg-teal-PRIMARY px-20 py-16 shadow-toast",
        onClose && "pr-12",
        className,
      )}
    >
      <ToneIcon tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="typography-strong1 m-0 text-bg-light-off-white">
          <span className="sr-only">{toneLabel}：</span>
          {title}
        </p>
        {message ? (
          <p className="typography-body2 m-0 mt-4 text-bg-light-off-white/75">
            {message}
          </p>
        ) : null}
      </div>
      {onClose ? (
        <button
          type="button"
          data-toast-close=""
          aria-label={closeLabel}
          onClick={onClose}
          // On the teal card: light glyph, darker-teal hover, and the orange focus
          // outline that is the dark-surface rule (5.5:1 on teal).
          className={cn(
            iconButtonClasses(),
            "-my-4 text-bg-light-off-white hover:bg-teal-500 focus-visible:outline-orange-PRIMARY",
          )}
        >
          <PlusIcon className="size-20 rotate-45" />
        </button>
      ) : null}
    </div>
  )
}

function ManagedToast({
  open,
  onClose,
  tone = "info",
  title,
  message,
  autoHide,
  position = "top-center",
  max = 3,
  regionLabel,
  ...card
}: ToastProps & { open: boolean }) {
  const id = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Join the stack while open.
  const [container, setContainer] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (!open) return
    setContainer(register(position, id, regionLabel ?? DEFAULT_REGION_LABEL[position]))
    return () => {
      unregister(position, id)
      setContainer(null)
    }
  }, [open, position, id, regionLabel])

  const snap = useSyncExternalStore(
    (fn) => subscribe(position, fn),
    () => snapshot(position),
    () => "0|",
  )
  const { index, paused } = parse(snap, id)
  const visible = open && !!container && index >= 0 && index < Math.max(1, max)

  // Announce once per opening, when it first becomes visible (a toast held
  // back by `max` is announced when its turn comes, not when it was opened).
  const { message: announcement, say } = useAnnouncer()
  const announced = useRef(false)
  useEffect(() => {
    if (!open) {
      announced.current = false
      return
    }
    if (visible && !announced.current) {
      announced.current = true
      const toneLabel = { ...DEFAULT_TONE_LABELS, ...card.toneLabels }[tone]
      say(`${toneLabel}：${title}${message ? `，${message}` : ""}`)
    }
    // toneLabels is read, not watched: it only matters at the moment of saying.
  }, [open, visible, title, message, tone, say])

  // Auto-hide, counting only time spent visible and not paused.
  const remaining = useRef<number | null>(null)
  const ms = autoHide !== undefined ? autoHide : tone === "danger" ? null : DEFAULT_AUTO_HIDE
  useEffect(() => {
    if (!open) {
      remaining.current = null
      return
    }
    if (!visible || paused || ms === null || ms === Infinity) return
    if (remaining.current === null) remaining.current = ms
    const started = Date.now()
    const timer = setTimeout(() => onCloseRef.current?.(), Math.max(0, remaining.current))
    return () => {
      clearTimeout(timer)
      if (remaining.current !== null) remaining.current -= Date.now() - started
    }
  }, [open, visible, paused, ms])

  // Closing by hand: focus to the next toast's close button (or the previous
  // one's), else back to where it was before entering the stack.
  const close = () => {
    const buttons = Array.from(
      container?.querySelectorAll<HTMLElement>("[data-toast-close]") ?? [],
    )
    const mine = buttons.findIndex((b) => b === document.activeElement)
    const next = mine >= 0 ? (buttons[mine + 1] ?? buttons[mine - 1]) : undefined
    const back = returnFocusOf(position)
    onClose?.()
    if (mine < 0) return
    if (next) next.focus()
    else if (back?.isConnected) back.focus()
  }

  return (
    <>
      {/* Mounted with the component, open or not: it predates the text. */}
      <LiveRegion message={announcement} politeness={tone === "danger" ? "assertive" : "polite"} />
      {visible && container
        ? createPortal(
            <ToastCard
              {...card}
              tone={tone}
              title={title}
              message={message}
              onClose={close}
              className={cn("pointer-events-auto", card.className)}
            />,
            container,
          )
        : null}
    </>
  )
}
