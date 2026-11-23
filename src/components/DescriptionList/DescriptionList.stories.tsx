import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { DescriptionList } from "./DescriptionList.js"
import { Badge } from "../Badge/Badge.js"
import { Link } from "../Link/Link.js"

/**
 * DescriptionList — design-system extension (not in Figma). Read-only
 * field/value pairs on a semantic `<dl>`/`<dt>`/`<dd>`. Stacked on mobile;
 * two columns from tablet up, with a fixed-width term column. Descriptions
 * take any node — badges, links, multi-line text.
 */
const meta = {
  title: "Components/DescriptionList",
  component: DescriptionList,
  parameters: { layout: "padded" },
  args: {
    items: [
      { term: "姓名", description: "王小明" },
      { term: "電子郵件", description: "xiaoming@example.com" },
      { term: "帳號身分", description: <Badge>志工</Badge> },
      {
        term: "個人網站",
        description: <Link href="https://example.com" className="text-teal-PRIMARY underline">example.com</Link>,
      },
      {
        term: "自我介紹",
        description:
          "長期關注資訊無障礙，參與過多個政府網站的檢測專案，也喜歡和視障朋友一起測試新的 App。",
      },
    ],
  },
} satisfies Meta<typeof DescriptionList>

export default meta
type Story = StoryObj<typeof meta>

/** Resize the canvas past 768px to see the two-column layout. */
export const Playground: Story = {}

/**
 * Real <dl> semantics: every term is paired with its description, in order —
 * which is what a screen reader's "list, 5 items" and term/definition
 * navigation rely on.
 */
export const Semantics: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const terms = canvas.getAllByRole("term")
    const descriptions = canvas.getAllByRole("definition")

    await expect(terms).toHaveLength(args.items.length)
    await expect(descriptions).toHaveLength(args.items.length)
    await expect(terms[0]!.tagName).toBe("DT")
    await expect(terms[0]!.closest("dl")).not.toBeNull()
    // Each pair shares a row wrapper, so the dd follows its own dt.
    await expect(terms[1]!.nextElementSibling).toBe(descriptions[1])
    await expect(descriptions[3]).toContainElement(canvas.getByRole("link", { name: "example.com" }))
  },
}

/**
 * Two columns from the tablet breakpoint, stacked below it. Asserts whichever
 * layout the current viewport should get (the test runner's is desktop-wide;
 * resize the Storybook canvas to check the other).
 */
export const ResponsiveLayout: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const term = canvas.getAllByRole("term")[0]!.getBoundingClientRect()
    const description = canvas.getAllByRole("definition")[0]!.getBoundingClientRect()

    if (window.innerWidth >= 768) {
      // Same row, term column first, and a fixed 16rem term column.
      await expect(Math.abs(description.top - term.top)).toBeLessThan(8)
      await expect(description.left).toBeGreaterThan(term.right)
      await expect(term.width).toBeCloseTo(160, 0)
    } else {
      await expect(description.top).toBeGreaterThanOrEqual(term.bottom)
    }
  },
}
