import { cn } from "../../lib/cn.js"
import { inputStyles, invalidStyles } from "../Input/Input.js"

// Textarea — NOT in Figma; SSO gap-fill on brand tokens. Input's shell (shared,
// not copied), so a form mixing the two reads as one set.
//
// `autoResize` is CSS `field-sizing: content`, not script, so this stays a
// hook-free Server Component. Chromium and Safari grow the field with its
// content; browsers without support (Firefox, at the time of writing) keep
// the fixed `rows` height and the manual resize handle, which is the same
// field without the convenience.

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
        inputStyles,
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
