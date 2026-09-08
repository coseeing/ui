import type { Meta, StoryObj } from "@storybook/react-vite"
import { Select } from "./Select.js"

/**
 * Select — NOT in the Figma "Brand" file; SSO gap-fill on brand tokens.
 * Matches the Input shell (rounded-8, warm-gray border, orange focus ring).
 *
 * See **Common/Form** for composed Field + Select examples.
 */
const meta = {
  title: "Components/Select",
  component: Select,
  parameters: { layout: "centered" },
  args: {
    invalid: false,
    disabled: false,
    // A <select> with no accessible name is a WCAG failure (axe: select-name),
    // and these stories are what people copy. In real usage prefer a visible
    // <Field label> — see Components/Form → SelectControl — and keep aria-label
    // for the genuinely label-less case.
    "aria-label": "介面語言",
  },
  argTypes: {
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-[32rem]">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Select defaultValue="zh-Hant" {...args}>
      <option value="zh-Hant">繁體中文</option>
      <option value="en">English</option>
      <option value="ja">日本語</option>
    </Select>
  ),
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

/** Interactive — drive invalid / disabled from the Controls panel. */
export const Playground: Story = {}

/** Default / Hover / Focused / Invalid / Disabled at a glance. */
export const States: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid max-w-[40rem] gap-16">
      {[
        { label: "Default" },
        { label: "Hover", className: "pseudo-hover" },
        { label: "Focused", className: "pseudo-focus-visible" },
        { label: "Invalid", props: { invalid: true } },
        { label: "Disabled", props: { disabled: true } },
      ].map((s) => (
        <div key={s.label} className="grid gap-4">
          {/* A real <label htmlFor>, not a <span>: the state name is the only
              text next to each control, so making it the accessible name costs
              nothing and keeps the matrix free of axe select-name failures. */}
          <label
            htmlFor={`state-${s.label}`}
            className="typography-body2 text-neutral-dark-gray"
          >
            {s.label}
          </label>
          <Select
            id={`state-${s.label}`}
            defaultValue="zh-Hant"
            className={s.className}
            {...s.props}
          >
            <option value="zh-Hant">繁體中文</option>
            <option value="en">English</option>
          </Select>
        </div>
      ))}
    </div>
  ),
}
