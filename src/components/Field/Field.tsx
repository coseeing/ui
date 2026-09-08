import { cn } from "../../lib/cn.js"

// Field primitives — NOT in Figma; SSO gap-fill built on brand tokens. Mirrors
// the `.ory-elements label` and `--interface-*-validation-*` treatment.

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "typography-strong2 block text-teal-700",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  )
}

type ValidationMessageProps = {
  variant?: "danger" | "success"
  /**
   * Set false when rendering inside an always-mounted live region (as Field
   * does) — a dynamically inserted role="alert" alone is unreliable.
   */
  announce?: boolean
  className?: string
  children: React.ReactNode
}

export function ValidationMessage({
  variant = "danger",
  announce = true,
  className,
  children,
}: ValidationMessageProps) {
  return (
    <p
      role={announce && variant === "danger" ? "alert" : undefined}
      className={cn(
        "typography-body2",
        // Both meet WCAG AA on every brand surface — white, off-white, and
        // beige: red-600 is 6.13 / 5.69 / 4.95, green-800 is 5.98 / 5.55 / 4.83.
        // green-700 is NOT safe here; it only passes on pure white (4.53) and
        // drops to 4.21 on the page background. See --color-green-800.
        variant === "danger" ? "text-red-600" : "text-green-800",
        className,
      )}
    >
      {children}
    </p>
  )
}

type FieldProps = {
  label?: React.ReactNode
  htmlFor?: string
  error?: React.ReactNode
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** Label + control + validation message, stacked. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("grid gap-8", className)}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {hint && !error ? (
        <p className="typography-body2 text-neutral-dark-gray">{hint}</p>
      ) : null}
      {/* Always-mounted live region so screen readers reliably announce
          errors that appear later; the message itself skips role="alert". */}
      <div aria-live="polite">
        {error ? <ValidationMessage announce={false}>{error}</ValidationMessage> : null}
      </div>
    </div>
  )
}
