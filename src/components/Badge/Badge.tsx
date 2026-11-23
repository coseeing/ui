import { cn } from "../../lib/cn.js"

// Badge — a read-only status marker (帳號身分, 已連結, 審核中).
//
// Deliberately not Tag: Tag is the Figma category pill from 列表頁 — saturated
// orange-PRIMARY fill, near-black label — and at that weight, sitting next to
// an action, it reads as a button you can press. A status you cannot change
// should not compete with the controls around it, so this keeps the pill shape
// but drops to a tint fill and normal-weight label, landing one step above the
// muted caption it sits beside rather than three.
//
// The status tones (success / warning / danger) are outlined, not filled: a
// transparent pill with a hairline ring and text in the tone. Their text sits
// on the page itself, so its contrast is the contrast against the surface —
// and each tone colour is one that clears 4.5:1 on all three brand surfaces.
// A tinted fill was tried and does not: even an 8% tint over beige drops
// green-800 to 4.36, red-600 to 4.43 and orange-800 to 4.14.

type BadgeTone = "brand" | "muted" | "success" | "warning" | "danger"

const TONE: Record<BadgeTone, string> = {
  // orange-100 behind teal-700 keeps the brand accent without the fill
  // shouting; 12.52:1.
  brand: "bg-orange-100 text-teal-700",
  // teal-200 on very-light-gray is 4.75:1. This was neutral-dark-gray, 4.42 —
  // a WCAG AA failure no test caught, because Badge had no stories for axe.
  muted: "bg-neutral-very-light-gray text-teal-200",
  // Outlined; contrast is text against the surface (white / off-white / beige).
  // green-800: 5.98 / 5.55 / 4.83.
  success: "bg-transparent text-green-800 ring-1 ring-inset ring-current",
  // orange-800: 5.64 / 5.24 / 4.55.
  warning: "bg-transparent text-orange-800 ring-1 ring-inset ring-current",
  // red-600: 6.13 / 5.69 / 4.95.
  danger: "bg-transparent text-red-600 ring-1 ring-inset ring-current",
}

type BadgeProps = {
  tone?: BadgeTone
  className?: string
  children: React.ReactNode
}

export function Badge({ tone = "brand", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "typography-emphasised3 inline-flex items-center rounded-[6rem] px-12 py-4",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
