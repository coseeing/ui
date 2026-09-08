import { cn } from "../../lib/cn.js"

// Toast — design-system extension (not in Figma). A dark teal card matching the
// SiteNav band, with a small tone dot.
//
// It was a light tint fill per tone, but green-100 is a lime that sits outside
// this palette's warm teal/orange/beige range, and a pale fill on a pale page
// is easy to miss — which it was. Sharing the nav's teal instead makes it read
// as chrome, separates it from the page at a glance, and keeps one surface for
// all four tones so the colour never has to carry contrast on its own.
//
// Danger announces as role="alert"; everything else as polite role="status".
// Positioning is left to the caller (see ToastNotice for the app's placement).

type ToastTone = "info" | "success" | "warning" | "danger"

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
  className?: string
}

export function Toast({ tone = "info", title, message, className }: ToastProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex w-full max-w-[40rem] items-start gap-12 rounded-[1.2rem] bg-teal-PRIMARY px-20 py-16 shadow-[0_0.8rem_2.4rem_rgb(16_36_42_/_0.24)]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("mt-6 size-8 shrink-0 rounded-full", TONE_DOT[tone])}
      />
      <div className="min-w-0">
        <p className="typography-strong1 m-0 text-bg-light-off-white">{title}</p>
        {message ? (
          <p className="typography-body2 m-0 mt-4 text-bg-light-off-white/75">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
