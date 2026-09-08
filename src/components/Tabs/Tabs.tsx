"use client"

import { useId, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"

// Tabs — design-system extension (not in Figma). Underline style in the brand
// language (orange active indicator on a warm-gray baseline), distinct from
// the pill-style FilterPills. Full APG tabs semantics: roving tabindex,
// Left/Right/Home/End keyboard support, aria-controls/labelledby wiring.

export type TabItem = { label: string; content: React.ReactNode }

type TabsProps = {
  items: TabItem[]
  defaultIndex?: number
  /** Accessible name for the tab list. */
  label?: string
  onChange?: (index: number) => void
  className?: string
}

export function Tabs({ items, defaultIndex = 0, label, onChange, className }: TabsProps) {
  const [active, setActive] = useState(defaultIndex)
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const select = (i: number) => {
    setActive(i)
    onChange?.(i)
    tabRefs.current[i]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = items.length - 1
    let next: number | null = null
    if (e.key === "ArrowRight") next = active === last ? 0 : active + 1
    else if (e.key === "ArrowLeft") next = active === 0 ? last : active - 1
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = last
    if (next !== null) {
      e.preventDefault()
      select(next)
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-8 border-b border-bg-warm-gray"
      >
        {items.map((item, i) => {
          const selected = i === active
          return (
            <button
              key={i}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              className={cn(
                "-mb-px cursor-pointer appearance-none border-x-0 border-b-[0.3rem] border-t-0 border-solid bg-transparent px-16 py-8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-PRIMARY",
                selected
                  ? "typography-strong1 border-orange-PRIMARY text-teal-PRIMARY"
                  : "typography-emphasised1 border-transparent text-neutral-dark-gray hover:text-teal-PRIMARY",
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${baseId}-panel-${i}`}
          aria-labelledby={`${baseId}-tab-${i}`}
          hidden={i !== active}
          tabIndex={0}
          className="rounded-8 pt-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-PRIMARY"
        >
          {item.content}
        </div>
      ))}
    </div>
  )
}
