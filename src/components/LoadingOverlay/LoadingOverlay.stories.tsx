import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { LoadingOverlay } from "./LoadingOverlay.js"
import { Button } from "../Button/Button.js"
import { Card } from "../Card/Card.js"
import { Dialog } from "../Dialog/Dialog.js"

/**
 * LoadingOverlay — design-system extension (not in Figma). Covers `children`
 * (or the whole page with `fullPage`) while work runs. Covered content is
 * `inert` — not clickable, focusable, or readable — and focus inside it moves
 * to the panel, then back. An always-mounted live region announces `label`
 * when it appears and `doneLabel` (載入完畢) when it lifts.
 */
const meta = {
  title: "Components/LoadingOverlay",
  component: LoadingOverlay,
  parameters: { layout: "padded" },
  args: {
    active: false,
    label: "資料處理中",
    doneLabel: "載入完畢",
    fullPage: false,
  },
} satisfies Meta<typeof LoadingOverlay>

export default meta
type Story = StoryObj<typeof meta>

/** Long enough to see, short enough for the tests. */
const WORK_MS = 600

function Demo(args: React.ComponentProps<typeof LoadingOverlay>) {
  const [active, setActive] = useState(false)
  const run = () => {
    setActive(true)
    setTimeout(() => setActive(false), WORK_MS)
  }
  return (
    <div className="grid max-w-[48rem] gap-16">
      <LoadingOverlay {...args} active={active} className="rounded-16">
        <Card className="grid gap-12 p-24">
          <p className="typography-body1 m-0 text-teal-700">
            送出後會重新計算所有報名者的分組結果。
          </p>
          <div>
            <Button variant="small" theme="dark" onClick={run}>
              重新計算
            </Button>
          </div>
        </Card>
      </LoadingOverlay>
      <div>
        <Button variant="small" theme="greenStroke" onClick={() => {}}>
          覆蓋範圍外的按鈕
        </Button>
      </div>
    </div>
  )
}

/** Press 重新計算: the card is covered for a moment. */
export const Playground: Story = {
  render: (args) => <Demo {...args} />,
}

/**
 * Covered content is inert while active; focus moves from the pressed button
 * to the panel and comes back afterwards. Start and end are both announced.
 */
export const InertAndFocus: Story = {
  render: (args) => <Demo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const status = canvas.getByRole("status")
    await expect(status).toHaveTextContent("") // nothing on mount

    const run = canvas.getByRole("button", { name: "重新計算" })
    await userEvent.click(run)

    const panel = canvas.getByRole("group", { name: "資料處理中" })
    await expect(panel).toHaveFocus()
    await expect(status).toHaveTextContent("資料處理中")

    // Inert: cannot take focus. (A synthetic click would still dispatch, so
    // focus is the honest probe.) Content outside the overlay is unaffected.
    run.focus()
    await expect(run).not.toHaveFocus()
    await expect(run.closest("[inert]")).not.toBeNull()
    await expect(run.closest("[aria-busy]")).toHaveAttribute("aria-busy", "true")
    const outside = canvas.getByRole("button", { name: "覆蓋範圍外的按鈕" })
    outside.focus()
    await expect(outside).toHaveFocus()
    panel.focus()

    await waitFor(() => expect(status).toHaveTextContent("載入完畢"))
    await expect(canvas.queryByRole("group", { name: "資料處理中" })).toBeNull()
    await waitFor(() => expect(run).toHaveFocus())
    await expect(run.closest("[inert]")).toBeNull()
  },
}

function FullPageDemo(args: React.ComponentProps<typeof LoadingOverlay>) {
  const [active, setActive] = useState(false)
  return (
    <>
      <Button
        variant="small"
        theme="dark"
        onClick={() => {
          setActive(true)
          setTimeout(() => setActive(false), WORK_MS)
        }}
      >
        匯出全部資料
      </Button>
      <LoadingOverlay {...args} active={active} fullPage label="匯出中" />
    </>
  )
}

/**
 * `fullPage` renders into <body> and makes everything else inert — here the
 * whole Storybook root — then restores it.
 */
export const FullPage: Story = {
  render: (args) => <FullPageDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(document.body)
    const trigger = canvas.getByRole("button", { name: "匯出全部資料" })

    await userEvent.click(trigger)
    const panel = page.getByRole("group", { name: "匯出中" })
    await expect(panel).toHaveFocus()
    await expect(canvasElement.closest("[inert]")).not.toBeNull()
    await expect(panel.closest("[inert]")).toBeNull()

    const status = page.getByRole("status")
    await expect(status).toHaveTextContent("匯出中")
    await waitFor(() => expect(status).toHaveTextContent("載入完畢"))
    await expect(canvasElement.closest("[inert]")).toBeNull()
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

/**
 * Started from inside a modal Dialog, the full-page overlay renders into that
 * dialog: in <body> it would sit behind the modal — invisible, its panel
 * unfocusable, its announcements lost. The dialog's own content is made inert
 * instead, and focus comes back to the button afterwards.
 */
export const FullPageFromModalDialog: Story = {
  render: function Render(args) {
    const [dialog, setDialog] = useState(false)
    const [active, setActive] = useState(false)
    return (
      <>
        <Button variant="small" theme="dark" onClick={() => setDialog(true)}>
          匯出
        </Button>
        <Dialog
          open={dialog}
          onClose={() => setDialog(false)}
          title="匯出報名資料"
          actions={
            <Button
              variant="small"
              theme="dark"
              onClick={() => {
                setActive(true)
                setTimeout(() => setActive(false), WORK_MS)
              }}
            >
              開始匯出
            </Button>
          }
        />
        <LoadingOverlay {...args} active={active} fullPage label="匯出中" />
      </>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "匯出" }))
    const dialog = canvas.getByRole("dialog", { name: "匯出報名資料" })
    const start = within(dialog).getByRole("button", { name: "開始匯出" })
    await userEvent.click(start)

    const panel = within(dialog).getByRole("group", { name: "匯出中" })
    await expect(panel).toHaveFocus()
    await expect(start.closest("[inert]")).not.toBeNull()
    const status = within(dialog).getByRole("status")
    await waitFor(() => expect(status).toHaveTextContent("匯出中"))

    await waitFor(() => expect(status).toHaveTextContent("載入完畢"))
    await expect(start.closest("[inert]")).toBeNull()
    await waitFor(() => expect(start).toHaveFocus())
  },
}
