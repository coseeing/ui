import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Checkbox } from "./Checkbox.js"

/**
 * Checkbox — NOT in the Figma "Brand" file; SSO gap-fill on brand tokens.
 * Renders bare when `label` is omitted, or wrapped in a `<label>` when given.
 *
 * See **Common/Form** for composed examples.
 */
const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
  args: {
    id: "playground",
    label: "Remember this device",
    disabled: false,
    defaultChecked: false,
  },
  argTypes: {
    label: { control: "text" },
    disabled: { control: "boolean" },
    defaultChecked: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

/** Interactive — drive label / checked / disabled from the Controls panel. */
export const Playground: Story = {}

/**
 * The label is wired to the input, so clicking the text toggles the box.
 *
 * This is the whole point of the `label` prop — `getByRole("checkbox", { name })`
 * only resolves if the accessible name actually comes through, so this fails if
 * the `htmlFor`/`id` pairing regresses and leaves an unlabelled input.
 */
export const LabelTogglesTheBox: Story = {
  args: { id: "wired", label: "Remember this device" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const box = canvas.getByRole("checkbox", { name: "Remember this device" })
    await expect(box).not.toBeChecked()

    await userEvent.click(canvas.getByText("Remember this device"))
    await expect(box).toBeChecked()

    await userEvent.click(canvas.getByText("Remember this device"))
    await expect(box).not.toBeChecked()
  },
}

/** Without `label` it renders bare, for callers that supply their own. */
export const BareHasNoWrappingLabel: Story = {
  args: { id: "bare", label: undefined, "aria-label": "Standalone" },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole("checkbox")
    await expect(box.closest("label")).toBeNull()
  },
}

/** Disabled ignores clicks rather than merely looking dimmed. */
export const DisabledIgnoresClicks: Story = {
  args: { id: "off", label: "Unavailable", disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const box = canvas.getByRole("checkbox", { name: "Unavailable" })

    await expect(box).toBeDisabled()
    await userEvent.click(canvas.getByText("Unavailable"))
    await expect(box).not.toBeChecked()
  },
}

/** Unchecked / Checked / Focused / Disabled at a glance. */
export const States: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid gap-12">
      <Checkbox id="st-unchecked" label="Unchecked" />
      <Checkbox id="st-checked" label="Checked" defaultChecked />
      <Checkbox id="st-focus" label="Focused" className="pseudo-focus-visible" />
      <Checkbox id="st-disabled" label="Disabled" disabled />
      <Checkbox
        id="st-disabled-checked"
        label="Disabled · Checked"
        disabled
        defaultChecked
      />
    </div>
  ),
}
