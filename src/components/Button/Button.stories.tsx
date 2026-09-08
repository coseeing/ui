import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fireEvent, fn, userEvent, within } from "storybook/test"
import { Button } from "./Button.js"

/**
 * Button — sourced from Figma "Brand" → Elements.
 *
 * States (Default / Hover / Focused) are handled via CSS (`hover:`,
 * `focus-visible:`). Two families:
 * - `primary` (large pill): themes `light` (orange) and `dark` (teal)
 * - `small` (compact): themes `light`, `dark`, `greenStroke`, and `danger`
 *
 * **Usage rule (from the designer note):** the orange `primary/light` button is
 * mainly for green/dark backgrounds; on light backgrounds prefer `greenStroke`.
 * `danger` has no Figma equivalent — it's an extension for SSO destructive
 * actions (logout / delete).
 *
 * Three stories, one consistent structure:
 * - **Playground** — interactive single button (use the Controls panel)
 * - **Variants** — every variant/theme at a glance
 * - **States** — Default / Hover / Focused / Disabled matrix
 */
const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "centered" },
  args: {
    children: "聯絡我們",
    variant: "primary",
    theme: "light",
    disabled: false,
    isLoading: false,
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "small"] },
    theme: {
      control: "select",
      options: ["light", "dark", "greenStroke", "danger"],
    },
    disabled: { control: "boolean" },
    isLoading: { control: "boolean" },
    href: { control: "text" },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** Interactive — drive variant / theme / disabled from the Controls panel. */
export const Playground: Story = {}

/**
 * With `href`, Button renders an `<a>` — and still calls `onClick`.
 *
 * Regression test: the handler used not to reach the anchor branch at all, so
 * callers that pass both (EventCard's `onCtaClick`, the logout confirm) had
 * their clicks silently do nothing.
 */
export const AsLink: Story = {
  args: { href: "/contact", onClick: fn(), children: "聯絡我們" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole("link", { name: "聯絡我們" })

    await expect(link).toHaveAttribute("href", "/contact")
    // No <button> at all — an anchor must not also be exposed as a button.
    await expect(canvas.queryByRole("button")).toBeNull()

    // Keep the test from navigating the test runner away from the page.
    link.addEventListener("click", (e) => e.preventDefault())
    await userEvent.click(link)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

/** `as` forwards the link branch to the app's router link. */
export const AsRouterLink: Story = {
  args: { href: "/contact", children: "聯絡我們" },
  render: (args) => {
    function RouterLink({
      href,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
      return (
        <a href={href} data-router-link="true" {...props}>
          {children}
        </a>
      )
    }
    return <Button {...args} as={RouterLink} />
  },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "聯絡我們" })
    await expect(link).toHaveAttribute("data-router-link", "true")
    // The brand classes still land on the injected element, not a wrapper.
    await expect(link).toHaveClass("typography-strong1")
  },
}

/**
 * `href` + inert falls back to a real `<button disabled>`.
 *
 * A disabled `<a>` is not a thing — it stays focusable and clickable — so the
 * link branch is skipped whenever the button is disabled or loading.
 */
export const InertLinkFallsBackToButton: Story = {
  args: { href: "/contact", isLoading: true, onClick: fn(), children: "送出中" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole("link")).toBeNull()
    const button = canvas.getByRole("button")
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute("aria-busy", "true")

    // fireEvent, not userEvent: the button carries disabled:pointer-events-none,
    // so userEvent refuses to click it at all. That refusal is itself the first
    // layer of inertness — this dispatches the click anyway to prove the second
    // layer (the real `disabled` attribute) also holds.
    fireEvent.click(button)
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

/** isLoading shows a spinner and makes the button inert (aria-busy). */
export const Loading: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-16">
      <Button variant="primary" theme="light" isLoading>
        送出中
      </Button>
      <Button variant="primary" theme="dark" isLoading>
        送出中
      </Button>
      <Button variant="small" theme="dark" isLoading>
        登入中
      </Button>
      <Button variant="small" theme="greenStroke" isLoading>
        登入中
      </Button>
    </div>
  ),
}

/** Every variant and theme at a glance. */
export const Variants: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-col gap-24">
      <div className="flex flex-wrap items-center gap-16">
        <Button variant="primary" theme="light">
          Primary · Light
        </Button>
        <Button variant="primary" theme="dark">
          Primary · Dark
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-16">
        <Button variant="small" theme="light">
          Small · Light
        </Button>
        <Button variant="small" theme="dark">
          Small · Dark
        </Button>
        <Button variant="small" theme="greenStroke">
          Small · GreenStroke
        </Button>
        <Button variant="small" theme="danger">
          Small · Danger
        </Button>
      </div>
    </div>
  ),
}

// Each Figma button symbol defines State=Default / Hover / Focused. Those live
// in CSS (`hover:` / `focus-visible:`), so this matrix forces them statically via
// the pseudo-states addon (`pseudo-hover`, `pseudo-focus-visible`) — plus the
// Disabled column — so every state is reviewable at once for accessibility.
type StateCol = { label: string; className: string; disabled?: boolean }
const STATE_COLS: StateCol[] = [
  { label: "Default", className: "" },
  { label: "Hover", className: "pseudo-hover" },
  { label: "Focused", className: "pseudo-focus-visible" },
  { label: "Disabled", className: "", disabled: true },
]

function StateRow({
  title,
  render,
}: {
  title: string
  render: (col: StateCol) => React.ReactNode
}) {
  return (
    <>
      <div className="typography-strong2 flex items-center text-teal-700">
        {title}
      </div>
      {STATE_COLS.map((col) => (
        <div key={col.label} className="flex items-center justify-center">
          {render(col)}
        </div>
      ))}
    </>
  )
}

/** Default / Hover / Focused / Disabled for every variant. */
export const States: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div
      className="grid items-center gap-16"
      style={{ gridTemplateColumns: "auto repeat(4, minmax(0, 1fr))" }}
    >
      <div />
      {STATE_COLS.map((c) => (
        <div
          key={c.label}
          className="typography-body2 text-center text-neutral-dark-gray"
        >
          {c.label}
        </div>
      ))}

      <StateRow
        title="Primary · Light"
        render={(c) => (
          <Button variant="primary" theme="light" className={c.className} disabled={c.disabled}>
            聯絡我們
          </Button>
        )}
      />
      <StateRow
        title="Primary · Dark"
        render={(c) => (
          <Button variant="primary" theme="dark" className={c.className} disabled={c.disabled}>
            聯絡我們
          </Button>
        )}
      />
      <StateRow
        title="Small · Light"
        render={(c) => (
          <Button variant="small" theme="light" className={c.className} disabled={c.disabled}>
            成為志工
          </Button>
        )}
      />
      <StateRow
        title="Small · Dark"
        render={(c) => (
          <Button variant="small" theme="dark" className={c.className} disabled={c.disabled}>
            成為志工
          </Button>
        )}
      />
      <StateRow
        title="Small · GreenStroke"
        render={(c) => (
          <Button variant="small" theme="greenStroke" className={c.className} disabled={c.disabled}>
            成為志工
          </Button>
        )}
      />
      <StateRow
        title="Small · Danger"
        render={(c) => (
          <Button variant="small" theme="danger" className={c.className} disabled={c.disabled}>
            登出
          </Button>
        )}
      />
    </div>
  ),
}
