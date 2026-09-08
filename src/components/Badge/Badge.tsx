import { cn } from "../../lib/cn.js"

// Badge — a read-only status marker (帳號身分, 已連結).
//
// Deliberately not Tag: Tag is the Figma category pill from 列表頁 — saturated
// orange-PRIMARY fill, near-black label — and at that weight, sitting next to
// an action, it reads as a button you can press. A status you cannot change
// should not compete with the controls around it, so this keeps the pill shape
// but drops to a tint fill and normal-weight label, landing one step above the
// muted caption it sits beside rather than three.

type BadgeTone = "brand" | "muted"

const TONE: Record<BadgeTone, string> = {
  // orange-100 behind teal-700 keeps the brand accent without the fill
  // shouting; contrast is well clear of AA.
  brand: "bg-orange-100 text-teal-700",
  muted: "bg-neutral-very-light-gray text-neutral-dark-gray",
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
