import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test"
import { Combobox, MultiCombobox, type ComboboxOption } from "./Combobox.js"
import { Field, fieldDescribedBy } from "../Field/Field.js"

/**
 * Combobox / MultiCombobox — design-system extension (not in Figma). A text
 * input that filters a listbox, for option sets too long for Select.
 *
 * APG "Combobox with listbox popup": focus stays in the input, the highlighted
 * option is tracked with `aria-activedescendant`, and nothing is selected until
 * Enter or a click. ↑/↓ move (and open); Home/End and ←/→ edit the text and
 * clear any highlight; Esc closes and a second Esc clears. Enter is ignored
 * during IME composition. A persistent live region announces the match count.
 */

const TOPICS: ComboboxOption[] = [
  { value: "wcag", label: "WCAG" },
  { value: "aria", label: "ARIA" },
  { value: "screen-reader", label: "螢幕閱讀器" },
  { value: "keyboard", label: "鍵盤操作" },
  { value: "contrast", label: "色彩對比" },
  { value: "alt-text", label: "替代文字" },
  { value: "captions", label: "字幕" },
  { value: "voice", label: "語音辨識" },
]

type MultiArgs = React.ComponentProps<typeof MultiCombobox>

/** Owns `options` and `value`, the way a real caller would. */
function MultiDemo({
  initial = [],
  error,
  ...args
}: Partial<MultiArgs> & { initial?: ComboboxOption[]; error?: string }) {
  const [options, setOptions] = useState(args.options ?? TOPICS)
  const [value, setValue] = useState(initial)
  return (
    <Field label="主題標籤" htmlFor="topics" error={error} className="w-[36rem]">
      <MultiCombobox
        {...args}
        id="topics"
        options={options}
        value={value}
        invalid={!!error}
        aria-describedby={fieldDescribedBy("topics")}
        onChange={(next) => {
          setValue(next)
          args.onChange?.(next)
        }}
        onCreate={async (label) => {
          await args.onCreate?.(label)
          const created = { value: `new:${label}`, label }
          setOptions((o) => [...o, created])
          setValue((v) => [...v, created])
        }}
      />
    </Field>
  )
}

function SingleDemo(args: Partial<React.ComponentProps<typeof Combobox>>) {
  const [value, setValue] = useState<ComboboxOption | null>(args.value ?? null)
  return (
    <Field label="主要主題" htmlFor="topic" className="w-[36rem]">
      <Combobox
        options={TOPICS}
        {...args}
        id="topic"
        value={value}
        onChange={(next) => {
          setValue(next)
          args.onChange?.(next)
        }}
      />
    </Field>
  )
}

const meta = {
  title: "Components/Combobox",
  component: MultiCombobox,
  parameters: { layout: "padded" },
  args: {
    options: TOPICS,
    value: [],
    onChange: fn(),
    onCreate: fn(),
    creatable: true,
    loading: false,
    invalid: false,
    disabled: false,
    emptyText: "找不到符合的選項",
    placeholder: "輸入關鍵字篩選",
  },
  argTypes: {
    value: { table: { disable: true } },
    options: { table: { disable: true } },
  },
  // Room for the popup, so axe and screenshots see it inside the canvas.
  decorators: [
    (Story) => (
      <div className="min-h-[40rem]">
        <Story />
      </div>
    ),
  ],
  render: (args) => <MultiDemo {...args} />,
} satisfies Meta<typeof MultiCombobox>

export default meta
type Story = StoryObj<typeof meta>

/** Multi-select with create. Type to filter; ↑/↓, Enter, Esc. */
export const Playground: Story = {}

/** Single-select: the input shows the chosen option's label. */
export const Single: Story = {
  render: (args) => (
    <SingleDemo
      onChange={args.onChange as never}
      placeholder={args.placeholder}
      disabled={args.disabled}
      loading={args.loading}
    />
  ),
}

/**
 * APG wiring, and no pre-selection: opening highlights the first option via
 * `aria-activedescendant`, but the input stays empty and nothing is
 * `aria-selected` until the user commits.
 */
export const AriaWiring: Story = {
  render: (args) => <SingleDemo onChange={args.onChange as never} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "主要主題" })

    await expect(input).toHaveAttribute("aria-expanded", "false")
    await expect(input).not.toHaveAttribute("aria-activedescendant")
    const listbox = canvas.getByRole("listbox", { hidden: true })
    await expect(input).toHaveAttribute("aria-controls", listbox.id)

    input.focus()
    await userEvent.keyboard("{ArrowDown}")

    await expect(input).toHaveAttribute("aria-expanded", "true")
    const options = canvas.getAllByRole("option")
    await expect(options).toHaveLength(TOPICS.length)
    await expect(input).toHaveAttribute("aria-activedescendant", options[0]!.id)
    await expect(options[0]).toHaveAttribute("aria-selected", "false")
    // The highlighted option is not written into the field.
    await expect(input).toHaveValue("")
    await expect(args.onChange).not.toHaveBeenCalled()
    // Named after the field label, so the popup is not an anonymous list.
    await expect(canvas.getByRole("listbox", { name: "主要主題" })).toBeVisible()
  },
}

