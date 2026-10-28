"use client"

import { useEffect, useId, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { PlusIcon } from "../Icons/Icons.js"

// Dialog — design-system extension (not in Figma), styled in the brand
// language: the auth-panel signature (white rounded-24 panel, orange top
// accent, deep teal shadow) over the MemberCard-style teal backdrop blur.
// Built on the native <dialog> element, so focus trapping, ESC-to-close, and
// inert background come from the platform; backdrop click also closes.

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  /** Footer actions, e.g. Buttons. Right-aligned, wraps on narrow screens. */
  actions?: React.ReactNode
  size?: "sm" | "md"
  /**
   * Accessible name for the close button — the only user-facing string this
   * package ships. Override it to match the host app's locale.
   */
  closeLabel?: string
  className?: string
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  size = "sm",
  closeLabel = "關閉",
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // The inner panel covers the whole dialog box, so the dialog element
        // itself is only the click target when the backdrop is clicked.
        if (e.target === ref.current) onClose()
      }}
      className={cn(
        // Same shell as Card — white, rounded-24, warm-gray hairline — so a
        // dialog reads as the surface the rest of the app uses. It keeps a
        // shadow and backdrop because, unlike a Card, it floats.
        "m-auto w-[calc(100vw-4rem)] overflow-hidden rounded-24 border border-bg-warm-gray bg-neutral-white p-0 shadow-[0_1.6rem_4rem_rgb(16_36_42_/_0.25)] backdrop:bg-teal-700/60 backdrop:backdrop-blur-[0.3rem]",
        size === "sm" ? "max-w-[44rem]" : "max-w-[64rem]",
        className,
      )}
    >
      {/* No orange accent bar: Card dropped it, and a dialog is the same
          surface. Padding and type scale track Card's header.
          Bottom padding depends on what follows: 16 before a body (the gap
          between heading and content); 16/20 before inline actions (see
          below); the same as the top when the header is all there is. */}
      <div
        className={cn(
          "grid gap-4 px-20 pt-20 tablet:px-24 tablet:pt-24",
          children ? "pb-16" : actions ? "pb-16 tablet:pb-20" : "pb-20 tablet:pb-24",
        )}
      >
        <div className="flex items-start justify-between gap-16">
          <h2 id={titleId} className="typography-headline4 m-0 text-teal-700">
            {title}
          </h2>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="-mr-4 flex size-32 shrink-0 cursor-pointer items-center justify-center rounded-8 border-0 bg-transparent p-0 text-teal-300 transition-colors hover:bg-bg-light-beige hover:text-teal-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-PRIMARY"
          >
            <PlusIcon className="size-16 rotate-45" />
          </button>
        </div>
        {description ? (
          <p className="typography-body2 m-0 text-teal-300">{description}</p>
        ) : null}
      </div>

      {children ? (
        <div className="px-20 pb-20 tablet:px-24 tablet:pb-24">{children}</div>
      ) : null}

      {/* With a body: a flush footer bar, matching FlowForm's
          submitLayout="footer" — the established place for a card's actions
          in this app, and it separates the actions from the content.
          Without one (a confirmation: title, a sentence, buttons) the bar was
          as tall as everything above it and made the dialog bottom-heavy, so
          the actions sit in the white panel instead.
          Their spacing is tighter than the top padding on purpose: 16/20
          above and below the buttons against 20/24 above the title. Bordered
          buttons show every pixel of white below them, while the title's
          line box adds ~7px of half-leading above its glyphs — so equal
          numbers (24/24) still read as an empty bottom. */}
      {actions ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-end gap-12 px-20 tablet:px-24",
            children
              ? "border-t border-bg-warm-gray bg-bg-light-off-white py-16"
              : "pb-16 tablet:pb-20",
          )}
        >
          {actions}
        </div>
      ) : null}
    </dialog>
  )
}
