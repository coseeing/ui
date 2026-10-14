import { useRef, useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { ToastRegion, type ToastEntry } from "./ToastRegion.js"
import { Button } from "../Button/Button.js"

/**
 * ToastRegion — placement, how many at once, and auto-dismiss for Toasts. The
 * app owns the list and removes entries in `onDismiss`; there is no provider.
 * Mount it once and keep it mounted: its two live regions (assertive for
 * danger, polite otherwise) must exist before the first toast. Timers pause
 * while the pointer is over the region or focus is inside it.
 */

const SAMPLES: Omit<ToastEntry, "id">[] = [
  { tone: "success", title: "已儲存", message: "你的變更已儲存。" },
  { tone: "info", title: "已寄出驗證信", message: "請到信箱點擊連結完成驗證。" },
  { tone: "warning", title: "連線即將逾時" },
  { tone: "danger", title: "儲存失敗", message: "請檢查網路連線後再試一次。" },
]

type Args = React.ComponentProps<typeof ToastRegion>

function Demo(args: Partial<Args>) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const count = useRef(0)
  const push = (sample: Omit<ToastEntry, "id">) =>
    setToasts((t) => [...t, { ...sample, id: String(++count.current) }])
  return (
    <div className="flex flex-wrap gap-8">
      {SAMPLES.map((s) => (
        <Button key={s.title} variant="small" theme="greenStroke" onClick={() => push(s)}>
          {`通知：${s.title}`}
        </Button>
      ))}
      <ToastRegion
        {...args}
        toasts={toasts}
        onDismiss={(id) => {
          setToasts((t) => t.filter((x) => x.id !== id))
          args.onDismiss?.(id)
        }}
      />
    </div>
  )
}

const meta = {
  title: "Components/ToastRegion",
  component: ToastRegion,
  parameters: { layout: "fullscreen" },
  args: {
    toasts: [],
    onDismiss: fn(),
    position: "top-center",
    max: 3,
    duration: 5000,
  },
  argTypes: {
    toasts: { table: { disable: true } },
    position: {
      control: "inline-radio",
      options: ["top-center", "top-right", "bottom-center", "bottom-right"],
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[48rem] p-16 pt-[28rem]">
        <Story />
      </div>
    ),
  ],
  render: (args) => <Demo {...args} />,
} satisfies Meta<typeof ToastRegion>

export default meta
type Story = StoryObj<typeof meta>

/** Press the buttons; hover a toast to hold it. */
export const Playground: Story = {}

const press = (canvas: ReturnType<typeof within>, title: string) =>
  userEvent.click(canvas.getByRole("button", { name: `通知：${title}` }))

/**
 * The live regions exist before any toast, the cards carry no role of their
 * own, and danger goes to the assertive region while the rest go polite.
 */
export const Announcements: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const region = canvas.getByRole("region", { name: "通知" })
    const polite = within(region).getByRole("status")
    const assertive = within(region).getByRole("alert")
    await expect(polite).toHaveTextContent("")
    await expect(assertive).toHaveTextContent("")

    await press(canvas, "已儲存")
    await expect(polite).toHaveTextContent("已儲存，你的變更已儲存。")
    await expect(assertive).toHaveTextContent("")
    // Still exactly one status and one alert: the card added neither.
    await expect(within(region).getAllByRole("status")).toHaveLength(1)

    await press(canvas, "儲存失敗")
    await expect(assertive).toHaveTextContent("儲存失敗，請檢查網路連線後再試一次。")
    await expect(within(region).getAllByRole("alert")).toHaveLength(1)
  },
}

/** At most `max` at once; the next one appears (and is announced) as one goes. */
export const MaxVisible: Story = {
  args: { max: 2, duration: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const region = within(canvas.getByRole("region", { name: "通知" }))
    await press(canvas, "已儲存")
    await press(canvas, "已寄出驗證信")
    await press(canvas, "連線即將逾時")
    await expect(region.getAllByRole("button", { name: "關閉通知" })).toHaveLength(2)

    await userEvent.click(region.getAllByRole("button", { name: "關閉通知" })[0]!)
    await expect(region.getAllByRole("button", { name: "關閉通知" })).toHaveLength(2)
    await expect(region.getByRole("status")).toHaveTextContent("連線即將逾時")
  },
}

/** Auto-dismiss — paused while hovered, resumed on leave. */
export const PausesOnHover: Story = {
  args: { duration: 400 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const region = within(canvas.getByRole("region", { name: "通知" }))

    await press(canvas, "已儲存")
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledOnce(), { timeout: 1500 })
    await expect(region.queryByRole("button", { name: "關閉通知" })).toBeNull()

    await press(canvas, "已儲存")
    // userEvent, not fireEvent.mouseEnter: React derives onMouseEnter from
    // mouseover/mouseout, which a bare mouseenter event never reaches.
    const close = region.getByRole("button", { name: "關閉通知" })
    await userEvent.hover(close)
    await new Promise((r) => setTimeout(r, 700))
    await expect(close).toBeVisible()
    await userEvent.unhover(close)
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledTimes(2), { timeout: 1500 })
  },
}

/** Focus inside also pauses; danger stays until closed by default. */
export const PausesOnFocus: Story = {
  args: { duration: 400 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const region = within(canvas.getByRole("region", { name: "通知" }))

    await press(canvas, "已寄出驗證信")
    region.getByRole("button", { name: "關閉通知" }).focus()
    await new Promise((r) => setTimeout(r, 700))
    await expect(args.onDismiss).not.toHaveBeenCalled()

    await press(canvas, "儲存失敗") // moves focus out; the info toast resumes
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledOnce(), { timeout: 1500 })
    await new Promise((r) => setTimeout(r, 700))
    // The danger toast is still there.
    await expect(region.getAllByRole("button", { name: "關閉通知" })).toHaveLength(1)
  },
}

/**
 * Closing by hand moves focus to the next toast's close button, and after
 * the last one back to where focus was before entering the region.
 */
export const CloseMovesFocus: Story = {
  args: { duration: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const region = within(canvas.getByRole("region", { name: "通知" }))
    await press(canvas, "已儲存")
    const lastPressed = canvas.getByRole("button", { name: "通知：連線即將逾時" })
    await userEvent.click(lastPressed)

    const [first, second] = region.getAllByRole("button", { name: "關閉通知" })
    first!.focus()
    await userEvent.keyboard("{Enter}")
    await expect(second).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(region.queryByRole("button", { name: "關閉通知" })).toBeNull()
    await expect(lastPressed).toHaveFocus()
  },
}
