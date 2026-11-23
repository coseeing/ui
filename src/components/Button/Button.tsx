import { cn } from "../../lib/cn.js"
import { Link, type AnchorLike } from "../Link/Link.js"

const baseStyles =
  "typography-strong1 inline-flex items-center justify-center transition-colors duration-200 focus:outline-hidden focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"

// Sourced from Figma "Brand" → Elements. States Default/Hover/Focused map to
// default / hover: / focus-visible:. Buttons are flat (no shadow) per the design.
//
// Focus indicators (WCAG 1.4.11, 3:1 against what they sit on):
// - Filled buttons draw an INSET ring, measured against their own focus
//   fill, so it holds on any page surface, light or dark: orange on the
//   teal fills 6.34, orange on danger's red-700 4.06, teal on primary-light's
//   orange-500 4.35.
// - greenStroke is transparent, so its indicator is the package-wide one: a
//   teal-PRIMARY outline 2px outside the button (6.57:1 on its hover fill,
//   8.9–11 on the brand surfaces). It used to swap its teal stroke for an
//   orange ring — 1.19:1 on that fill, less visible focused than not.
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
      "bg-teal-PRIMARY text-bg-light-off-white ring-1 ring-inset ring-bg-warm-gray hover:bg-teal-500 focus-visible:bg-teal-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-PRIMARY",
    // Small Button - Dark: teal fill, off-white label, no border.
    dark: "bg-teal-PRIMARY text-bg-light-off-white hover:bg-teal-500 focus-visible:bg-teal-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-PRIMARY",
    // Small Button - GreenStroke: transparent, teal label + teal stroke, neutral hover fill.
    greenStroke:
      "bg-transparent text-teal-PRIMARY ring-1 ring-inset ring-teal-PRIMARY hover:bg-neutral-beige-gray focus-visible:bg-neutral-beige-gray focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-teal-PRIMARY",
    // danger: not in Figma — extension for SSO destructive actions (logout/delete).
    // Uses red-600 (not red-PRIMARY) so white text meets WCAG AA (>=4.5:1).
    danger:
      "bg-red-600 text-neutral-white hover:bg-red-700 focus-visible:bg-red-700 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-PRIMARY",
  },
} as const

const iconButtonBase =
  "inline-flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-teal-PRIMARY"

const iconButtonSize = {
  // 32×32, rounded square: row actions (ReorderableList), close (Dialog, Toast).
  md: "size-32 rounded-8 hover:bg-bg-light-beige aria-disabled:hover:bg-transparent",
  // 24×24 (the WCAG 2.5.8 minimum), round: inside a pill (Combobox chips).
  sm: "size-24 rounded-full hover:bg-bg-light-beige",
} as const

/**
 * The square/round icon-only button used across the package — one shell, so
 * sizes, hover, disabled and focus match wherever an × or a chevron is a
 * button. Callers add colour overrides for their surface via cn() (Dialog's
 * muted ×, Toast's on teal). Internal, like buttonClasses.
 */
export function iconButtonClasses(size: keyof typeof iconButtonSize = "md") {
  return cn(iconButtonBase, iconButtonSize[size])
}

export type ButtonVariant = keyof typeof variantStyles
export type ButtonTheme<V extends ButtonVariant> = keyof (typeof variantStyles)[V]

/**
 * The class list for a variant/theme pair, for controls that must look like a
 * Button but render their own element (e.g. Menu's trigger, which needs ARIA
 * attributes and a ref Button does not take). Internal; not in the barrel.
 */
export function buttonClasses<V extends ButtonVariant>(variant: V, theme: ButtonTheme<V>) {
  const styles = variantStyles[variant]
  return cn(baseStyles, styles.base, styles[theme] as string)
}

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
  const classes = cn(buttonClasses(variant, theme), className)
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
