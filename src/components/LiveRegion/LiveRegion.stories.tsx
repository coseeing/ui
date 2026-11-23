import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { LiveRegion, useAnnouncer } from "./LiveRegion.js"
import { Button } from "../Button/Button.js"

/**
 * LiveRegion + useAnnouncer — screen-reader announcements for things with no
 * other voice (已儲存, 已複製連結). The region is always mounted and starts
 * empty; `say(text)` changes what is inside it, and the text is cleared again
 * after `clearAfter` (7s by default) so a visually hidden copy does not linger
 * for the virtual cursor to find. Saying the same text twice still announces.
 *
 * Combobox, FileUpload, ReorderableList, LoadingOverlay and Toast all
 * announce through this.
 */
const meta = {
  title: "Components/LiveRegion",
  component: LiveRegion,
  parameters: { layout: "centered" },
  args: { message: null, politeness: "polite" },
} satisfies Meta<typeof LiveRegion>

export default meta
type Story = StoryObj<typeof meta>

function Demo({ clearAfter }: { clearAfter?: number }) {
  const { message, say } = useAnnouncer({ clearAfter })
  return (
    <div className="flex gap-8">
      <Button variant="small" theme="dark" onClick={() => say("已複製連結")}>
        複製連結
      </Button>
      <LiveRegion message={message} />
    </div>
  )
}

/** Press the button with a screen reader on: 「已複製連結」, every time. */
export const Playground: Story = {
  render: () => <Demo />,
}

/**
 * Mounted empty; `say()` fills it; the same text again is a fresh node (so it
 * is announced again); and the text is cleared after `clearAfter`.
 */
export const SayAndClear: Story = {
  render: () => <Demo clearAfter={400} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const region = canvas.getByRole("status")
    await expect(region).toHaveTextContent("")
    await expect(region).toHaveClass("sr-only")

    const button = canvas.getByRole("button", { name: "複製連結" })
    await userEvent.click(button)
    await expect(region).toHaveTextContent("已複製連結")
    const first = region.firstElementChild

    await userEvent.click(button)
    await expect(region).toHaveTextContent("已複製連結")
    // Same words, new node: a change the screen reader announces again.
    await expect(region.firstElementChild).not.toBe(first)

    await waitFor(() => expect(region).toHaveTextContent(""), { timeout: 1500 })
    // The region itself stays, ready for the next message.
    await expect(canvas.getByRole("status")).toBe(region)
  },
}

/** `politeness="assertive"` renders role="alert" — for errors only. */
export const Assertive: Story = {
  args: { politeness: "assertive", message: { text: "儲存失敗", n: 1 } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("alert")).toHaveTextContent("儲存失敗")
  },
}
