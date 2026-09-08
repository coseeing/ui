import type { Meta, StoryObj } from "@storybook/react-vite"
import { Toast } from "./Toast.js"

/**
 * Toast — design-system extension (not in Figma). Flat tinted card; the tone is
 * the fill itself, drawn from the Foundations tints (info=blue-100,
 * success=green-100, warning=orange-100, danger=red-100). No border and no
 * close control. Danger announces as `role="alert"`, the rest as polite
 * `role="status"`. Positioning is owned by the app — see ToastNotice, which
 * pins it to the top centre.
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
