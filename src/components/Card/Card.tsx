import { cn } from "../../lib/cn.js"

// Card — the one surface every auth page renders content on: sign-in, the
// settings sections, consent, logout. Keeping a single container means the
// login form and a settings section are the same object at the same width
// with the same padding, instead of two containers that merely resemble
// each other.
//
// Deliberately flat (no drop shadow, no accent bar): several of these stack on
// /settings, and per-card ornament reads as noise once there is more than one.

type CardProps = {
  id?: string
  /** Omit for a bare panel — the sign-in form has the page title above it. */
  title?: string
  description?: string
  /**
   * Pad the body. Turn off when children run edge-to-edge on purpose:
   * FlowForm's footer bar and SocialConnections' rows both need to reach the
   * card border to draw their full-width dividers.
   */
  padded?: boolean
  className?: string
  children: React.ReactNode
}

export function Card({
  id,
  title,
  description,
  padded = false,
  className,
  children,
}: CardProps) {
  return (
    <section
      id={id}
      className={cn(
        "overflow-hidden rounded-24 border border-bg-warm-gray bg-neutral-white",
        className,
      )}
    >
      {title ? (
        <div className="grid gap-4 px-20 pb-16 pt-20 tablet:px-24 tablet:pt-24">
          <h2 className="typography-headline4 m-0 text-teal-700">{title}</h2>
          {description ? (
            <p className="typography-body2 m-0 text-teal-300">{description}</p>
          ) : null}
        </div>
      ) : null}

      {padded ? (
        <div
          className={cn(
            "px-20 pb-20 tablet:px-24 tablet:pb-24",
            // No header above, so the body owns the top padding too.
            !title && "pt-20 tablet:pt-24",
          )}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  )
}
