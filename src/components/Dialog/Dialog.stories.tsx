import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test"
import { Dialog } from "./Dialog.js"
import { Button } from "../Button/Button.js"

/**
 * Dialog — design-system extension (not in Figma), in the brand language: the
 * auth-panel signature (white rounded panel, orange top accent) over a teal
 * blurred backdrop. Built on the native `<dialog>` element — focus trap, ESC,
 * and inert background come from the platform; backdrop click also closes.
 */
const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
  args: {
    open: false,
    title: "確認送出申請?",
    description: "送出後我們會寄一封確認信到你的信箱,完成驗證即可使用帳號。",
    size: "sm",
    onClose: () => {},
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    open: { table: { disable: true } },
    onClose: { table: { disable: true } },
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

/** Click the trigger to open; close via ✕, ESC, backdrop, or the actions. */
export const Playground: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button variant="small" theme="dark" onClick={() => setOpen(true)}>
          開啟對話框
        </Button>
        <Dialog
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          actions={
            <>
              <Button variant="small" theme="greenStroke" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button variant="small" theme="dark" onClick={() => setOpen(false)}>
                確認送出
              </Button>
            </>
          }
        />
      </>
    )
  },
}

/**
 * Opening calls `showModal()`, so focus trapping and the inert background come
 * from the platform rather than from our code. These assertions are the reason
 * the story tests run in real Chromium: jsdom's `<dialog>` stub reports `open`
 * but does not move focus or make the dialog a modal.
 */
export const OpensAsAModal: Story = {
  render: Playground.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const dialog = canvasElement.querySelector("dialog")!
    await expect(dialog.open).toBe(false)

    await userEvent.click(canvas.getByRole("button", { name: "開啟對話框" }))

    await expect(dialog.open).toBe(true)
    // Named from its own heading via aria-labelledby, not a hand-written label.
    const modal = canvas.getByRole("dialog", { name: "確認送出申請?" })
    await expect(modal).toBeVisible()
    // showModal() moved focus inside; a plain .show() or a <div> would not.
    await expect(dialog.contains(document.activeElement)).toBe(true)
  },
}

/** The ✕ button closes it, and `closeLabel` is what names that button. */
export const ClosesViaCloseButton: Story = {
  render: Playground.render,
  args: { closeLabel: "Close" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvasElement.querySelector("dialog")!

    await userEvent.click(canvas.getByRole("button", { name: "開啟對話框" }))
    await expect(dialog.open).toBe(true)

    await userEvent.click(canvas.getByRole("button", { name: "Close" }))
    await expect(dialog.open).toBe(false)
  },
}

/**
 * A close driven by the browser reaches `onClose`.
 *
 * This is the subtle one. ESC is handled by the user agent, which closes the
 * element directly without going through React — so `open` would stay `true`
 * in the owner's state while the DOM said otherwise, and the next attempt to
 * open would be a no-op because the state never actually changed. `onClose` is
 * the only thing bridging that gap, and this is what catches it going missing.
 *
 * It calls `close()` rather than pressing ESC because `userEvent` dispatches
 * synthetic key events, which do not trigger native `<dialog>` dismissal.
 * `close()` fires the very same `close` event ESC does, so the path under test
 * is identical. `waitFor` is required because that event is queued as a task,
 * not fired synchronously.
 */
export const NativeCloseCallsOnClose: Story = {
  args: { open: true, onClose: fn() },
  play: async ({ args, canvasElement }) => {
    const dialog = canvasElement.querySelector("dialog")!
    await expect(dialog.open).toBe(true)

    dialog.close()

    await waitFor(() => expect(args.onClose).toHaveBeenCalled())
  },
}

/**
 * Closing and reopening works repeatedly — the effect that calls `showModal()`
 * has to re-run, not just fire once on mount.
 */
export const ReopensAfterClosing: Story = {
  render: Playground.render,
  args: { closeLabel: "Close" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("button", { name: "開啟對話框" })
    const dialog = canvasElement.querySelector("dialog")!

    for (let i = 0; i < 2; i++) {
      await userEvent.click(trigger)
      await expect(dialog.open).toBe(true)

      await userEvent.click(canvas.getByRole("button", { name: "Close" }))
      await expect(dialog.open).toBe(false)
    }
  },
}

/**
 * Clicking the backdrop closes it.
 *
 * A real backdrop click lands on the `<dialog>` element itself, because
 * `::backdrop` is its pseudo-element — the inner panel covers the whole dialog
 * box, so the dialog is only ever the target when the backdrop is hit. This
 * dispatches exactly that: a click whose target is the dialog. (userEvent aims
 * at an element's centre, which here is the panel, so it cannot express this.)
 */
export const ClosesOnBackdropClick: Story = {
  render: Playground.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvasElement.querySelector("dialog")!

    await userEvent.click(canvas.getByRole("button", { name: "開啟對話框" }))
    await expect(dialog.open).toBe(true)

    // Sanity-check the premise: a click inside the panel must NOT close it.
    await userEvent.click(canvas.getByText("確認送出申請?"))
    await expect(dialog.open).toBe(true)

    fireEvent.click(dialog)
    await expect(dialog.open).toBe(false)
  },
}

/** Destructive confirmation — pairs with the danger Button. */
export const Confirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button variant="small" theme="danger" onClick={() => setOpen(true)}>
          刪除帳號
        </Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="確定要刪除帳號嗎?"
          description="此動作無法復原。你的個人資料與所有活動紀錄將被永久移除。"
          actions={
            <>
              <Button variant="small" theme="greenStroke" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button variant="small" theme="danger" onClick={() => setOpen(false)}>
                永久刪除
              </Button>
            </>
          }
        />
      </>
    )
  },
}
