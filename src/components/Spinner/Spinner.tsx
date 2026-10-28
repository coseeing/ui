import { cn } from "../../lib/cn.js"

// Spinner — design-system extension (not in Figma). The ring Button's
// `isLoading` already draws (current-colour border, transparent top), pulled
// out as a component with sizes and a label. With reduced motion it stays
// still: a static open ring still reads as "in progress" without movement.
//
// role="status" carries the label to screen readers. Note that a status
// region announces *changes*: a Spinner mounted together with its label is
// often not announced at all. When the start and end of a wait must be heard,
// use LoadingOverlay, whose live region is always mounted.

const SIZE = {
  sm: "size-16 border-2",
  md: "size-24 border-[0.3rem]",
  lg: "size-40 border-4",
} as const

type SpinnerProps = {
  /** Accessible name; visually hidden unless `showLabel`. */
  label?: string
  size?: keyof typeof SIZE
  /** Show the label next to the ring. */
  showLabel?: boolean
  className?: string
}

/** The ring alone, decorative. Shared with LoadingOverlay. */
export function SpinnerRing({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZE
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-solid border-current border-t-transparent motion-reduce:animate-none",
        SIZE[size],
        className,
      )}
    />
  )
}

export function Spinner({
  label = "載入中",
  size = "md",
  showLabel = false,
  className,
}: SpinnerProps) {
  return (
    <span
      role="status"
      className={cn("inline-flex items-center gap-8 text-teal-PRIMARY", className)}
    >
      <SpinnerRing size={size} />
      <span className={showLabel ? "typography-body2 text-teal-700" : "sr-only"}>
        {label}
      </span>
    </span>
  )
}
