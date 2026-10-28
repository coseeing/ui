import { cn } from "../../lib/cn.js"

// Checkbox — NOT in Figma; SSO gap-fill on brand tokens.
type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: React.ReactNode
  invalid?: boolean
  /** Applied to the wrapping <label> when `label` is set. */
  labelClassName?: string
}

export function Checkbox({
  className,
  labelClassName,
  invalid,
  label,
  id,
  ...props
}: CheckboxProps) {
  const control = (
    <input
      id={id}
      type="checkbox"
      aria-invalid={invalid || undefined}
      className={cn(
        "size-16 shrink-0 rounded-[0.4rem] border border-bg-warm-gray bg-neutral-white text-teal-PRIMARY accent-teal-PRIMARY transition-colors focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-teal-PRIMARY",
        invalid && "border-red-PRIMARY",
        className,
      )}
      {...props}
    />
  )

  if (!label) return control

  return (
    <label
      htmlFor={id}
      className={cn(
        "typography-body1 inline-flex items-center gap-8 text-teal-700",
        labelClassName,
      )}
    >
      {control}
      {label}
    </label>
  )
}
