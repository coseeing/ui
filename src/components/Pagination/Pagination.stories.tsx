import { createContext, useContext, useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { Pagination } from "./Pagination.js"

/**
 * Pagination — design-system extension (not in Figma). `<nav aria-label>`
 * around a list of page buttons; the current page carries
 * `aria-current="page"`, and previous/next are really disabled at the ends.
 * A visible status line doubles as the live region: 第 X／Y 頁，共 N 筆.
 *
 * Two modes: `onPageChange` renders buttons; `href={(page) => url}` renders
 * links (with `as` for the app's router link) and works in a Server Component.
 */
const meta = {
  title: "Components/Pagination",
  component: Pagination,
  parameters: { layout: "padded" },
  args: {
    page: 1,
    pageCount: 10,
    total: 195,
    label: "分頁",
    siblingCount: 1,
    onPageChange: fn(),
  },
  argTypes: {
    page: { control: { type: "number", min: 1 } },
    pageCount: { control: { type: "number", min: 1 } },
    total: { control: { type: "number", min: 0 } },
    siblingCount: { control: { type: "number", min: 0, max: 3 } },
  },
  render: function Render(args) {
    const [page, setPage] = useState(args.page)
    return (
      <Pagination
        {...args}
        page={page}
        onPageChange={(p) => {
          setPage(p)
          args.onPageChange?.(p)
        }}
      />
    )
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

/** Button mode. Drive pageCount / total / siblingCount from Controls. */
export const Playground: Story = {}

const pageNames = (canvas: ReturnType<typeof within>) =>
  canvas
    .getAllByRole("button", { name: /^第 \d+ 頁$/ })
    .map((b: HTMLElement) => Number(b.getAttribute("data-page")))

/** Landmark name, aria-current, page-button names, and the first-page state. */
export const Semantics: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("navigation", { name: "分頁" })).toBeVisible()

    const current = canvas.getByRole("button", { name: "第 1 頁" })
    await expect(current).toHaveAttribute("aria-current", "page")
    await expect(canvas.getByRole("button", { name: "第 2 頁" })).not.toHaveAttribute(
      "aria-current",
    )

    // Really disabled, not just dimmed.
    await expect(canvas.getByRole("button", { name: "上一頁" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "下一頁" })).toBeEnabled()
    await expect(canvas.getByRole("status")).toHaveTextContent("第 1／10 頁，共 195 筆")
  },
}

/**
 * Paging updates the live status, and reaching the last page disables next —
 * with focus handed to the now-current page rather than dropped on <body>.
 */
export const PagingToTheEnd: Story = {
  args: { page: 9 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const next = canvas.getByRole("button", { name: "下一頁" })

    next.focus()
    await userEvent.keyboard("{Enter}")
    await expect(args.onPageChange).toHaveBeenCalledWith(10)
    await expect(canvas.getByRole("status")).toHaveTextContent("第 10／10 頁，共 195 筆")
    await expect(next).toBeDisabled()

    const last = canvas.getByRole("button", { name: "第 10 頁" })
    await expect(last).toHaveAttribute("aria-current", "page")
    await waitFor(() => expect(last).toHaveFocus())

    await userEvent.click(canvas.getByRole("button", { name: "上一頁" }))
    await expect(args.onPageChange).toHaveBeenLastCalledWith(9)
    await expect(next).toBeEnabled()
  },
}

/** Clicking the current page is a no-op, not a redundant change event. */
export const CurrentPageIsNoOp: Story = {
  args: { page: 3 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "第 3 頁" }))
    await expect(args.onPageChange).not.toHaveBeenCalled()
  },
}

/**
 * Ellipses keep the control a fixed width at any page count: first, last,
 * current ±1, and a gap marker either side when needed.
 */
