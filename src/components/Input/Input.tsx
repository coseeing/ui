import { cn } from "../../lib/cn.js"

// Input — NOT in the Figma "Brand" file; built to fill the SSO gap using the
// same brand tokens the .ory-elements inputs use (rounded-8, warm-gray border,
// white field, teal text, orange focus ring). Keep visually in sync with the
// `.ory-elements :is(input, …)` rules in globals.css.
const inputStyles =
  "typography-body1 block w-full rounded-8 border border-bg-warm-gray bg-neutral-white px-16 py-8 text-teal-700 transition-colors placeholder:text-neutral-dark-gray hover:border-teal-100 focus:border-teal-PRIMARY focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-PRIMARY focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-white disabled:cursor-not-allowed disabled:opacity-50"

const invalidStyles =
  "border-red-PRIMARY focus:border-red-PRIMARY focus-visible:ring-red-PRIMARY"

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
