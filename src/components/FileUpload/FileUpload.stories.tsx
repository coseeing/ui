import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test"
import { FileUpload } from "./FileUpload.js"
import { Field } from "../Field/Field.js"
import { Button } from "../Button/Button.js"

/**
 * FileUpload — design-system extension (not in Figma). A real `<button>`
 * drives a hidden `<input type="file">` (tabIndex −1, aria-hidden). The chosen
 * file's name is announced through a persistent live region; the preview has
 * alt text. Drag and drop is a shortcut, never the only way. `value` is a new
 * File, the URL of an existing file, or null.
 */

// A real 1×1 PNG, so object-URL previews actually load in the tests.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
const PNG_DATA_URL = `data:image/png;base64,${PNG_BASE64}`
const png = (name: string) =>
  new File([Uint8Array.from(atob(PNG_BASE64), (c) => c.charCodeAt(0))], name, {
    type: "image/png",
  })

/** Sets the hidden input's files and fires change, as the picker would. */
function pick(input: HTMLInputElement, file: File) {
  const dt = new DataTransfer()
  dt.items.add(file)
  input.files = dt.files
  fireEvent.change(input)
}

const fileInput = (root: HTMLElement) =>
  root.querySelector<HTMLInputElement>('input[type="file"]')!

type Args = React.ComponentProps<typeof FileUpload>

function Demo({ value: initial = null, ...args }: Partial<Args>) {
  const [value, setValue] = useState<File | string | null>(initial)
  return (
    <Field label="封面圖片" htmlFor="cover" className="w-[44rem] max-w-full">
      <FileUpload
        accept="image/*"
        preview
        {...args}
        id="cover"
        value={value}
        onChange={(file) => {
          setValue(file)
          args.onChange?.(file)
        }}
        onRemove={() => {
          setValue(null)
          args.onRemove?.()
        }}
      />
    </Field>
  )
}

const meta = {
  title: "Components/FileUpload",
  component: FileUpload,
  parameters: { layout: "padded" },
  args: {
    value: null,
    onChange: fn(),
    onRemove: fn(),
    preview: true,
    invalid: false,
    disabled: false,
    accept: "image/*",
  },
  argTypes: {
    value: { table: { disable: true } },
  },
  render: (args) => <Demo {...args} />,
} satisfies Meta<typeof FileUpload>

export default meta
type Story = StoryObj<typeof meta>

/** Choose, replace, remove — or drop a file on the tile. */
export const Playground: Story = {}

/**
 * The trigger is a real button whose name keeps both the field label and the
 * action; the native input is out of the tab order and the a11y tree.
 */
export const Semantics: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("button", { name: "封面圖片，選擇圖片" })
    await expect(trigger.tagName).toBe("BUTTON")
    // <Label htmlFor> still reaches it.
    await expect(canvas.getByLabelText(/封面圖片/)).toBe(trigger)

    const input = fileInput(canvasElement)
    await expect(input).toHaveAttribute("tabindex", "-1")
    await expect(input).toHaveAttribute("aria-hidden", "true")

    // No value: no remove action, and no preview image.
    await expect(canvas.queryByRole("button", { name: /刪除圖片/ })).toBeNull()
    // The state is part of the description: nothing chosen yet.
    await expect(canvas.getByRole("button", { name: "封面圖片，選擇圖片" })).toHaveAccessibleDescription("未設定")
    await expect(canvas.queryByRole("img")).toBeNull()
  },
}

/**
 * Re-selecting works twice in a row — including the same file. The input is
 * reset after each change; without that, the browser fires no change event
 * for an identical second pick and "重新選取" silently does nothing.
 */
export const ReselectTwice: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = fileInput(canvasElement)
    const status = canvas.getByRole("status")

    const first = png("first.png")
    pick(input, first)
    await expect(args.onChange).toHaveBeenLastCalledWith(first)
    await expect(input).toHaveValue("")
    await expect(status).toHaveTextContent("已選擇 first.png")
    await waitFor(() =>
      expect(canvas.getByRole("img", { name: "預覽：first.png" })).toBeVisible(),
    )
    // After choosing, the trigger says which file is set — not just 重新選取.
    await expect(canvas.getByRole("button", { name: "封面圖片，重新選取" })).toHaveAccessibleDescription(
      "first.png",
    )

    const second = png("second.png")
    pick(input, second)
    await expect(args.onChange).toHaveBeenLastCalledWith(second)
    await waitFor(() =>
      expect(canvas.getByRole("img", { name: "預覽：second.png" })).toBeVisible(),
    )

    // The same file once more.
    pick(input, second)
    await expect(args.onChange).toHaveBeenCalledTimes(3)
    await expect(input).toHaveValue("")
  },
}