/** Typing filters; Enter commits the highlighted option and closes. */
export const SelectsWithKeyboard: Story = {
  render: (args) => <SingleDemo onChange={args.onChange as never} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "主要主題" })

    input.focus()
    await userEvent.keyboard("文字")
    await expect(canvas.getAllByRole("option")).toHaveLength(1)
    await userEvent.keyboard("{ArrowDown}{Enter}")

    await expect(args.onChange).toHaveBeenCalledWith({ value: "alt-text", label: "替代文字" })
    await expect(input).toHaveValue("替代文字")
    await expect(input).toHaveAttribute("aria-expanded", "false")

    // Reopening shows every option again, with the committed one selected.
    await userEvent.keyboard("{ArrowDown}")
    await expect(canvas.getByRole("option", { name: "替代文字" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  },
}

/** ↑/↓ wrap, Esc closes and a second Esc clears. */
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "主題標籤" })
    const activeLabel = () =>
      document.getElementById(input.getAttribute("aria-activedescendant") ?? "")?.textContent

    input.focus()
    await userEvent.keyboard("{ArrowUp}")
    await expect(activeLabel()).toBe("語音辨識") // ↑ opens on the last option
    await userEvent.keyboard("{ArrowDown}")
    await expect(activeLabel()).toBe("WCAG") // wraps
    await userEvent.keyboard("{ArrowUp}")
    await expect(activeLabel()).toBe("語音辨識") // wraps back

    // The highlight is a teal-PRIMARY bar (10.5:1 on its beige fill); the
    // fill alone is 1.24:1 against the white popup and would fail 1.4.11.
    const active = document.getElementById(input.getAttribute("aria-activedescendant")!)!
    await expect(getComputedStyle(active).boxShadow).toContain("rgb(31, 65, 71)")
    await userEvent.keyboard("{Escape}")

    await userEvent.keyboard("ar")
    await userEvent.keyboard("{Escape}")
    await expect(input).toHaveAttribute("aria-expanded", "false")
    await expect(input).toHaveValue("ar")
    await userEvent.keyboard("{Escape}")
    await expect(input).toHaveValue("")
  },
}

/**
 * APG, editable combobox: Home/End and ←/→ are text-editing keys. With an
 * option highlighted they clear the highlight (back to the input, popup still
 * open) and move the caret — they do not jump through the list.
 */
export const EditingKeysReturnToInput: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole<HTMLInputElement>("combobox", { name: "主題標籤" })

    input.focus()
    await userEvent.keyboard("a")
    for (const [key, caret] of [
      ["{Home}", 0],
      ["{End}", 1],
      ["{ArrowLeft}", 0],
      ["{ArrowRight}", 1],
    ] as const) {
      await userEvent.keyboard("{ArrowDown}")
      await expect(input).toHaveAttribute("aria-activedescendant")
      await userEvent.keyboard(key)
      await expect(input).not.toHaveAttribute("aria-activedescendant")
      await expect(input).toHaveAttribute("aria-expanded", "true")
      await expect(input.selectionStart).toBe(caret)
    }
  },
}

/**
 * Enter during IME composition must not select or create. Composing 無障礙
 * with a Chinese input method ends with an Enter that only commits the
 * candidate — it is not the user choosing the highlighted option.
 *
 * `fireEvent` because `userEvent` cannot drive an input method. The second
 * Enter is marked composing only via the compositionstart/end pair, the path
 * Chrome and Firefox take; `isComposing` on the first is the event flag.
 */
export const ImeCompositionDoesNotCommit: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "主題標籤" })

    input.focus()
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: "無障礙" } })
    await expect(canvas.getByRole("option", { name: "新增「無障礙」" })).toBeVisible()

    fireEvent.keyDown(input, { key: "Enter", isComposing: true })
    fireEvent.keyDown(input, { key: "Enter" }) // still between start and end
    await expect(args.onCreate).not.toHaveBeenCalled()

    fireEvent.compositionEnd(input)
    await userEvent.keyboard("{ArrowDown}")
    fireEvent.compositionStart(input)
    fireEvent.keyDown(input, { key: "Enter" })
    await expect(args.onChange).not.toHaveBeenCalled()
    fireEvent.compositionEnd(input)

    // Once composition has ended, the same Enter commits.
    fireEvent.keyDown(input, { key: "Enter" })
    await waitFor(() => expect(args.onCreate).toHaveBeenCalledWith("無障礙"))
  },
}

/** The create row appears only when nothing matches the text exactly. */
export const CreatesNewOption: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "主題標籤" })

    input.focus()
    await userEvent.keyboard("wcag")
    await expect(canvas.queryByRole("option", { name: /新增/ })).toBeNull()

    await userEvent.keyboard(" 2.2")
    await userEvent.click(canvas.getByRole("option", { name: "新增「wcag 2.2」" }))

    await waitFor(() => expect(args.onCreate).toHaveBeenCalledWith("wcag 2.2"))
    await waitFor(() => expect(input).toHaveValue(""))
    await expect(canvas.getByRole("button", { name: "移除 wcag 2.2" })).toBeVisible()

    // The caller also selected it, and the notice says so. It must outlast
    // the debounced count for the now-empty query, which would otherwise
    // replace it and leave the user hearing only "9 個結果".
    const status = canvas.getByRole("status")
    await waitFor(() => expect(status).toHaveTextContent("已新增並選取「wcag 2.2」"))
    await new Promise((r) => setTimeout(r, 800))
    await expect(status).toHaveTextContent("已新增並選取「wcag 2.2」")
  },
}

