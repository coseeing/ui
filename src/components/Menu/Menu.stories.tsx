import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test"
import { Menu, type MenuItem } from "./Menu.js"
import { MenuIcon } from "../Icons/Icons.js"

/**
 * Menu — design-system extension (not in Figma). A menu button for actions or
 * navigation (更多操作, 帳號選單) — not a form control; use Select or Combobox
 * to pick a value.
 *
 * APG Menu Button: Enter/Space/↓ open on the first item, ↑ on the last; ↑/↓
 * wrap, Home/End, type to jump; Enter/Space activate; Esc closes back to the
 * trigger; Tab closes and moves on. Disabled items are `aria-disabled` —
 * focusable, inert. The popup flips to stay inside the viewport.
 */

const onEdit = fn()
const onDuplicate = fn()
const onArchive = fn()
const onDelete = fn()

const ITEMS: MenuItem[] = [
  { key: "edit", label: "編輯活動", onSelect: onEdit },
  { key: "duplicate", label: "複製活動", onSelect: onDuplicate },
  { key: "archive", label: "封存（已停用）", onSelect: onArchive, disabled: true },
  { key: "report", label: "下載報名名單", href: "/events/42/report.csv" },
  { type: "separator" },
  { key: "delete", label: "刪除活動", onSelect: onDelete, tone: "danger" },
]

const meta = {
  title: "Components/Menu",
  component: Menu,
  parameters: { layout: "padded" },
  args: {
    label: "更多操作",
    items: ITEMS,
    placement: "bottom-start",
    trigger: { variant: "small", theme: "greenStroke" },
  },
  argTypes: {
    placement: { control: "inline-radio", options: ["bottom-start", "bottom-end"] },
    items: { table: { disable: true } },
  },
  // Room below for the popup, so axe checks it inside the canvas.
  decorators: [
    (Story) => (
      <div className="min-h-[32rem]">
        <Story />
      </div>
    ),
  ],
  beforeEach: () => {
    for (const f of [onEdit, onDuplicate, onArchive, onDelete]) f.mockClear()
  },
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

const openWith = async (canvas: ReturnType<typeof within>, key: string) => {
  const trigger = canvas.getByRole("button", { name: "更多操作" })
  trigger.focus()
  await userEvent.keyboard(key)
  return trigger
}

/** Trigger and menu wiring; separator and item roles. Ends open, for axe. */
export const Semantics: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("button", { name: "更多操作" })
    await expect(trigger).toHaveAttribute("aria-haspopup", "menu")
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await expect(canvas.queryByRole("menu")).toBeNull()

    await userEvent.click(trigger)
    const menu = canvas.getByRole("menu", { name: "更多操作" })
    await expect(trigger).toHaveAttribute("aria-expanded", "true")
    await expect(trigger).toHaveAttribute("aria-controls", menu.id)
    await expect(within(menu).getAllByRole("menuitem")).toHaveLength(5)
    await expect(within(menu).getByRole("separator")).toBeInTheDocument()

    const link = within(menu).getByRole("menuitem", { name: "下載報名名單" })
    await expect(link.tagName).toBe("A")
    await expect(link).toHaveAttribute("href", "/events/42/report.csv")
    // Every item is out of the tab order; focus is moved, not tabbed.
    for (const item of within(menu).getAllByRole("menuitem")) {
      await expect(item).toHaveAttribute("tabindex", "-1")
    }
    // A click opens on the first item too.
    await expect(within(menu).getByRole("menuitem", { name: "編輯活動" })).toHaveFocus()
  },
}

/** Enter / Space / ↓ open on the first item; ↑ on the last. */
export const OpeningKeys: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const key of ["{Enter}", " ", "{ArrowDown}"]) {
      await openWith(canvas, key)
      await expect(canvas.getByRole("menuitem", { name: "編輯活動" })).toHaveFocus()
      await userEvent.keyboard("{Escape}")
    }
    await openWith(canvas, "{ArrowUp}")
    await expect(canvas.getByRole("menuitem", { name: "刪除活動" })).toHaveFocus()
  },
}

