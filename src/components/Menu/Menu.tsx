"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import { buttonClasses, type ButtonTheme, type ButtonVariant } from "../Button/Button.js"
import type { AnchorLike } from "../Link/Link.js"

// Menu — design-system extension (not in Figma). A button that opens a list
// of actions or links (更多操作, 帳號選單). Not a form control: for picking a
// value, use Select or Combobox.
//
// WAI-ARIA APG "Menu Button": the trigger has aria-haspopup="menu" and
// aria-expanded; DOM focus moves into the menu, onto one menuitem at a time
// (every item is tabIndex −1, so Tab leaves the menu instead of walking it).
// ↑/↓ wrap, Home/End jump, typing jumps to the next item starting with that
// text, Enter/Space activate, Esc closes and returns focus to the trigger, Tab
// closes and lets focus move on. It does not trap focus — it is not a Dialog.
//
// The trigger is styled by Button's variant/theme classes; the popup is the
// white rounded-8 panel the Combobox popup uses.

type MenuAction = {
  type?: "item"
  key: string
  label: string
  onSelect?: () => void
  /** Renders the item as a link (<a role="menuitem">). */
  href?: string
  /** The app's router link, for `href` items. */
  as?: "a" | AnchorLike
  /** aria-disabled: still focusable, so it is discoverable, but inert. */
  disabled?: boolean
  /** red-600 text: destructive actions. */
  tone?: "danger"
}

type MenuSeparator = { type: "separator" }

export type MenuItem = MenuAction | MenuSeparator

/** Any Button variant with one of its own themes; defaults to small/greenStroke. */
type TriggerStyle =
  | { [V in ButtonVariant]: { variant: V; theme?: ButtonTheme<V> } }[ButtonVariant]
  | { variant?: undefined; theme?: ButtonTheme<"small"> }

/** An icon-only trigger has no visible text, so it must be named. */
export type MenuTrigger = TriggerStyle & {
  /** Shown before the label, or alone with `iconOnly`. */
  icon?: React.ReactNode
} & ({ iconOnly?: false; "aria-label"?: string } | { iconOnly: true; "aria-label": string })

type MenuProps = {
  /** The trigger's visible text, and the menu's name. */
  label: string
  trigger?: MenuTrigger
  items: MenuItem[]
  placement?: "bottom-start" | "bottom-end"
  className?: string
}

// Focused item: beige fill plus a teal-PRIMARY bar (10.5:1 on beige; the fill
// alone is 1.24:1, so the bar is what meets WCAG 1.4.11). `outline-hidden`,
// not `outline-none`: it is a transparent outline, which forced-colors mode
// paints, so the item stays visibly focused when shadows and fills are gone.
const itemStyles =
  "typography-body1 flex w-full cursor-pointer items-center gap-8 border-0 bg-transparent px-16 py-8 text-left no-underline transition-colors hover:bg-bg-light-off-white focus:bg-bg-light-beige focus:shadow-[inset_0.4rem_0_0_var(--color-teal-PRIMARY)] focus:outline-hidden aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent"

/** Gap kept between the popup and the viewport edge, in px. */
const VIEWPORT_MARGIN = 8