/**
 * Removing a selected item moves focus to the next item's remove button, or
 * to the input when there is no next one — never to <body>.
 */
export const RemoveMovesFocus: Story = {
  render: (args) => <MultiDemo {...args} initial={TOPICS.slice(0, 3)} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("list", { name: "已選取的項目" })).toBeVisible()

    await userEvent.click(canvas.getByRole("button", { name: "移除 WCAG" }))
    await expect(args.onChange).toHaveBeenLastCalledWith(TOPICS.slice(1, 3))
    // Focus lands on the *next* item, so say which one went.
    await expect(canvas.getByRole("status")).toHaveTextContent("已移除 WCAG")
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "移除 ARIA" })).toHaveFocus(),
    )

    await userEvent.click(canvas.getByRole("button", { name: "移除 螢幕閱讀器" }))
    await waitFor(() =>
      expect(canvas.getByRole("combobox", { name: "主題標籤" })).toHaveFocus(),
    )
    await expect(canvas.queryByRole("button", { name: "移除 螢幕閱讀器" })).toBeNull()
  },
}

/** Multi-select toggles: choosing a selected option again removes it. */
export const MultiToggles: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "主題標籤" })

    input.focus()
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await expect(args.onChange).toHaveBeenLastCalledWith([TOPICS[0]])
    const status = canvas.getByRole("status")
    await expect(status).toHaveTextContent("已選取 WCAG")
    // Stays open for the next pick, and says the option is now selected.
    await expect(input).toHaveAttribute("aria-expanded", "true")
    await expect(canvas.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true")
    await expect(canvas.getByRole("option", { name: "WCAG" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    await userEvent.keyboard("{Enter}")
    await expect(args.onChange).toHaveBeenLastCalledWith([])
    await expect(status).toHaveTextContent("已取消選取 WCAG")

    // Typing again hands the region back to the result count, without
    // re-reading the stale notice or the count from before it.
    await userEvent.keyboard("ar")
    await expect(status).toHaveTextContent("")
    await waitFor(() => expect(status).toHaveTextContent("1 個結果"))
  },
}

/**
 * The live region is mounted before anything is typed and announces the match
 * count, then `emptyText`, once typing pauses.
 *
 * Debounced on purpose. Updated on every keystroke, VoiceOver read stale
 * text: it speaks the typed character first, and by the time it reached the
 * region it announced the previous query's count — "2 個結果" for a query
 * that matched nothing.
 */
export const AnnouncesResultCount: Story = {
  args: { creatable: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const status = canvas.getByRole("status")
    await expect(status).toHaveTextContent("")

    const input = canvas.getByRole("combobox", { name: "主題標籤" })
    input.focus()
    await userEvent.keyboard("a")
    // Not yet: the intermediate count must never reach the region.
    await expect(status).toHaveTextContent("")
    await userEvent.keyboard("zz")
    await expect(status).toHaveTextContent("")
    await waitFor(() => expect(status).toHaveTextContent("找不到符合的選項"))
    await expect(input).toHaveAttribute("aria-expanded", "false")

    await userEvent.keyboard("{Backspace}{Backspace}")
    await waitFor(() => expect(status).toHaveTextContent("2 個結果")) // WCAG, ARIA
  },
}

/**
 * Nothing is announced while an IME composition is in progress — the text is
 * still 注音 (ㄨˊ) and matches nothing yet. The count follows compositionend.
 * `fireEvent` because `userEvent` cannot drive an input method.
 */
export const NoAnnouncementWhileComposing: Story = {
  args: { creatable: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const status = canvas.getByRole("status")
    const input = canvas.getByRole("combobox", { name: "主題標籤" })

    input.focus()
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: "ㄗˋ" } })
    // Well past the debounce: still silent.
    await new Promise((r) => setTimeout(r, 800))
    await expect(status).toHaveTextContent("")

    fireEvent.change(input, { target: { value: "字" } })
    fireEvent.compositionEnd(input)
    await waitFor(() => expect(status).toHaveTextContent("2 個結果")) // 字幕, 替代文字
  },
}

/** `loading` shows and announces the loading text. */
export const Loading: Story = {
  args: { loading: true, options: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByRole("combobox", { name: "主題標籤" }).focus()
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("載入中"))
  },
}

/** Inside Field: `invalid` sets aria-invalid; the error is the description. */
export const InvalidInField: Story = {
  render: (args) => <MultiDemo {...args} error="請至少選擇一個主題" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "主題標籤" })
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(input).toHaveAccessibleDescription("請至少選擇一個主題")
  },
}
