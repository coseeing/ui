"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import { ChevronDownIcon, PlusIcon } from "../Icons/Icons.js"

// ReorderableList — design-system extension (not in Figma). An ordered list
// where every row has 上移 / 下移 / 移除 icon buttons — the keyboard and
// screen-reader way to reorder, and the only way here (no drag). Rows use
// DescriptionList's hairline rules; buttons are Dialog's square icon button.
//
// Focus follows the item: the moved item's same button is re-focused after
// the new order renders. Re-inserting a focused node drops focus to <body>;
// with React 19 in Chromium the reconciler happened to move the neighbouring
// row instead, so the stories pass with or without this step — it is a
// safety net for other engines and React versions, not something the tests
// can tell apart. At the ends, 上移/下移 are aria-disabled, not
// disabled: a disabled button cannot hold focus, and the item just moved to
// the top would lose it. Pressing one there only says 已抵達第一項.

export type ReorderableListLabels = {
  up: string
  down: string
  remove: string
  /** Announced after a move that did not reach an end. */
  movedUp: (position: number, total: number) => string
  movedDown: (position: number, total: number) => string
  /** Announced after a move that reached an end. */
  movedUpToFirst: string
  movedDownToLast: string
  /** Announced on pressing 上移/下移 when already at that end. */
  reachedFirst: string
  reachedLast: string
  removed: (label: string) => string
  empty: string
}

const DEFAULT_LABELS: ReorderableListLabels = {
  up: "上移",
  down: "下移",
  remove: "移除",
  movedUp: (position, total) => `已上移，第 ${position}／${total} 項`,
  movedDown: (position, total) => `已下移，第 ${position}／${total} 項`,
  movedUpToFirst: "已上移，已抵達第一項",
  movedDownToLast: "已下移，已抵達最後一項",
  reachedFirst: "已抵達第一項",
  reachedLast: "已抵達最後一項",
  removed: (label) => `已移除 ${label}`,
  empty: "目前沒有項目",
}

type Action = "up" | "down" | "remove"

type ReorderableListProps<T> = {
  items: T[]
  getKey: (item: T) => string
  /** Plain text for button names and announcements. */
  getLabel: (item: T) => string
  /** Receives the reordered (or shortened) array. */
  onChange: (items: T[]) => void
  /** Row content; defaults to `getLabel(item)`. */
  renderItem?: (item: T, index: number) => React.ReactNode
  /** Hide the remove buttons. */
  removable?: boolean
  /** Accessible name of the list. */
  label?: string
  labels?: Partial<ReorderableListLabels>
  className?: string
}

const iconButtonStyles =
  "flex size-32 shrink-0 cursor-pointer items-center justify-center rounded-8 border-0 bg-transparent p-0 text-teal-700 transition-colors hover:bg-bg-light-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-PRIMARY aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"

export function ReorderableList<T>({
  items,
  getKey,
  getLabel,
  onChange,
  renderItem,
  removable = true,
  label,
  labels,
  className,
}: ReorderableListProps<T>) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const emptyRef = useRef<HTMLParagraphElement>(null)

  const [notice, setNotice] = useState<{ text: string; n: number } | null>(null)
  const say = (text: string) => setNotice((prev) => ({ text, n: (prev?.n ?? 0) + 1 }))

  // The row just moved, for a brief highlight (skipped under reduced motion,
  // where it simply appears without the fade).
  const [moved, setMoved] = useState<string>()
  useEffect(() => {
    if (!moved) return
    const timer = setTimeout(() => setMoved(undefined), 800)
    return () => clearTimeout(timer)
  }, [moved])

  // Where focus goes once the new `items` has rendered. null = the empty
  // state.
  const pendingFocus = useRef<{ key: string; action: Action } | null | undefined>(undefined)
  useEffect(() => {
    const target = pendingFocus.current
    if (target === undefined) return
    pendingFocus.current = undefined
    if (target === null) emptyRef.current?.focus()
    else buttons.current.get(`${target.key}:${target.action}`)?.focus()
  }, [items])

  const move = (index: number, delta: -1 | 1) => {
    const to = index + delta
    if (to < 0) return say(l.reachedFirst)
    if (to >= items.length) return say(l.reachedLast)
    const next = items.slice()
    const [item] = next.splice(index, 1)
    next.splice(to, 0, item!)
    const key = getKey(item!)
    pendingFocus.current = { key, action: delta < 0 ? "up" : "down" }
    setMoved(key)
    onChange(next)
    say(
      to === 0
        ? l.movedUpToFirst
        : to === items.length - 1
          ? l.movedDownToLast
          : delta < 0
            ? l.movedUp(to + 1, items.length)
            : l.movedDown(to + 1, items.length),
    )
  }

  const remove = (index: number) => {
    const item = items[index]!
    // The next row's remove button, else the previous row's, else the empty
    // state — never <body>.
    const neighbour = items[index + 1] ?? items[index - 1]
    pendingFocus.current = neighbour ? { key: getKey(neighbour), action: "remove" } : null
    onChange(items.filter((_, i) => i !== index))
    say(l.removed(getLabel(item)))
  }

  const register = (key: string, action: Action) => (el: HTMLButtonElement | null) => {
    if (el) buttons.current.set(`${key}:${action}`, el)
    else buttons.current.delete(`${key}:${action}`)
  }

  return (
    <div className={className}>
      {items.length === 0 ? (
        <p
          ref={emptyRef}
          tabIndex={-1}
          className="typography-body2 m-0 rounded-8 py-12 text-neutral-dark-gray focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-PRIMARY"
        >
          {l.empty}
        </p>
      ) : (
        <ol aria-label={label} className="m-0 list-none border-t border-bg-warm-gray p-0">
          {items.map((item, index) => {
            const key = getKey(item)
            const name = getLabel(item)
            const first = index === 0
            const last = index === items.length - 1
            return (
              <li
                key={key}
                className={cn(
                  "flex items-center gap-12 border-b border-bg-warm-gray py-8 pl-12 transition-colors duration-700 motion-reduce:transition-none",
                  moved === key ? "bg-orange-100" : "bg-transparent",
                )}
              >
                <div className="typography-body1 min-w-0 flex-1 text-teal-700">
                  {renderItem ? renderItem(item, index) : name}
                </div>
                <div className="flex shrink-0 gap-4">
                  <button
                    ref={register(key, "up")}
                    type="button"
                    aria-label={`${l.up}：${name}`}
                    aria-disabled={first || undefined}
                    onClick={() => move(index, -1)}
                    className={iconButtonStyles}
                  >
                    <ChevronDownIcon className="w-[1.4rem] rotate-180" />
                  </button>
                  <button
                    ref={register(key, "down")}
                    type="button"
                    aria-label={`${l.down}：${name}`}
                    aria-disabled={last || undefined}
                    onClick={() => move(index, 1)}
                    className={iconButtonStyles}
                  >
                    <ChevronDownIcon className="w-[1.4rem]" />
                  </button>
                  {removable ? (
                    <button
                      ref={register(key, "remove")}
                      type="button"
                      aria-label={`${l.remove}：${name}`}
                      onClick={() => remove(index)}
                      className={iconButtonStyles}
                    >
                      <PlusIcon className="size-20 rotate-45" />
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <div role="status" className="sr-only">
        {notice ? <span key={notice.n}>{notice.text}</span> : null}
      </div>
    </div>
  )
}