/**
 * An existing file arrives as a URL: preview and 刪除 show straight away.
 * Removing hands focus to the trigger rather than dropping it.
 */
export const ExistingUrl: Story = {
  args: { value: PNG_DATA_URL },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getByRole("img", { name: "預覽：目前的圖片" })).toBeVisible(),
    )
    const trigger = canvas.getByRole("button", { name: "封面圖片，重新選取" })

    // Named with the field, so several uploaders on a page are distinguishable.
    await userEvent.click(canvas.getByRole("button", { name: "封面圖片，刪除圖片" }))
    await expect(args.onRemove).toHaveBeenCalledOnce()
    await expect(trigger).toHaveFocus()
    await expect(trigger).toHaveAccessibleName("封面圖片，選擇圖片")
    await expect(canvas.getByRole("status")).toHaveTextContent("已刪除")
    await expect(canvas.queryByRole("img")).toBeNull()
  },
}

/**
 * A URL that fails to load shows an error — not the empty state. The value
 * is still set: the file name stays, and so do 重新選取 and 刪除.
 */
export const BrokenImage: Story = {
  args: { value: "/missing/uploads/cover%20photo.jpg" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("button", { name: "封面圖片，重新選取" })

    await waitFor(() => expect(trigger).toHaveAccessibleDescription("cover photo.jpg 圖片無法載入"))
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("圖片無法載入"))
    await expect(canvas.queryByRole("img")).toBeNull()
    await expect(canvas.getByRole("button", { name: "封面圖片，刪除圖片" })).toBeVisible()
  },
}

/** Dropping works too, and a file outside `accept` is refused out loud. */
export const DropFile: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("button", { name: "封面圖片，選擇圖片" })
    // Native DragEvents: in a real browser `dataTransfer` is a read-only
    // getter, so fireEvent's way of attaching it leaves it null.
    const drop = (file: File) => {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      for (const type of ["dragover", "drop"]) {
        trigger.dispatchEvent(
          new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }),
        )
      }
    }

    drop(new File(["hello"], "notes.txt", { type: "text/plain" }))
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(canvas.getByRole("status")).toHaveTextContent("不支援這個檔案類型")
    await expect(trigger).toHaveAccessibleDescription("未設定 不支援這個檔案類型")

    const photo = png("dropped.png")
    drop(photo)
    await expect(args.onChange).toHaveBeenCalledWith(photo)
    await expect(canvas.getByRole("status")).toHaveTextContent("已選擇 dropped.png")
  },
}

/** Without `preview`: name and actions only, for non-image files. */
export const WithoutPreview: Story = {
  args: {
    preview: false,
    accept: ".pdf",
    labels: { choose: "選擇檔案", replace: "重新選取", remove: "刪除檔案" },
    value: "https://example.com/files/%E5%A0%B1%E5%91%8A.pdf",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole("img")).toBeNull()
    await expect(canvas.getByRole("button", { name: "封面圖片，刪除檔案" })).toBeVisible()
  },
}

/**
 * The button names follow the field label when it changes later (a locale
 * switch, say) — the label text is re-read after every render, not once.
 */
export const LabelChangesLater: Story = {
  args: { value: PNG_DATA_URL },
  render: function Render(args) {
    const [en, setEn] = useState(false)
    return (
      <div className="grid gap-16">
        <Field label={en ? "Cover image" : "封面圖片"} htmlFor="cover-i18n" className="w-[44rem] max-w-full">
          <FileUpload {...args} id="cover-i18n" onChange={() => {}} onRemove={() => {}} />
        </Field>
        <div>
          <Button variant="small" theme="greenStroke" onClick={() => setEn(true)}>
            English
          </Button>
        </div>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("button", { name: "封面圖片，重新選取" })).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "English" }))
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Cover image，重新選取" })).toBeVisible(),
    )
    await expect(canvas.getByRole("button", { name: "Cover image，刪除圖片" })).toBeVisible()
  },
}
