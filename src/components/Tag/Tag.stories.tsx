import type { Meta, StoryObj } from "@storybook/react-vite"
import { Tag } from "./Tag.js"

/**
 * Tag — orange pill from the Figma「Coseeing」ProjectCard. Used for project
 * feature labels; see **Components/ProjectCard** for it in context.
 */
const meta = {
  title: "Components/Tag",
  component: Tag,
  parameters: { layout: "centered" },
  args: { children: "新手友善" },
  argTypes: { children: { control: "text" } },
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Tags flow inline and wrap, as on the project cards. */
export const Group: Story = {
  render: () => (
    <div className="flex max-w-[32rem] flex-wrap gap-8">
      <Tag>新手友善</Tag>
      <Tag>多元專業</Tag>
      <Tag>溫暖訪談</Tag>
      <Tag>明盲之間共融互動</Tag>
      <Tag>運用 AI 科技</Tag>
    </div>
  ),
}
