import { cn } from "../../lib/cn.js"
import { Link, type AnchorLike } from "../Link/Link.js"

const baseStyles =
  "typography-strong1 inline-flex items-center justify-center transition-colors duration-200 focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"

// Sourced from Figma "Brand" → Elements. States Default/Hover/Focused map to
// default / hover: / focus-visible:. Buttons are flat (no shadow) per the design.
const variantStyles = {
  primary: {
    base: "rounded-[62px] px-36 py-12",
    // Primary Button - Light: orange fill, dark teal label.
    light:
      "bg-orange-PRIMARY text-teal-700 hover:bg-orange-500 focus-visible:bg-orange-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-PRIMARY",
    // Primary Button - Dark: teal fill, white label.
    dark: "bg-teal-PRIMARY text-neutral-white hover:bg-teal-500 focus-visible:bg-teal-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-PRIMARY",
  },
  small: {
    base: "rounded-8 px-16 py-8",
    // Small Button - Light: teal fill, off-white label, warm-gray hairline border.
    light:
      "bg-teal-PRIMARY text-bg-light-off-white ring-1 ring-inset ring-bg-warm-gray hover:bg-teal-500 focus-visible:bg-teal-500 focus-visible:ring-2 focus-visible:ring-orange-PRIMARY",
    // Small Button - Dark: teal fill, off-white label, no border.
    dark: "bg-teal-PRIMARY text-bg-light-off-white hover:bg-teal-500 focus-visible:bg-teal-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-PRIMARY",
    // Small Button - GreenStroke: transparent, teal label + teal stroke, neutral hover fill.
    greenStroke:
      "bg-transparent text-teal-PRIMARY ring-1 ring-inset ring-teal-PRIMARY hover:bg-neutral-beige-gray focus-visible:bg-neutral-beige-gray focus-visible:ring-2 focus-visible:ring-orange-PRIMARY",
    // danger: not in Figma — extension for SSO destructive actions (logout/delete).
    // Uses red-600 (not red-PRIMARY) so white text meets WCAG AA (>=4.5:1).
    danger:
      "bg-red-600 text-neutral-white hover:bg-red-700 focus-visible:bg-red-700 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-PRIMARY",
  },
} as const

type ButtonVariant = keyof typeof variantStyles
type ButtonTheme<V extends ButtonVariant> = keyof (typeof variantStyles)[V]

type ButtonProps<V extends ButtonVariant = "primary"> = {
  id?: string
  href?: string
  /** Marks the link branch as the current page. Ignored without `href`. */
  current?: boolean
  /**
   * What the link branch renders. Defaults to a plain `<a>`; pass `next/link`
   * for client-side navigation. Ignored without `href`.
   */
  as?: "a" | AnchorLike
  type?: "button" | "submit" | "reset"
  className?: string
  variant?: V
  theme?: ButtonTheme<V>
  disabled?: boolean
  /** Shows a spinner and disables the button while an async action runs. */
  isLoading?: boolean
  /**
   * Submitted with the form when this button activates it — how a single form
   * distinguishes multiple submit buttons (e.g. consent accept vs. deny).
   * Ignored on the link branch, which submits nothing.
   */
  name?: string
  value?: string
  /** Widened to HTMLElement because this fires on the <a> branch too. */
  onClick?: React.MouseEventHandler<HTMLElement>
  children: React.ReactNode
}

export function Button<V extends ButtonVariant = "primary">({
  id,
  href,
  current,
  as,
  type = "button",
  className,
  variant = "primary" as V,
  theme = "light" as ButtonTheme<V>,
  disabled = false,
  isLoading = false,
  name,
  value,
  onClick,
  children,
}: ButtonProps<V>) {
  const styles = variantStyles[variant]
  const themeClass = styles[theme] as string
  const classes = cn(baseStyles, styles.base, themeClass, className)
  const isInert = disabled || isLoading

  // Render as a link unless inert — a disabled <a> can't be inert, so fall
  // back to a real disabled <button>.
  if (href && !isInert) {
    return (
      // onClick reaches the anchor as well: callers pass a handler alongside
      // href (EventCard's onCtaClick, the logout confirm) and it was being
      // dropped here, so those clicks silently did nothing.
      <Link
        id={id}
        href={href}
        current={current}
        {...(as ? { as } : {})}
        className={classes}
        onClick={onClick}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      {...(id ? { id } : {})}
      {...(name ? { name } : {})}
      {...(value ? { value } : {})}
      className={classes}
      disabled={isInert}
      aria-disabled={isInert || undefined}
      aria-busy={isLoading || undefined}
      onClick={onClick}
      type={type}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="mr-8 size-[1.4rem] shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  )
}
