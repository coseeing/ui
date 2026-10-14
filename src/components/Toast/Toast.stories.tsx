import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"
import { Toast } from "./Toast.js"

/**
 * Toast — design-system extension (not in Figma). Dark teal card with a tone
 * dot; an optional close button (`onClose`, named by `closeLabel`).
 *
 * For anything that appears at runtime, render toasts through
 * **ToastRegion**: its live regions are always mounted, so announcements are
 * reliable, and it handles placement, `max`, and auto-dismiss. A standalone
 * Toast still carries `role="alert"` (danger) / `role="status"` itself.
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

/** `announce={false}` drops the card's own role, for use inside a live region. */
export const WithoutOwnRole: Story = {
  args: { announce: false, tone: "danger", title: "儲存失敗" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole("alert")).toBeNull()
    await expect(canvas.queryByRole("status")).toBeNull()
  },
}
