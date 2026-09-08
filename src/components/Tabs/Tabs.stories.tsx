import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Tabs } from "./Tabs.js"

/**
 * Tabs — design-system extension (not in Figma). Underline style (orange
 * active indicator on the warm-gray baseline), distinct from the pill-style
 * FilterPills. Full APG tab semantics: roving tabindex, ←/→/Home/End keyboard
 * support, aria-controls/labelledby wiring.
 */

function Panel({ children }: { children: React.ReactNode }) {
  return <p className="typography-body1 m-0 max-w-[56rem] text-teal-700">{children}</p>
}

const THREE_ITEMS = [
  {
    label: "活動介紹",
    content: (
      <Panel>
        在東南亞廚房派對系列活動中,我們邀請台灣人和移工一起在廚房裡,透過美食和料理交流,開啟雙方的對話。
      </Panel>
    ),
  },
  {
    label: "報名方式",
    content: <Panel>填寫報名表單後,我們會在三個工作天內寄出行前通知與集合資訊。</Panel>,
  },
  {
    label: "常見問題",
    content: <Panel>活動全程免費,場地備有無障礙動線與座位,歡迎攜伴參加。</Panel>,
  },
]

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
  args: {
    items: THREE_ITEMS,
    label: "活動資訊",
    defaultIndex: 0,
  },
  argTypes: {
    onChange: { action: "change" },
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

/** Three tabs — try ←/→/Home/End with focus on the tab list. */
export const ThreeTabs: Story = {}

/** Two tabs. */
export const TwoTabs: Story = {
  args: { items: THREE_ITEMS.slice(0, 2) },
}

/**
 * APG roving tabindex: exactly one tab is in the tab sequence, and it is the
 * selected one. That is what makes Tab move *past* the tab list rather than
 * through every tab in it.
 */
export const RovingTabindex: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tabs = canvas.getAllByRole("tab")

    await expect(tabs).toHaveLength(3)
    await expect(tabs[0]).toHaveAttribute("tabindex", "0")
    await expect(tabs[1]).toHaveAttribute("tabindex", "-1")
    await expect(tabs[2]).toHaveAttribute("tabindex", "-1")
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true")

    // One panel visible, and it is the one the selected tab controls.
    const panels = canvas.getAllByRole("tabpanel", { hidden: true })
    await expect(panels[0]).toBeVisible()
    await expect(panels[1]).not.toBeVisible()
    await expect(tabs[0]).toHaveAttribute(
      "aria-controls",
      panels[0]!.getAttribute("id"),
    )
    await expect(panels[0]).toHaveAttribute(
      "aria-labelledby",
      tabs[0]!.getAttribute("id"),
    )
  },
}

/**
 * ←/→ move selection and focus together, and wrap at both ends; Home/End jump
 * to the first and last tab.
 */
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tabs = canvas.getAllByRole("tab")
    const panels = canvas.getAllByRole("tabpanel", { hidden: true })

    // Selection follows focus, so activating a tab also reveals its panel.
    tabs[0]!.focus()

    await userEvent.keyboard("{ArrowRight}")
    await expect(tabs[1]).toHaveFocus()
    await expect(tabs[1]).toHaveAttribute("aria-selected", "true")
    await expect(tabs[0]).toHaveAttribute("tabindex", "-1")
    await expect(panels[1]).toBeVisible()
    await expect(panels[0]).not.toBeVisible()

    // Wrap forward off the end, back to the first tab.
    await userEvent.keyboard("{ArrowRight}{ArrowRight}")
    await expect(tabs[0]).toHaveFocus()

    // Wrap backward off the start, to the last tab.
    await userEvent.keyboard("{ArrowLeft}")
    await expect(tabs[2]).toHaveFocus()
    await expect(panels[2]).toBeVisible()

    await userEvent.keyboard("{Home}")
    await expect(tabs[0]).toHaveFocus()

    await userEvent.keyboard("{End}")
    await expect(tabs[2]).toHaveFocus()
    await expect(tabs[2]).toHaveAttribute("aria-selected", "true")
  },
}