export function Menu({
  label,
  trigger,
  items,
  placement = "bottom-start",
  className,
}: MenuProps) {
  const baseId = useId()
  const triggerId = `${baseId}-trigger`
  const menuId = `${baseId}-menu`
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  // Where focus goes once the menu is open: an index, "first" or "last".
  const [focusTarget, setFocusTarget] = useState<"first" | "last" | null>(null)
  // The alignment actually used; flips when `placement` would overflow.
  const [align, setAlign] = useState<"start" | "end">(
    placement === "bottom-end" ? "end" : "start",
  )

  const menuItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])

  const openMenu = (target: "first" | "last") => {
    setOpen(true)
    setFocusTarget(target)
  }
  const close = (returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  // Keep the popup on screen: flip to the other edge of the trigger when the
  // preferred one would push it past the viewport. Measured before paint.
  useLayoutEffect(() => {
    if (!open) return
    const preferred = placement === "bottom-end" ? "end" : "start"
    const menu = menuRef.current
    const button = triggerRef.current
    if (!menu || !button) return
    const t = button.getBoundingClientRect()
    const width = menu.offsetWidth
    const fitsStart = t.left + width <= window.innerWidth - VIEWPORT_MARGIN
    const fitsEnd = t.right - width >= VIEWPORT_MARGIN
    setAlign(
      preferred === "start"
        ? fitsStart || !fitsEnd ? "start" : "end"
        : fitsEnd || !fitsStart ? "end" : "start",
    )
  }, [open, placement])

  useEffect(() => {
    if (!open || !focusTarget) return
    const all = menuItems()
    ;(focusTarget === "first" ? all[0] : all[all.length - 1])?.focus()
    setFocusTarget(null)
  }, [open, focusTarget])

  // Click outside closes, without moving focus.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  // Typeahead: characters typed within 500ms of each other accumulate.
  const typeahead = useRef({ buffer: "", timer: 0 })

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      openMenu("first")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      openMenu("last")
    }
    // Enter and Space arrive as a click.
  }

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const all = menuItems()
    const current = all.indexOf(document.activeElement as HTMLElement)
    const focusAt = (i: number) => all[(i + all.length) % all.length]?.focus()

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        return focusAt(current + 1)
      case "ArrowUp":
        e.preventDefault()
        return focusAt(current - 1)
      case "Home":
        e.preventDefault()
        return focusAt(0)
      case "End":
        e.preventDefault()
        return focusAt(all.length - 1)
      case "Escape":
        e.preventDefault()
        return close(true)
      case "Tab":
        // Let the browser move focus on first, then close behind it. Hiding
        // the menu inside this handler would hide the focused item before
        // the browser has used it as the starting point.
        window.setTimeout(() => setOpen(false))
        return
      case " ":
        // A link does not activate on Space natively; a button does, but
        // handling both here keeps them identical.
        e.preventDefault()
        return (document.activeElement as HTMLElement | null)?.click()
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = typeahead.current
      window.clearTimeout(t.timer)
      t.buffer += e.key.toLocaleLowerCase()
      t.timer = window.setTimeout(() => (t.buffer = ""), 500)
      // Repeating one character cycles through items starting with it.
      const repeated = t.buffer.split("").every((c) => c === t.buffer[0])
      const query = repeated ? t.buffer[0]! : t.buffer
      const start = repeated || t.buffer.length === 1 ? current + 1 : current
      for (let step = 0; step < all.length; step++) {
        const i = (start + step) % all.length
        if (all[i]!.textContent?.trim().toLocaleLowerCase().startsWith(query)) {
          focusAt(i)
          break
        }
      }
    }
  }

  const activate = (item: MenuAction) => (e: React.MouseEvent) => {
    if (item.disabled) {
      e.preventDefault()
      return
    }
    const itemEl = e.currentTarget
    item.onSelect?.()
    setOpen(false)
    // Back to the trigger, as APG does — unless the action already moved
    // focus somewhere else, in which case leave it there.
    const focused = document.activeElement
    if (focused === itemEl || focused === document.body) triggerRef.current?.focus()
  }

  const iconOnly = trigger?.iconOnly === true
  // TriggerStyle already guarantees the pair matches; TS cannot carry that
  // correlation through a union, hence the cast.
  const triggerClasses = trigger?.variant
    ? buttonClasses(trigger.variant, (trigger.theme ?? "light") as never)
    : buttonClasses("small", trigger?.theme ?? "greenStroke")

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-block", className)}
      onBlur={(e) => {
        // Focus moved somewhere outside (a click elsewhere, a screen reader
        // jump): close. A null relatedTarget is a click on nothing focusable,
        // which the pointerdown listener handles.
        const to = e.relatedTarget as Node | null
        if (open && to && !rootRef.current?.contains(to)) setOpen(false)
      }}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={trigger?.["aria-label"]}
        onClick={() => (open ? close(false) : openMenu("first"))}
        onKeyDown={onTriggerKeyDown}
        className={cn(triggerClasses, "gap-8", iconOnly && "px-8")}
      >
        {trigger?.icon}
        {iconOnly ? null : label}
      </button>

      <ul
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label={label}
        hidden={!open}
        onKeyDown={onMenuKeyDown}
        className={cn(
          "absolute top-full z-20 m-0 mt-4 min-w-[16rem] max-w-[calc(100vw-1.6rem)] list-none overflow-hidden rounded-8 border border-bg-warm-gray bg-neutral-white p-0 py-4 shadow-[0_0.8rem_2.4rem_rgb(16_36_42_/_0.16)]",
          align === "end" ? "right-0" : "left-0",
        )}
      >
        {items.map((item, i) => {
          if (item.type === "separator") {
            return <li key={`separator-${i}`} role="separator" className="my-4 border-t border-bg-warm-gray" />
          }
          const shared = {
            role: "menuitem",
            tabIndex: -1,
            "aria-disabled": item.disabled || undefined,
            onClick: activate(item),
            className: cn(
              itemStyles,
              // red-600 on white is 6.13:1, and 4.95:1 on the beige focus fill.
              item.tone === "danger" ? "text-red-600" : "text-teal-700",
            ),
          } as const
          const Anchor = item.as ?? "a"
          return (
            <li key={item.key} role="none">
              {item.href && !item.disabled ? (
                <Anchor href={item.href} {...shared}>
                  {item.label}
                </Anchor>
              ) : (
                <button type="button" {...shared}>
                  {item.label}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
