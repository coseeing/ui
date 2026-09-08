import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input } from "./Input.js"

/**
 * Input — NOT in the Figma "Brand" file; SSO gap-fill on brand tokens. Visually
 * matched to the `.ory-elements` input rules in globals.css (rounded-8,
 * warm-gray border, white field, teal text, orange focus ring).
 *
 * See **Common/Form** for composed Field + Input examples.
 */
const meta = {
  title: "Components/Input",
  component: Input,
  parameters: { layout: "centered" },
  args: {
    type: "text",
    placeholder: "you@example.com",
    invalid: false,
    disabled: false,
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "tel", "number", "search", "url"],
    },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  decorators: [
    (Story) => (
      <div className="w-[32rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

/** Interactive — drive type / invalid / disabled from the Controls panel. */
export const Playground: Story = {}

// Hover and Focused live in CSS (`hover:` / `focus-visible:`), forced statically
// via the pseudo-states addon so every state is reviewable at once.
const STATES: { label: string; className?: string; props?: Partial<React.ComponentProps<typeof Input>> }[] = [
  { label: "Default" },
  { label: "Hover", className: "pseudo-hover" },
  { label: "Focused", className: "pseudo-focus-visible" },
  { label: "Invalid", props: { invalid: true, defaultValue: "not-an-email" } },
  { label: "Disabled", props: { disabled: true, defaultValue: "locked@example.com" } },
]

/** Default / Hover / Focused / Invalid / Disabled at a glance. */
export const States: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid max-w-[40rem] gap-16">
      {STATES.map((s) => (
        <div key={s.label} className="grid gap-4">
          <span className="typography-body2 text-neutral-dark-gray">{s.label}</span>
          <Input placeholder="you@example.com" className={s.className} {...s.props} />
        </div>
      ))}
    </div>
  ),
}
