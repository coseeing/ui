import { cn } from "../../lib/cn.js"
import { ChevronDownIcon } from "../Icons/Icons.js"

// Select — NOT in Figma; SSO gap-fill on brand tokens. Matches the Input shell,
// plus a chevron affordance so it reads as a dropdown rather than a text input
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
          "typography-body1 block w-full appearance-none rounded-8 border border-bg-warm-gray bg-neutral-white py-8 pl-16 pr-40 text-teal-700 transition-colors hover:border-teal-100 focus:border-teal-PRIMARY focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-PRIMARY focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-white disabled:cursor-not-allowed disabled:opacity-50",
          invalid && "border-red-PRIMARY focus:border-red-PRIMARY focus-visible:ring-red-PRIMARY",
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
