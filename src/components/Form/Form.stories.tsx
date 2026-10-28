import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { expect, userEvent, within } from "storybook/test"
import { Input } from "../Input/Input.js"
import { Select } from "../Select/Select.js"
import { Checkbox } from "../Checkbox/Checkbox.js"
import { Field, Label, ValidationMessage, fieldDescribedBy } from "../Field/Field.js"
import { Button } from "../Button/Button.js"

/**
 * Form primitives — **none of these exist in the Figma "Brand" file.** They are
 * SSO gap-fills built on the brand tokens (the same treatment `@ory/elements-react`
 * gets via the `.ory-elements` CSS variables in globals.css), so the center auth
 * flows have first-class Input / Field / Checkbox / Select / ValidationMessage.
 */
const meta: Meta = {
  title: "Components/Form",
  parameters: { layout: "padded" },
}
export default meta
type Story = StoryObj

export const TextInput: Story = {
  render: () => (
    <div className="grid max-w-[40rem] gap-16">
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="pw" hint="At least 8 characters.">
        <Input id="pw" type="password" placeholder="••••••••" />
      </Field>
    </div>
  ),
}

export const InvalidInput: Story = {
  render: () => (
    <div className="grid max-w-[40rem] gap-16">
      <Field label="Email" htmlFor="bad" error="That email address is not valid.">
        <Input id="bad" type="email" defaultValue="not-an-email" invalid />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    )

    // The message sits inside Field's always-mounted aria-live region. That
    // region has to exist before the error appears, so mounting a
    // role="alert" on demand is exactly what must NOT be happening here.
    const message = canvas.getByText("That email address is not valid.")
    await expect(message.closest("[aria-live]")).not.toBeNull()
    // ...and the message itself does not double up as an alert, which would
    // announce it twice.
    await expect(message).not.toHaveAttribute("role", "alert")
  },
}

/**
 * `hint` and `error` are mutually exclusive: an error replaces the hint rather
 * than stacking under it, so the field never shows advice and a failure at once.
 */
export const ErrorReplacesHint: Story = {
  render: () => (
    <div className="grid max-w-[40rem] gap-16">
      <Field
        label="Password"
        htmlFor="pw-both"
        hint="At least 8 characters."
        error="That password is too short."
      >
        <Input id="pw-both" type="password" defaultValue="abc" invalid />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("That password is too short.")).toBeVisible()
    await expect(canvas.queryByText("At least 8 characters.")).toBeNull()
  },
}

/** A standalone danger message announces itself; a success one does not. */
export const ValidationMessageRoles: Story = {
  render: () => (
    <div className="grid gap-8">
      <ValidationMessage variant="danger">Sign-in failed.</ValidationMessage>
      <ValidationMessage variant="success">Password updated.</ValidationMessage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Errors interrupt; confirmations do not.
    await expect(canvas.getByText("Sign-in failed.")).toHaveAttribute(
      "role",
      "alert",
    )
    await expect(canvas.getByText("Password updated.")).not.toHaveAttribute(
      "role",
    )
  },
}

/**
 * `htmlFor` gives the hint and the error their ids, so the control can carry
 * one fixed `aria-describedby={fieldDescribedBy(id)}`. The description follows
 * the state: the hint while valid, the error once there is one — and the
 * error is announced, because its region was there all along.
 */
export const DescribedByFollowsState: Story = {
  render: function Render() {
    const [error, setError] = useState<string>()
    return (
      <div className="grid max-w-[40rem] gap-16">
        <Field label="Email" htmlFor="desc-email" hint="We never share it." error={error}>
          <Input
            id="desc-email"
            type="email"
            invalid={!!error}
            aria-describedby={fieldDescribedBy("desc-email")}
          />
        </Field>
        <Button variant="small" theme="dark" onClick={() => setError("That email address is not valid.")}>
          Validate
        </Button>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText("Email")
    // Anchored regex: the still-empty error region adds a trailing space in
    // the test library's computation, which assistive tech ignores.
    await expect(input).toHaveAccessibleDescription(/^We never share it\.\s*$/)

    await userEvent.click(canvas.getByRole("button", { name: "Validate" }))
    await expect(input).toHaveAccessibleDescription("That email address is not valid.")
    await expect(input).toHaveAttribute("aria-invalid", "true")
    // The described-by target is the live region itself, mounted from the start.
    const region = document.getElementById("desc-email-error")!
    await expect(region).toHaveAttribute("aria-live", "polite")
  },
}

/**
 * The always-mounted error region adds no space while empty: the field ends
 * at its hint, not 8px below it. With an error, the message sits the usual
 * 8px under the control.
 */
export const NoGapFromEmptyErrorRegion: Story = {
  render: () => (
    <div className="grid max-w-[40rem] gap-16">
      <Field label="Email" htmlFor="gap-email" hint="We never share it.">
        <Input id="gap-email" type="email" aria-describedby={fieldDescribedBy("gap-email")} />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("Email")
    const field = input.parentElement!
    const hint = document.getElementById("gap-email-hint")!
    await expect(field.getBoundingClientRect().bottom).toBeCloseTo(
      hint.getBoundingClientRect().bottom,
      0,
    )
    // Still mounted and still a live region.
    await expect(document.getElementById("gap-email-error")).toHaveAttribute("aria-live", "polite")
  },
}

export const Disabled: Story = {
  render: () => (
    <div className="grid max-w-[40rem] gap-16">
      <Field label="Email" htmlFor="dis">
        <Input id="dis" type="email" defaultValue="locked@example.com" disabled />
      </Field>
    </div>
  ),
}

export const SelectControl: Story = {
  render: () => (
    <div className="grid max-w-[40rem] gap-16">
      <Field label="Language" htmlFor="lang">
        <Select id="lang" defaultValue="zh-Hant">
          <option value="zh-Hant">繁體中文</option>
          <option value="en">English</option>
        </Select>
      </Field>
    </div>
  ),
}

export const Checkboxes: Story = {
  render: () => (
    <div className="grid gap-12">
      <Checkbox id="remember" label="Remember this device" defaultChecked />
      <Checkbox id="tos" label="I agree to the terms of service" />
      <Checkbox id="dis" label="Unavailable option" disabled />
    </div>
  ),
}

export const ValidationMessages: Story = {
  render: () => (
    <div className="grid gap-8">
      <ValidationMessage variant="danger">
        Your session has expired. Please sign in again.
      </ValidationMessage>
      <ValidationMessage variant="success">
        Your password was updated successfully.
      </ValidationMessage>
    </div>
  ),
}

/** A full sign-in form composed from the gap-fill primitives. */
export const LoginForm: Story = {
  render: () => (
    <form className="grid max-w-[42rem] gap-20">
      <div className="grid gap-4">
        <Label>Sign in</Label>
        <p className="typography-body2 text-neutral-dark-gray">
          Use your Coseeing account to continue.
        </p>
      </div>
      <Field label="Email" htmlFor="login-email">
        <Input id="login-email" type="email" placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="login-pw">
        <Input id="login-pw" type="password" placeholder="••••••••" />
      </Field>
      <Checkbox id="login-remember" label="Remember me" />
      <Button variant="primary" theme="dark" type="submit">
        登入
      </Button>
    </form>
  ),
}
