import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { Toast, type ToastTone } from "./Toast.js"
import { Button } from "../Button/Button.js"

/**
 * Toast — design-system extension (not in Figma). Dark teal card with a tone
 * dot; an optional close button (`onClose`, named by `closeLabel`).
 *
 * Without `open` it is a static card. With `open` it is one component per
 * notification: it appears in the stack for its `position`, shows at most
 * `max` at once, hides after `autoHide` (paused on hover and focus), and
 * announces through its own always-mounted LiveRegion — never a role on the
 * card itself.
 */
const meta = {
  title: "Components/Toast",
  component: Toast,
  parameters: { layout: "centered" },
  args: {
    tone: "info",
    title: "已寄出驗證信",
    message: "請到信箱點擊連結完成驗證。",
  },
  argTypes: {
    tone: { control: "inline-radio", options: ["info", "success", "warning", "danger"] },
  },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** All four semantic tones. */
export const Tones: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div className="grid max-w-[40rem] gap-12">
      <Toast {...args} tone="info" title="已寄出驗證信" message="請到信箱點擊連結完成驗證。" />
      <Toast {...args} tone="success" title="密碼已更新" message="下次登入請使用新密碼。" />
      <Toast
        {...args}
        tone="warning"
        title="連線即將逾時"
        message="閒置超過 10 分鐘將自動登出。"
      />
      <Toast {...args} tone="danger" title="儲存失敗" message="請檢查網路連線後再試一次。" />
    </div>
  ),
}

/** Top-centre placement, as ToastNotice positions it in the app. */
export const TopCentre: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="relative h-[32rem] w-full bg-bg-light-off-white">
      <div className="absolute inset-x-20 top-20 flex justify-center">
        <Toast {...args} tone="success" title="已儲存" message="你的變更已儲存。" />
      </div>
    </div>
  ),
}

/** `onClose` adds a close button; `closeLabel` names it. */
export const WithCloseButton: Story = {
  args: { onClose: fn(), closeLabel: "關閉這則通知" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "關閉這則通知" }))
    await expect(args.onClose).toHaveBeenCalledOnce()
  },
}

/**
 * No tone gives the card a role="alert" / role="status" of its own — not even
 * danger. That would be a live region inserted at the same moment as its
 * text, which screen readers announce unreliably; a managed `<Toast open>`
 * announces through its own always-mounted LiveRegion instead.
 */
export const NoLiveRegionOfItsOwn: Story = {
  render: (args) => (
    <div className="grid gap-12">
      {(["info", "success", "warning", "danger"] as const).map((tone) => (
        <Toast key={tone} {...args} tone={tone} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole("alert")).toBeNull()
    await expect(canvas.queryByRole("status")).toBeNull()
  },
}

// ── Managed mode: <Toast open> ─────────────────────────────────────────────

const SAMPLES: { key: string; tone: ToastTone; title: string; message?: string }[] = [
  { key: "saved", tone: "success", title: "已儲存", message: "你的變更已儲存。" },
  { key: "sent", tone: "info", title: "已寄出驗證信", message: "請到信箱點擊連結完成驗證。" },
  { key: "timeout", tone: "warning", title: "連線即將逾時" },
  { key: "failed", tone: "danger", title: "儲存失敗", message: "請檢查網路連線後再試一次。" },
]

/** One <Toast open> per notification; the buttons only flip booleans. */
function Managed({
  max,
  autoHide,
  onClose,
}: {
  max?: number
  autoHide?: number | null
  onClose?: (key: string) => void
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  return (
    <div className="flex min-h-[40rem] flex-wrap content-end gap-8 p-16">
      {SAMPLES.map((s) => (
        <Button
          key={s.key}
          variant="small"
          theme="greenStroke"
          onClick={() => setOpen((o) => ({ ...o, [s.key]: true }))}
        >
          {`通知：${s.title}`}
        </Button>
      ))}
      {SAMPLES.map((s) => (
        <Toast
          key={s.key}
          open={!!open[s.key]}
          onClose={() => {
            setOpen((o) => ({ ...o, [s.key]: false }))
            onClose?.(s.key)
          }}
          tone={s.tone}
          title={s.title}
          message={s.message}
          max={max}
          {...(autoHide !== undefined ? { autoHide } : {})}
        />
      ))}
    </div>
  )
}

const press = (canvas: ReturnType<typeof within>, title: string) =>
  userEvent.click(canvas.getByRole("button", { name: `通知：${title}` }))
const stack = () => within(document.body).queryByRole("region", { name: "通知" })
const closeButtons = () => within(stack()!).queryAllByRole("button", { name: "關閉通知" })
const regionTexts = (canvas: ReturnType<typeof within>, role: "status" | "alert") =>
  canvas.getAllByRole(role).map((r: HTMLElement) => r.textContent)

/** Press the buttons; hover a toast to hold it. */
export const ManagedPlayground: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <Managed />,
}

/**
 * Each Toast's live region exists before it opens and is empty; opening
 * writes the text in — polite for most tones, assertive for danger. The
 * stack's cards carry no role, and the stack is gone once nothing is open.
 */
export const ManagedAnnouncements: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <Managed autoHide={null} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(regionTexts(canvas, "status")).toEqual(["", "", ""])
    await expect(regionTexts(canvas, "alert")).toEqual([""])
    await expect(stack()).toBeNull()

    await press(canvas, "已儲存")
    await expect(regionTexts(canvas, "status")).toContain("已儲存，你的變更已儲存。")
    await expect(within(stack()!).queryByRole("status")).toBeNull()
    await expect(within(stack()!).queryByRole("alert")).toBeNull()

    await press(canvas, "儲存失敗")
    await expect(regionTexts(canvas, "alert")).toEqual(["儲存失敗，請檢查網路連線後再試一次。"])

    for (const button of closeButtons()) await userEvent.click(button)
    await waitFor(() => expect(stack()).toBeNull())
  },
}

