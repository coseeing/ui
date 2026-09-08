import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Accordion } from "./Accordion.js"

/**
 * Accordion — from Figma「Coseeing」→ 捐款相關 UI 常見問題. Native
 * `<details>/<summary>` (keyboard + screen-reader friendly, no JS); the chevron
 * rotates when an item opens. Click the questions to expand.
 */
const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: { layout: "padded" },
  args: {
    items: [
      {
        question: "捐款給 Coseeing 可以抵稅嗎？該怎麼做？",
        answer:
          "Coseeing 為政府立案之社團法人,捐款可依法申報列舉扣除。完成捐款後,請來信提供收據抬頭與統一編號(或身分證字號),我們將開立正式捐款收據供您報稅使用。",
      },
      {
        question: "Coseeing 是否有勸募字號？",
        answer: "相關勸募字號資訊將於主管機關核准後公告於官方網站。",
      },
      {
        question: "Coseeing 如何追蹤後續資金使用情形呢？",
        answer:
          "我們每年公開年度工作報告與經費使用情形,您也可以透過電子報與社群追蹤各專案的最新進度。",
      },
    ],
  },
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

/** Click a question to expand it. */
export const Playground: Story = {
  render: (args) => (
    <div className="mx-auto max-w-[78.8rem]">
      <Accordion {...args} />
    </div>
  ),
}

/**
 * Expand and collapse, driven by the keyboard.
 *
 * `<details>/<summary>` gives this for free — Enter on a focused summary
 * toggles it with no JS. Locking that in guards against a future refactor to a
 * `<button>` + state, which would have to reimplement the keyboard behaviour
 * and the collapsed-content hiding that `<details>` handles natively.
 */
export const ExpandsAndCollapses: Story = {
  render: Playground.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = canvasElement.querySelector("details") as HTMLDetailsElement
    const summary = first.querySelector("summary")!

    // Everything starts closed, so the answers are not in the a11y tree.
    await expect(first.open).toBe(false)
    await expect(canvas.queryByText(/政府立案之社團法人/)).not.toBeVisible()

    await userEvent.click(summary)
    await expect(first.open).toBe(true)
    await expect(canvas.getByText(/政府立案之社團法人/)).toBeVisible()

    await userEvent.click(summary)
    await expect(first.open).toBe(false)
  },
}

/** Items open independently — this is an accordion, not a radio group. */
export const ItemsOpenIndependently: Story = {
  render: Playground.render,
  play: async ({ canvasElement }) => {
    const details = Array.from(
      canvasElement.querySelectorAll("details"),
    ) as HTMLDetailsElement[]
    // Click the summaries, not text matches: a question and its answer can
    // share a phrase, so getByText(/勸募字號/) is ambiguous once an item opens.
    const summaries = details.map((d) => d.querySelector("summary")!)

    await userEvent.click(summaries[0]!)
    await userEvent.click(summaries[1]!)

    await expect(details[0]!.open).toBe(true)
    await expect(details[1]!.open).toBe(true)
    await expect(details[2]!.open).toBe(false)
  },
}

/** On the beige section background, as in the donation page. */
export const OnBeige: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="bg-bg-warm-gray px-20 py-48 desktop:px-80">
      <h2 className="typography-headline2 mb-48 text-center text-teal-PRIMARY">常見問題</h2>
      <div className="mx-auto max-w-[78.8rem]">
        <Accordion {...args} />
      </div>
    </div>
  ),
}
