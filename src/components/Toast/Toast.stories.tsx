import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"
import { Toast } from "./Toast.js"

/**
 * Toast — design-system extension (not in Figma). Dark teal card with a tone
 * dot; an optional close button (`onClose`, named by `closeLabel`).
 *
 * The card has no live-region role of its own: a region inserted together with
 * its text is announced unreliably. Render runtime toasts through
 * **ToastRegion**, whose live regions are always mounted, and which handles
 * placement, `max`, and auto-dismiss.
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
 * text, which screen readers announce unreliably; ToastRegion's always-mounted
 * regions do the announcing instead.
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
