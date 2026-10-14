import { cn } from "../../lib/cn.js"

// Textarea — NOT in Figma; SSO gap-fill on brand tokens. The same shell as
// Input (rounded-8, warm-gray border, white field, teal text, orange focus
// ring), so a form mixing the two reads as one set. Keep the two in sync.
//
// `autoResize` is CSS `field-sizing: content`, not script, so this stays a
// hook-free Server Component. Chromium and Safari grow the field with its
// content; browsers without support (Firefox, at the time of writing) keep
// the fixed `rows` height and the manual resize handle, which is the same
// field without the convenience.
const textareaStyles =
  "typography-body1 block w-full rounded-8 border border-bg-warm-gray bg-neutral-white px-16 py-8 text-teal-700 transition-colors placeholder:text-neutral-dark-gray hover:border-teal-100 focus:border-teal-PRIMARY focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-PRIMARY focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-white disabled:cursor-not-allowed disabled:opacity-50"

const invalidStyles =
  "border-red-PRIMARY focus:border-red-PRIMARY focus-visible:ring-red-PRIMARY"

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
  /** Grow with the content, from `rows` lines up. See the note above. */
  autoResize?: boolean
}

export function Textarea({
  className,
  invalid,
  autoResize,
  rows = 4,
  style,
  ...props
}: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        textareaStyles,
        autoResize ? "field-sizing-content resize-none" : "resize-y",
        invalid && invalidStyles,
        className,
      )}
      // field-sizing ignores `rows`, so restate it as a minimum height: that
      // many lines, plus the vertical padding (py-8) and border.
      style={
        autoResize
          ? { minHeight: `calc(${rows}lh + 1.6rem + 0.2rem)`, ...style }
          : style
      }
      {...props}
    />
  )
}