/** ↑/↓ wrap, Home/End, and type-to-jump — disabled items included. */
export const Navigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await openWith(canvas, "{ArrowDown}")
    const item = (name: string) => canvas.getByRole("menuitem", { name })

    await userEvent.keyboard("{ArrowUp}")
    await expect(item("刪除活動")).toHaveFocus() // wraps
    await userEvent.keyboard("{ArrowDown}")
    await expect(item("編輯活動")).toHaveFocus() // wraps back
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    await expect(item("封存（已停用）")).toHaveFocus() // disabled, still reachable
    await userEvent.keyboard("{End}")
    await expect(item("刪除活動")).toHaveFocus()
    await userEvent.keyboard("{Home}")
    await expect(item("編輯活動")).toHaveFocus()

    await userEvent.keyboard("下")
    await expect(item("下載報名名單")).toHaveFocus()
    // Keys typed within 500ms build one prefix ("下刪" matches nothing), so
    // pause before starting a new one.
    await new Promise((r) => setTimeout(r, 600))
    await userEvent.keyboard("刪")
    await expect(item("刪除活動")).toHaveFocus()
  },
}

/** Enter activates, closes, and returns focus to the trigger. */
export const Activation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = await openWith(canvas, "{ArrowDown}")
    await userEvent.keyboard("{ArrowDown}{Enter}")

    await expect(onDuplicate).toHaveBeenCalledOnce()
    await expect(canvas.queryByRole("menu")).toBeNull()
    await expect(trigger).toHaveFocus()
    await expect(trigger).toHaveAttribute("aria-expanded", "false")

    // Space activates too.
    await openWith(canvas, "{ArrowUp}")
    await userEvent.keyboard(" ")
    await expect(onDelete).toHaveBeenCalledOnce()
  },
}

/** A disabled item is announced as such, takes focus, and does nothing. */
export const DisabledItem: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await openWith(canvas, "{ArrowDown}")
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    const archive = canvas.getByRole("menuitem", { name: "封存（已停用）" })
    await expect(archive).toHaveAttribute("aria-disabled", "true")
    await expect(archive).toHaveFocus()

    await userEvent.keyboard("{Enter}")
    await userEvent.click(archive)
    await expect(onArchive).not.toHaveBeenCalled()
    await expect(canvas.getByRole("menu")).toBeVisible()
  },
}

/** Esc closes back to the trigger; Tab and an outside click close too. */
export const Closing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = await openWith(canvas, "{ArrowDown}")
    await userEvent.keyboard("{Escape}")
    await expect(canvas.queryByRole("menu")).toBeNull()
    await expect(trigger).toHaveFocus()

    // Tab: dispatched rather than userEvent.tab(), which would move real
    // focus and interfere with other stories. Closing is what is under test.
    await openWith(canvas, "{ArrowDown}")
    fireEvent.keyDown(canvas.getByRole("menuitem", { name: "編輯活動" }), { key: "Tab" })
    await waitFor(() => expect(canvas.queryByRole("menu")).toBeNull())

    await userEvent.click(trigger)
    await expect(canvas.getByRole("menu")).toBeVisible()
    await userEvent.click(canvasElement)
    await expect(canvas.queryByRole("menu")).toBeNull()
  },
}

/**
 * Near the right edge, `bottom-start` would overflow, so it flips to align
 * with the trigger's right edge. Ends open, for axe.
 */
export const FlipsAtViewportEdge: Story = {
  decorators: [
    (Story) => (
      <div className="flex min-h-[32rem] justify-end">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await openWith(canvas, "{ArrowDown}")
    const rect = canvas.getByRole("menu").getBoundingClientRect()
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth)
    await expect(rect.left).toBeGreaterThanOrEqual(0)
  },
}

/** An icon-only trigger is named by its required `aria-label`. */
export const IconOnlyTrigger: Story = {
  args: {
    label: "帳號選單",
    trigger: {
      variant: "small",
      theme: "greenStroke",
      icon: <MenuIcon className="w-[2rem]" />,
      iconOnly: true,
      "aria-label": "帳號選單",
    },
    placement: "bottom-end",
    items: [
      { key: "profile", label: "個人資料", href: "/me" },
      { key: "settings", label: "帳號設定", href: "/settings" },
      { type: "separator" },
      { key: "logout", label: "登出", onSelect: () => {}, tone: "danger" },
    ],
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-[24rem] justify-end">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("button", { name: "帳號選單" })
    await userEvent.click(trigger)
    await expect(canvas.getByRole("menu", { name: "帳號選單" })).toBeVisible()
  },
}