export const Ellipsis: Story = {
  args: { pageCount: 50, total: 1000 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(pageNames(canvas)).toEqual([1, 2, 3, 4, 5, 50])

    await userEvent.click(canvas.getByRole("button", { name: "第 5 頁" }))
    await expect(pageNames(canvas)).toEqual([1, 4, 5, 6, 50])

    await userEvent.click(canvas.getByRole("button", { name: "第 50 頁" }))
    await expect(pageNames(canvas)).toEqual([1, 46, 47, 48, 49, 50])
  },
}

/** Few pages: every page, no ellipsis. One page: both steps disabled. */
export const FewPages: Story = {
  render: () => (
    <div className="grid gap-24">
      <Pagination page={2} pageCount={3} onPageChange={() => {}} label="三頁" />
      <Pagination page={1} pageCount={1} onPageChange={() => {}} label="一頁" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const three = within(canvas.getByRole("navigation", { name: "三頁" }))
    await expect(pageNames(three)).toEqual([1, 2, 3])

    const one = within(canvas.getByRole("navigation", { name: "一頁" }))
    await expect(one.getByRole("button", { name: "上一頁" })).toBeDisabled()
    await expect(one.getByRole("button", { name: "下一頁" })).toBeDisabled()
    await expect(one.getByRole("status")).toHaveTextContent("第 1／1 頁")
  },
}

function RouterLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a data-router-link="" {...props} />
}

/**
 * Link mode: `href` builds each URL and `as` swaps in the router link. At the
 * ends, previous/next stay links — aria-disabled, pointing at the current page
 * — rather than turning into a different element (see ClientRoutingKeepsFocus).
 */
export const LinkMode: Story = {
  render: () => (
    <Pagination page={1} pageCount={5} href={(p) => `/articles?page=${p}`} as={RouterLink} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const current = canvas.getByRole("link", { name: "第 1 頁" })
    await expect(current).toHaveAttribute("aria-current", "page")
    await expect(current).toHaveAttribute("data-router-link")
    await expect(canvas.getByRole("link", { name: "第 3 頁" })).toHaveAttribute(
      "href",
      "/articles?page=3",
    )
    await expect(canvas.getByRole("link", { name: "下一頁" })).toHaveAttribute(
      "href",
      "/articles?page=2",
    )
    const previous = canvas.getByRole("link", { name: "上一頁" })
    await expect(previous).toHaveAttribute("aria-disabled", "true")
    await expect(previous).toHaveAttribute("href", "/articles?page=1")
    await expect(getComputedStyle(previous).pointerEvents).toBe("none")
    await expect(canvas.queryByRole("button")).toBeNull()
  },
}

// A minimal client-side router link: navigates by state instead of reloading.
// Module-level, like a real router's Link — a component type re-created on
// every render would remount the links and hide the very bug under test.
const Navigate = createContext<(page: number) => void>(() => {})
function RoutedLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const navigate = useContext(Navigate)
  return (
    <a
      {...props}
      onClick={(e) => {
        props.onClick?.(e)
        if (e.defaultPrevented) return
        e.preventDefault()
        navigate(Number(new URL(props.href, location.href).searchParams.get("page")))
      }}
    />
  )
}

/**
 * Client-side routing re-renders the page in place. Reaching the last page
 * with 下一頁 must leave focus on 下一頁 — the same <a>, now aria-disabled —
 * not drop it to <body>, which is what a swap to a disabled <button> did.
 */
export const ClientRoutingKeepsFocus: Story = {
  render: function Render() {
    const [page, setPage] = useState(4)
    return (
      <Navigate.Provider value={setPage}>
        <Pagination page={page} pageCount={5} href={(p) => `?page=${p}`} as={RoutedLink} />
      </Navigate.Provider>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const next = canvas.getByRole("link", { name: "下一頁" })
    next.focus()
    await userEvent.keyboard("{Enter}")

    await expect(canvas.getByRole("status")).toHaveTextContent("第 5／5 頁")
    await expect(canvas.getByRole("link", { name: "下一頁" })).toBe(next) // same node
    await expect(next).toHaveAttribute("aria-disabled", "true")
    await expect(next).toHaveFocus()
  },
}
