"use client"

import { useEffect, useRef, useState } from "react"
import { LiveRegion, useAnnouncer } from "../LiveRegion/LiveRegion.js"
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
//
// Two layouts, same behaviour:
//
// - "list" (default): an <ol>; every button is its own Tab stop — three per
//   row. Simple, and every screen reader user already knows how to read a
//   list. Best for short lists.
// - "grid": APG layout grid. The whole list is ONE Tab stop; arrows move
//   between cells (←/→ within a row, ↑/↓ between rows in the same column,
//   Home/End to the row's ends, Ctrl+Home/End to the first/last row). For
//   long lists, where 3 × rows Tab stops is a chore. The cost: it is read as
//   a grid, not a list, and the user has to know grid navigation (screen
//   readers switch to focus mode inside it). The focused cell is tracked by
//   item key and column, so after 上移 the focus is still on that item's 上移
//   — now one row up.

/**
 * Same scheme as ComboboxLabels. The three buttons are icon-only, so their
 * labels are their whole accessible names, built from the item's name.
 */
export type ReorderableListLabels = {
  up: (name: string) => string
  down: (name: string) => string
  remove: (name: string) => string
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
  up: (name) => `上移：${name}`,
  down: (name) => `下移：${name}`,
  remove: (name) => `移除：${name}`,
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
/** A grid column: the item's name, or one of its buttons. */
type Cell = "label" | Action

type ReorderableListBase<T> = {
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
  labels?: Partial<ReorderableListLabels>
  className?: string
}

/**
 * `label` names the list or grid. It is required for the grid: ARIA requires
 * a grid to have an accessible name, and inside one, a screen reader user has
 * left normal reading — the name is what tells them where they are.
 */
type ReorderableListProps<T> = ReorderableListBase<T> &
  ({ layout?: "list"; label?: string } | { layout: "grid"; label: string })

const iconButtonStyles =
  "flex size-32 shrink-0 cursor-pointer items-center justify-center rounded-8 border-0 bg-transparent p-0 text-teal-700 transition-colors hover:bg-bg-light-beige aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-teal-PRIMARY"

export function ReorderableList<T>({
  items,
  getKey,
  getLabel,
  onChange,
  renderItem,
  removable = true,
  label,
  layout = "list",
  labels,
  className,
}: ReorderableListProps<T>) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const grid = layout === "grid"
  const buttons = useRef(new Map<string, HTMLElement>())
  const emptyRef = useRef<HTMLParagraphElement>(null)

  const { message, say } = useAnnouncer()

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

  const register = (key: string, cell: Cell) => (el: HTMLElement | null) => {
    if (el) buttons.current.set(`${key}:${cell}`, el)
    else buttons.current.delete(`${key}:${cell}`)
  }

  // ── Grid: roving tabindex over (item, column) ───────────────────────────
  const columns: Cell[] = ["label", "up", "down", ...(removable ? (["remove"] as const) : [])]
  const [cursor, setCursor] = useState<{ key: string; cell: Cell } | null>(null)
  // Fall back to the first cell when nothing is focused yet or the item went.
  const current =
    cursor && items.some((i) => getKey(i) === cursor.key) && columns.includes(cursor.cell)
      ? cursor
      : items[0]
        ? { key: getKey(items[0]), cell: "label" as Cell }
        : null
  const isStop = (key: string, cell: Cell) =>
    !!current && current.key === key && current.cell === cell

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    if (!current) return
    const last = { row: items.length - 1, col: columns.length - 1 }
    let row = items.findIndex((i) => getKey(i) === current.key)
    let col = columns.indexOf(current.cell)
    switch (e.key) {
      case "ArrowRight":
        col = Math.min(col + 1, last.col)
        break
      case "ArrowLeft":
        col = Math.max(col - 1, 0)
        break
      case "ArrowDown":
        row = Math.min(row + 1, last.row)
        break
      case "ArrowUp":
        row = Math.max(row - 1, 0)
        break
      case "Home":
        if (e.ctrlKey) row = 0
        col = 0
        break
      case "End":
        if (e.ctrlKey) row = last.row
        col = last.col
        break
      default:
        return
    }
    e.preventDefault()
    buttons.current.get(`${getKey(items[row]!)}:${columns[col]}`)?.focus()
  }

  /** Grid-only props for a focusable cell element. */
  const cellProps = (key: string, cell: Cell) =>
    grid
      ? { tabIndex: isStop(key, cell) ? 0 : -1, onFocus: () => setCursor({ key, cell }) }
      : {}

  const rowButtons = (item: T, index: number) => {
    const key = getKey(item)
    const name = getLabel(item)
    const wrap = (node: React.ReactNode) =>
      grid ? <div role="gridcell">{node}</div> : node
    return (
      <>
        {wrap(
          <button
            ref={register(key, "up")}
            type="button"
            aria-label={l.up(name)}
            aria-disabled={index === 0 || undefined}
            onClick={() => move(index, -1)}
            className={iconButtonStyles}
            {...cellProps(key, "up")}
          >
            <ChevronDownIcon className="w-[1.4rem] rotate-180" />
          </button>,
        )}
        {wrap(
          <button
            ref={register(key, "down")}
            type="button"
            aria-label={l.down(name)}
            aria-disabled={index === items.length - 1 || undefined}
            onClick={() => move(index, 1)}
            className={iconButtonStyles}
            {...cellProps(key, "down")}
          >
            <ChevronDownIcon className="w-[1.4rem]" />
          </button>,
        )}
        {removable
          ? wrap(
              <button
                ref={register(key, "remove")}
                type="button"
                aria-label={l.remove(name)}
                onClick={() => remove(index)}
                className={iconButtonStyles}
                {...cellProps(key, "remove")}
              >
                <PlusIcon className="size-20 rotate-45" />
              </button>,
            )
          : null}
      </>
    )
  }

  const rowStyles = (key: string) =>
    cn(
      "flex items-center gap-12 border-b border-bg-warm-gray py-8 pl-12 transition-colors duration-700 motion-reduce:transition-none",
      moved === key ? "bg-orange-100" : "bg-transparent",
    )
  const labelStyles = "typography-body1 min-w-0 flex-1 text-teal-700"

  return (
    <div className={className}>
      {items.length === 0 ? (
        <p
          ref={emptyRef}
          tabIndex={-1}
          className="typography-body2 m-0 rounded-8 py-12 text-neutral-dark-gray focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-teal-PRIMARY"
        >
          {l.empty}
        </p>
      ) : (
        grid ? (
          <div
            role="grid"
            aria-label={label}
            onKeyDown={onGridKeyDown}
            className="border-t border-bg-warm-gray"
          >
            {items.map((item, index) => {
              const key = getKey(item)
              return (
                <div key={key} role="row" className={rowStyles(key)}>
                  <div
                    ref={register(key, "label")}
                    role="gridcell"
                    className={cn(
                      labelStyles,
                      "rounded-8 focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-teal-PRIMARY",
                    )}
                    {...cellProps(key, "label")}
                  >
                    {renderItem ? renderItem(item, index) : getLabel(item)}
                  </div>
                  <div role="none" className="flex shrink-0 gap-4">
                    {rowButtons(item, index)}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <ol aria-label={label} className="m-0 list-none border-t border-bg-warm-gray p-0">
            {items.map((item, index) => {
              const key = getKey(item)
              return (
                <li key={key} className={rowStyles(key)}>
                  <div className={labelStyles}>
                    {renderItem ? renderItem(item, index) : getLabel(item)}
                  </div>
                  <div className="flex shrink-0 gap-4">{rowButtons(item, index)}</div>
                </li>
              )
            })}
          </ol>
        )
      )}
      <LiveRegion message={message} />
    </div>
  )
}
