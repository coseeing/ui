import { cn } from "../../lib/cn.js"
import { inputStyles, invalidStyles } from "../Input/Input.js"
import { ChevronDownIcon } from "../Icons/Icons.js"

// Select — NOT in Figma; SSO gap-fill on brand tokens. Input's shell (shared,
// not copied), plus a chevron affordance so it reads as a dropdown rather than a text input
// (the native arrow is suppressed by appearance-none).
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean
}

export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        aria-invalid={invalid || undefined}
        className={cn(
          inputStyles,
          "appearance-none pr-40",
          invalid && invalidStyles,
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-16 top-1/2 w-[1.4rem] -translate-y-1/2 text-teal-300" />
    </div>
  )
}
