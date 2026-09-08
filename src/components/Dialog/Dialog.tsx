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
        "m-auto w-[calc(100vw-4rem)] rounded-24 border-0 bg-neutral-white p-0 shadow-[0_1.6rem_4rem_rgb(16_36_42_/_0.25)] backdrop:bg-teal-700/60 backdrop:backdrop-blur-[0.3rem]",
        size === "sm" ? "max-w-[44rem]" : "max-w-[64rem]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-24 p-24 tablet:p-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-orange-PRIMARY" />
        <div className="flex items-start justify-between gap-16">
          <h2 id={titleId} className="typography-headline4 m-0 text-teal-700">
            {title}
          </h2>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="flex size-32 shrink-0 cursor-pointer items-center justify-center rounded-8 border-0 bg-transparent p-0 text-teal-700 transition-colors hover:bg-bg-light-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-PRIMARY"
          >
            <PlusIcon className="rotate-45" />
          </button>
        </div>
        {description ? (
          <p className="typography-body1 mt-8 text-teal-300">{description}</p>
        ) : null}
        {children ? <div className="mt-16">{children}</div> : null}
        {actions ? (
          <div className="mt-24 flex flex-wrap justify-end gap-12">{actions}</div>
        ) : null}
      </div>
    </dialog>
  )
}
