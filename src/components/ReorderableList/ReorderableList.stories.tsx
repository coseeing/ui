import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { ReorderableList } from "./ReorderableList.js"

/**
 * ReorderableList — design-system extension (not in Figma). An ordered list
 * with 上移 / 下移 / 移除 icon buttons on every row, named with the item
 * (「上移：WCAG 2.2 新增了哪些準則」). Focus stays on the moved item's button;
 * a live region says what happened (已上移, 已抵達第一項, 已移除 …). Removing
 * moves focus to the next row's 移除, or the previous one's.
 */

type Question = { id: string; title: string }

const QUESTIONS: Question[] = [
  { id: "q1", title: "WCAG 2.2 新增了哪些準則" },
  { id: "q2", title: "螢幕閱讀器如何朗讀表格" },
  { id: "q3", title: "對比不足時該怎麼調整色彩" },
  { id: "q4", title: "影片字幕要包含哪些資訊" },
]

function Demo({
  onChange,
  initial = QUESTIONS,
  layout,
}: {
  onChange?: (q: Question[]) => void
  initial?: Question[]
  layout?: "list" | "grid"
}) {
  const [items, setItems] = useState(initial)
  return (
    <div className="max-w-[56rem]">
      <ReorderableList
        label="常見問題排序"
        layout={layout}
        items={items}
        getKey={(q) => q.id}
        getLabel={(q) => q.title}
        onChange={(next) => {
          setItems(next)
          onChange?.(next)
        }}
      />
    </div>
  )
}

const meta = {
  title: "Components/ReorderableList",
  component: ReorderableList,
  parameters: { layout: "padded" },
  args: {
    items: QUESTIONS,
    getKey: (q: unknown) => (q as Question).id,
    getLabel: (q: unknown) => (q as Question).title,
    onChange: fn(),
  },
  argTypes: {
    items: { table: { disable: true } },
  },
  render: (args) => <Demo onChange={args.onChange as never} />,
} satisfies Meta<typeof ReorderableList>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

const ids = (items: Question[]) => items.map((q) => q.id)

/** An ordered list; every button is named with its item. */
export const Semantics: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const list = canvas.getByRole("list", { name: "常見問題排序" })
    await expect(list.tagName).toBe("OL")
    await expect(within(list).getAllByRole("listitem")).toHaveLength(4)

    await expect(canvas.getByRole("button", { name: "上移：WCAG 2.2 新增了哪些準則" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "下移：WCAG 2.2 新增了哪些準則" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "移除：WCAG 2.2 新增了哪些準則" })).toBeVisible()
    // Ends are aria-disabled — focusable, so focus is never dropped there.
    await expect(canvas.getByRole("button", { name: "上移：WCAG 2.2 新增了哪些準則" })).toHaveAttribute("aria-disabled", "true")
    await expect(canvas.getByRole("button", { name: "下移：影片字幕要包含哪些資訊" })).toHaveAttribute("aria-disabled", "true")
    await expect(canvas.getByRole("button", { name: "下移：WCAG 2.2 新增了哪些準則" })).not.toHaveAttribute("aria-disabled")
  },
}

/**
 * Focus stays on the moved item's same button through each move. Reaching
 * the top says so, and pressing 上移 there changes nothing but says it again.
 */
export const MoveKeepsFocus: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const status = canvas.getByRole("status")
    const up = canvas.getByRole("button", { name: "上移：對比不足時該怎麼調整色彩" })

    up.focus()
    await userEvent.keyboard("{Enter}")
    await expect(ids((args.onChange as ReturnType<typeof fn>).mock.lastCall![0])).toEqual(["q1", "q3", "q2", "q4"])
    await waitFor(() => expect(up).toHaveFocus())
    await expect(status).toHaveTextContent("已上移，第 2／4 項")

    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(up).toHaveFocus())
    await expect(status).toHaveTextContent("已上移，已抵達第一項")
    await expect(up).toHaveAttribute("aria-disabled", "true")

    await userEvent.keyboard("{Enter}")
    await expect(args.onChange).toHaveBeenCalledTimes(2) // no move past the top
    await expect(up).toHaveFocus()
    await expect(status).toHaveTextContent("已抵達第一項")
  },
}

/** Moving down to the bottom says 已抵達最後一項. */
export const MoveToBottom: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const down = canvas.getByRole("button", { name: "下移：螢幕閱讀器如何朗讀表格" })
    down.focus()
    await userEvent.keyboard("{Enter}{Enter}")
    await waitFor(() => expect(down).toHaveFocus())
    await expect(canvas.getByRole("status")).toHaveTextContent("已下移，已抵達最後一項")
    const rows = within(canvas.getByRole("list")).getAllByRole("listitem")
    await expect(within(rows[3]!).getByRole("button", { name: "下移：螢幕閱讀器如何朗讀表格" })).toBe(down)
  },
}

/**
 * Removing moves focus to the next row's 移除, else the previous row's, and
 * finally to the empty state — never to <body>.
 */