/** At most `max` at once; the next one appears — and is announced — as one goes. */
export const ManagedMax: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <Managed max={2} autoHide={null} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await press(canvas, "已儲存")
    await press(canvas, "已寄出驗證信")
    await press(canvas, "連線即將逾時")
    await expect(closeButtons()).toHaveLength(2)
    // Held back, so not announced yet.
    await expect(regionTexts(canvas, "status")).not.toContain("連線即將逾時")

    await userEvent.click(closeButtons()[0]!)
    await waitFor(() => expect(closeButtons()).toHaveLength(2))
    await expect(regionTexts(canvas, "status")).toContain("連線即將逾時")
  },
}

/** `autoHide` — paused while hovered, resumed on leave. */
export const ManagedPausesOnHover: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => <Managed autoHide={400} onClose={args.onClose as never} />,
  args: { onClose: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await press(canvas, "已儲存")
    await waitFor(() => expect(args.onClose).toHaveBeenCalledOnce(), { timeout: 1500 })
    await waitFor(() => expect(stack()).toBeNull())

    await press(canvas, "已儲存")
    const close = closeButtons()[0]!
    await userEvent.hover(close)
    await new Promise((r) => setTimeout(r, 700))
    await expect(close).toBeVisible()
    await userEvent.unhover(close)
    await waitFor(() => expect(args.onClose).toHaveBeenCalledTimes(2), { timeout: 1500 })
  },
}

/** Focus inside the stack also pauses; it resumes once focus leaves. */
export const ManagedPausesOnFocus: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => <Managed autoHide={400} onClose={args.onClose as never} />,
  args: { onClose: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await press(canvas, "已寄出驗證信")
    closeButtons()[0]!.focus()
    await new Promise((r) => setTimeout(r, 700))
    await expect(args.onClose).not.toHaveBeenCalled()

    canvas.getByRole("button", { name: "通知：已儲存" }).focus()
    await waitFor(() => expect(args.onClose).toHaveBeenCalledWith("sent"), { timeout: 1500 })
  },
}

/**
 * Danger has no default timeout: an error should not vanish unread. (Waits
 * past the 5s default, so this one is slow on purpose.)
 */
export const ManagedDangerStays: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => <Managed onClose={args.onClose as never} />,
  args: { onClose: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await press(canvas, "儲存失敗")
    await new Promise((r) => setTimeout(r, 5600))
    await expect(args.onClose).not.toHaveBeenCalled()
    await expect(closeButtons()).toHaveLength(1)
  },
}

/**
 * Closing by hand moves focus to the next toast's close button, and after the
 * last one back to where focus was before entering the stack.
 */
export const ManagedCloseMovesFocus: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <Managed autoHide={null} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await press(canvas, "已儲存")
    const lastPressed = canvas.getByRole("button", { name: "通知：連線即將逾時" })
    await userEvent.click(lastPressed)

    const [first, second] = closeButtons()
    first!.focus()
    await userEvent.keyboard("{Enter}")
    await expect(second).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(stack()).toBeNull())
    await expect(lastPressed).toHaveFocus()
  },
}
