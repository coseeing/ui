import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Textarea } from "./Textarea.js"
import { Field, fieldDescribedBy } from "../Field/Field.js"

/**
 * Textarea — NOT in the Figma "Brand" file; SSO gap-fill on brand tokens. The
 * Input shell, multi-line: `invalid` sets `aria-invalid`, `rows` sets the
 * height, and every native textarea attribute passes through. `autoResize`
 * grows the field with its content (CSS `field-sizing`; browsers without it
 * keep the fixed height and the resize handle).
 */
const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
  args: {
    rows: 4,
    placeholder: "簡單介紹你自己",
    invalid: false,
    disabled: false,
    autoResize: false,
    "aria-label": "自我介紹",
  },
  argTypes: {
    rows: { control: { type: "number", min: 1, max: 12 } },
  },
  decorators: [
    (Story) => (
      <div className="w-[36rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

/** Interactive — rows / invalid / disabled / autoResize from Controls. */
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
        { label: "Invalid", props: { invalid: true, defaultValue: "太短" } },
        { label: "Disabled", props: { disabled: true, defaultValue: "無法編輯" } },
      ].map((s) => (
        <div key={s.label} className="grid gap-4">
          <label
            htmlFor={`state-${s.label}`}
            className="typography-body2 text-neutral-dark-gray"
          >
            {s.label}
          </label>
          <Textarea id={`state-${s.label}`} rows={2} className={s.className} {...s.props} />
        </div>
      ))}
    </div>
  ),
}

/**
 * Inside Field: `aria-describedby={fieldDescribedBy(id)}` points at the hint
 * and the error, and `invalid` sets the error state.
 */
export const WithField: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid max-w-[40rem] gap-24">
      <Field label="自我介紹" htmlFor="bio" hint="最多 200 字，會顯示在你的公開頁面。">
        <Textarea id="bio" aria-describedby={fieldDescribedBy("bio")} maxLength={200} />
      </Field>
      <Field label="退件原因" htmlFor="reason" error="請填寫退件原因">
        <Textarea id="reason" invalid aria-describedby={fieldDescribedBy("reason")} rows={3} />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const bio = canvas.getByLabelText("自我介紹")
    await expect(bio.tagName).toBe("TEXTAREA")
    // Anchored regex rather than a string: the empty error region joins the
    // description as a trailing space in the test library's computation,
    // which assistive tech ignores.
    await expect(bio).toHaveAccessibleDescription(/^最多 200 字，會顯示在你的公開頁面。\s*$/)
    await expect(bio).toHaveAttribute("maxlength", "200") // native attrs pass through
    await expect(bio).not.toHaveAttribute("aria-invalid")

    const reason = canvas.getByLabelText("退件原因")
    await expect(reason).toHaveAttribute("aria-invalid", "true")
    await expect(reason).toHaveAccessibleDescription("請填寫退件原因")
  },
}

/** `autoResize`: starts at `rows` lines and grows as lines are added. */
export const AutoResize: Story = {
  args: { autoResize: true, rows: 2 },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole("textbox", { name: "自我介紹" })
    const before = field.getBoundingClientRect().height

    field.focus()
    await userEvent.keyboard("第一行{Enter}第二行{Enter}第三行{Enter}第四行{Enter}第五行")
    const after = field.getBoundingClientRect().height
    await expect(after).toBeGreaterThan(before)

    // ...and shrinks back, but never below `rows`.
    await userEvent.clear(field)
    await expect(field.getBoundingClientRect().height).toBe(before)
  },
}
