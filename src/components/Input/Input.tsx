import { cn } from "../../lib/cn.js"

// Input — NOT in the Figma "Brand" file; built to fill the SSO gap using the
// same brand tokens the .ory-elements inputs use (rounded-8, warm-gray border,
// white field, teal text, teal focus outline). Keep visually in sync with the
// `.ory-elements :is(input, …)` rules in globals.css.
//
// The shell is shared, not copied: Textarea, Select and Combobox build on
// these two strings (adding only what differs, like room for a chevron), so
// a change here reaches every text-like field. Internal — not in the barrel,
// like Button's buttonClasses.
export const inputStyles =
  "typography-body1 block w-full rounded-8 border border-bg-warm-gray bg-neutral-white px-16 py-8 text-teal-700 transition-colors placeholder:text-neutral-dark-gray hover:border-teal-100 focus:border-teal-PRIMARY focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-teal-PRIMARY"

/**
 * Invalid: red border, and a red focus outline — red-600 is 6.13:1 on white,
 * 5.69 on off-white, 4.95 on beige — so the error is still signalled while
 * the field has focus. (This replaced a red *ring*, dead since focus became
 * an outline.)
 */
export const invalidStyles =
  "border-red-PRIMARY focus:border-red-PRIMARY focus-visible:outline-red-600"

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  type?: "text" | "email" | "password" | "tel" | "number" | "search" | "url"
  invalid?: boolean
}

export function Input({ className, type = "text", invalid, ...props }: InputProps) {
  return (
    <input
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(inputStyles, invalid && invalidStyles, className)}
      {...props}
    />
  )
}
