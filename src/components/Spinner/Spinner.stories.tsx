import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Spinner } from "./Spinner.js"

/**
 * Spinner — design-system extension (not in Figma). `role="status"` with a
 * label for screen readers (visually hidden unless `showLabel`). Holds still
 * under `prefers-reduced-motion`.
 *
 * A status region announces changes, so a Spinner mounted together with its
 * label is often silent. Use **LoadingOverlay** when the start and end of a
 * wait must be announced.
 */
const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: { layout: "centered" },
  args: { label: "載入中", size: "md", showLabel: false },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

/** Interactive — label, size and showLabel from Controls. */
export const Playground: Story = {}

/** All three sizes, with and without a visible label. */
export const Sizes: Story = {
  render: () => (
    <div className="grid gap-16">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex items-center gap-24">
          <Spinner size={size} label={`載入中（${size}）`} />
          <Spinner size={size} label="載入中" showLabel />
        </div>
      ))}
    </div>
  ),
}

/**
 * The label reaches assistive tech through the status role even when hidden;
 * the ring itself is decorative. Under reduced motion the ring's animation is
 * `none` — checked against the stylesheet, since a test cannot flip the OS
 * setting.
 */
export const Semantics: Story = {
  args: { label: "正在讀取報名資料" },
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole("status")
    await expect(status).toHaveTextContent("正在讀取報名資料")

    const ring = status.querySelector('[aria-hidden="true"]')!
    await expect(getComputedStyle(ring).animationName).toBe("spin")

    // Walk the stylesheets (through @layer / @media nesting) for the
    // utility's rule inside a reduced-motion media query.
    const walk = (rules: CSSRuleList, inReduced: boolean): boolean =>
      Array.from(rules).some((rule) => {
        if (rule instanceof CSSMediaRule)
          return walk(rule.cssRules, inReduced || rule.conditionText.includes("prefers-reduced-motion: reduce"))
        if (rule instanceof CSSStyleRule && inReduced && rule.selectorText.includes("motion-reduce"))
          return rule.style.animationName === "none" && ring.matches(rule.selectorText)
        return "cssRules" in rule && walk((rule as CSSGroupingRule).cssRules, inReduced)
      })
    const reducedMotionStopsIt = Array.from(document.styleSheets).some((sheet) => {
      try {
        return walk(sheet.cssRules, false)
      } catch {
        return false // cross-origin sheet
      }
    })
    await expect(reducedMotionStopsIt).toBe(true)
  },
}
