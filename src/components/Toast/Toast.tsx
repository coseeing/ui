import { cn } from "../../lib/cn.js"
import { PlusIcon } from "../Icons/Icons.js"

// Toast — design-system extension (not in Figma). A dark teal card matching the
// SiteNav band, with a small tone dot.
//
// It was a light tint fill per tone, but green-100 is a lime that sits outside
// this palette's warm teal/orange/beige range, and a pale fill on a pale page
// is easy to miss — which it was. Sharing the nav's teal instead makes it read
// as chrome, separates it from the page at a glance, and keeps one surface for
// all four tones so the colour never has to carry contrast on its own.
//
// The card has no role="alert" / role="status" of its own. A toast appears at
// runtime, and a live region inserted together with its text is announced
// unreliably — often not at all for role="status" in VoiceOver. Announcing is
// the job of a region that already exists: ToastRegion keeps two mounted
// (assertive for danger, polite for the rest) and writes each toast's text
// into one. Rendering a Toast outside ToastRegion is fine for static content,
// but it will not be announced; put it in your own always-mounted region if
// it must be.

export type ToastTone = "info" | "success" | "warning" | "danger"

// Mid-ramp steps, chosen to stay legible against teal-PRIMARY.
const TONE_DOT: Record<ToastTone, string> = {
  info: "bg-blue-300",
  success: "bg-green-300",
  warning: "bg-orange-PRIMARY",
  danger: "bg-red-300",
}

type ToastProps = {
  tone?: ToastTone
  title: string
  message?: string
  /** Shows a close button. */
  onClose?: () => void
  /** Accessible name for the close button. */
  closeLabel?: string
  /** Lets ToastRegion find the close button to move focus to. */
  closeRef?: React.Ref<HTMLButtonElement>
  className?: string
}

export function Toast({
  tone = "info",
  title,
  message,
  onClose,
  closeLabel = "關閉通知",
  closeRef,
  className,
}: ToastProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[40rem] items-start gap-12 rounded-[1.2rem] bg-teal-PRIMARY px-20 py-16 shadow-[0_0.8rem_2.4rem_rgb(16_36_42_/_0.24)]",
        onClose && "pr-12",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("mt-6 size-8 shrink-0 rounded-full", TONE_DOT[tone])}
      />
      <div className="min-w-0 flex-1">
        <p className="typography-strong1 m-0 text-bg-light-off-white">{title}</p>
        {message ? (
          <p className="typography-body2 m-0 mt-4 text-bg-light-off-white/75">
            {message}
          </p>
        ) : null}
      </div>
      {onClose ? (
        <button
          ref={closeRef}
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="-my-4 flex size-32 shrink-0 cursor-pointer items-center justify-center rounded-8 border-0 bg-transparent p-0 text-bg-light-off-white transition-colors hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-PRIMARY"
        >
          <PlusIcon className="size-20 rotate-45" />
        </button>
      ) : null}
    </div>
  )
}
