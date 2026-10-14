import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Badge } from "./Badge.js"

/**
 * Badge — a read-only status marker. `brand` and `muted` are tinted pills;
 * the status tones `success`, `warning` and `danger` are outlined, so their
 * text sits on the page surface — and clears 4.5:1 on all three brand
 * surfaces (white, off-white, beige). Not Tag: a status should not look
 * pressable.
 */
const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  args: { tone: "brand", children: "志工" },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["brand", "muted", "success", "warning", "danger"],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

const TONES = [
  { tone: "brand", text: "志工" },
  { tone: "muted", text: "未驗證" },
  { tone: "success", text: "已通過" },
  { tone: "warning", text: "審核中" },
  { tone: "danger", text: "已退件" },
] as const

const SURFACES = [
  { name: "白色底", className: "bg-neutral-white" },
  { name: "米白底", className: "bg-bg-light-off-white" },
  { name: "米色底", className: "bg-bg-light-beige" },
] as const

// WCAG relative luminance and contrast, for colours as the browser computed them.
function luminance(css: string) {
  const [r, g, b] = css.match(/[\d.]+/g)!.slice(0, 3).map((v) => {
    const c = Number(v) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

/**
 * Every tone on every brand surface. axe checks this story too; the play
 * function additionally computes each ratio, so a failure says which tone on
 * which surface and by how much.
 */
export const OnEverySurface: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid gap-12">
      {SURFACES.map((s) => (
        <ul
          key={s.name}
          aria-label={s.name}
          className={`m-0 flex list-none flex-wrap gap-8 rounded-16 p-16 ${s.className}`}
        >
          {TONES.map((t) => (
            <li key={t.tone} data-tone={t.tone}>
              <Badge tone={t.tone}>{t.text}</Badge>
            </li>
          ))}
        </ul>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const surface of SURFACES) {
      const list = canvas.getByRole("list", { name: surface.name })
      const surfaceColour = getComputedStyle(list).backgroundColor
      for (const item of within(list).getAllByRole("listitem")) {
        const badge = item.firstElementChild!
        const style = getComputedStyle(badge)
        const fill = style.backgroundColor
        // Transparent (outlined) tones: the text sits on the surface.
        const behind = /rgba\(.*,\s*0\)$|transparent/.test(fill) ? surfaceColour : fill
        const ratio = contrast(style.color, behind)
        await expect(ratio, `${item.getAttribute("data-tone")} on ${surface.name}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  },
}