export const RemoveMovesFocus: Story = {
  render: (args) => <Demo onChange={args.onChange as never} initial={QUESTIONS.slice(0, 3)} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const status = canvas.getByRole("status")

    await userEvent.click(canvas.getByRole("button", { name: "移除：螢幕閱讀器如何朗讀表格" }))
    await expect(status).toHaveTextContent("已移除 螢幕閱讀器如何朗讀表格")
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "移除：對比不足時該怎麼調整色彩" })).toHaveFocus(),
    )

    // Last row: no next, so the previous row.
    await userEvent.keyboard("{Enter}")
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "移除：WCAG 2.2 新增了哪些準則" })).toHaveFocus(),
    )

    await userEvent.keyboard("{Enter}")
    await expect(canvas.queryByRole("list")).toBeNull()
    await waitFor(() => expect(document.activeElement).not.toBe(document.body))
    await expect(document.activeElement?.tagName).toBe("P")
  },
}

// ── layout="grid" ──────────────────────────────────────────────────────────

/** Grid layout: one Tab stop for the whole list; arrows move between cells. */
export const GridPlayground: Story = {
  render: (args) => <Demo onChange={args.onChange as never} layout="grid" />,
}

const tabStops = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('[tabindex="0"]'))

/**
 * APG layout grid: a named grid of rows, and exactly one cell in the Tab
 * order — the first item's name to start with.
 */
export const GridSemantics: Story = {
  render: (args) => <Demo onChange={args.onChange as never} layout="grid" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const grid = canvas.getByRole("grid", { name: "常見問題排序" })
    const rows = within(grid).getAllByRole("row")
    await expect(rows).toHaveLength(4)
    await expect(within(rows[0]!).getAllByRole("gridcell")).toHaveLength(4)

    const stops = tabStops(grid)
    await expect(stops).toHaveLength(1)
    await expect(stops[0]).toHaveTextContent("WCAG 2.2 新增了哪些準則")
    for (const b of within(grid).getAllByRole("button")) {
      await expect(b).toHaveAttribute("tabindex", "-1")
    }
  },
}

/**
 * ←/→ within a row, ↑/↓ between rows in the same column, Home/End to the
 * row's ends, Ctrl+Home/End to the first/last row. The single Tab stop
 * follows focus.
 */
export const GridArrowKeys: Story = {
  render: (args) => <Demo onChange={args.onChange as never} layout="grid" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const grid = canvas.getByRole("grid")
    const button = (name: string) => canvas.getByRole("button", { name })

    tabStops(grid)[0]!.focus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(button("上移：WCAG 2.2 新增了哪些準則")).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(button("上移：螢幕閱讀器如何朗讀表格")).toHaveFocus()
    await userEvent.keyboard("{End}")
    await expect(button("移除：螢幕閱讀器如何朗讀表格")).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}") // no wrap past the row's end
    await expect(button("移除：螢幕閱讀器如何朗讀表格")).toHaveFocus()
    await userEvent.keyboard("{Control>}{End}{/Control}")
    await expect(button("移除：影片字幕要包含哪些資訊")).toHaveFocus()
    await userEvent.keyboard("{Control>}{Home}{/Control}")
    await expect(tabStops(grid)[0]).toHaveTextContent("WCAG 2.2 新增了哪些準則")
    await expect(tabStops(grid)[0]).toHaveFocus()

    // Still exactly one Tab stop, and it is where focus is.
    await expect(tabStops(grid)).toHaveLength(1)
  },
}

/**
 * Moving keeps focus — and the single Tab stop — on the moved item's same
 * button, now one row up. Announcements are as in the list layout.
 */
export const GridMoveKeepsFocus: Story = {
  render: (args) => <Demo onChange={args.onChange as never} layout="grid" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const grid = canvas.getByRole("grid")
    const up = canvas.getByRole("button", { name: "上移：對比不足時該怎麼調整色彩" })

    up.focus()
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(up).toHaveFocus())
    await expect(canvas.getByRole("status")).toHaveTextContent("已上移，第 2／4 項")
    const rows = within(grid).getAllByRole("row")
    await expect(within(rows[1]!).getByRole("button", { name: "上移：對比不足時該怎麼調整色彩" })).toBe(up)
    await expect(tabStops(grid)).toEqual([up])

    // ↑ now goes to the row above, same column.
    await userEvent.keyboard("{ArrowUp}")
    await expect(canvas.getByRole("button", { name: "上移：WCAG 2.2 新增了哪些準則" })).toHaveFocus()
  },
}

/** Removing hands focus to the next row's 移除, as in the list layout. */
export const GridRemoveMovesFocus: Story = {
  render: (args) => <Demo onChange={args.onChange as never} layout="grid" initial={QUESTIONS.slice(0, 2)} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByRole("button", { name: "移除：WCAG 2.2 新增了哪些準則" }).focus()
    await userEvent.keyboard("{Enter}")
    const next = canvas.getByRole("button", { name: "移除：螢幕閱讀器如何朗讀表格" })
    await waitFor(() => expect(next).toHaveFocus())
    await expect(tabStops(canvas.getByRole("grid"))).toEqual([next])
  },
}

// Type-level checks, enforced by `npm run typecheck` (never rendered): a grid
// must be named, a list need not be.
const typeChecks = () => [
  // @ts-expect-error — layout="grid" requires `label`
  <ReorderableList layout="grid" items={QUESTIONS} getKey={(q) => q.id} getLabel={(q) => q.title} onChange={() => {}} />,
  <ReorderableList items={QUESTIONS} getKey={(q) => q.id} getLabel={(q) => q.title} onChange={() => {}} />,
]
void typeChecks
