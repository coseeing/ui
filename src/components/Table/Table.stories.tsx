import type { Meta, StoryObj } from "@storybook/react-vite"
import { Table } from "./Table.js"

/**
 * Table — from Figma「Coseeing」→ 芳名錄 donor list. White rounded panel with a
 * bold header row; semantic `<table>` markup, horizontally scrollable when
 * narrow. See **Components/FilterPills** for the matching sidebar filter.
 */
const meta = {
  title: "Components/Table",
  component: Table,
  parameters: { layout: "padded" },
  args: {
    columns: [
      { key: "date", label: "時間", width: "9.6rem" },
      { key: "donor", label: "捐款人" },
      { key: "amount", label: "金額", width: "9.6rem" },
    ],
    rows: [
      { date: "2025/08/29", donor: "王○明", amount: "1000" },
      { date: "2025/07/20", donor: "李○華", amount: "600" },
      { date: "2025/06/12", donor: "陳○同", amount: "480" },
      { date: "2025/05/03", donor: "林○芳", amount: "1200" },
      { date: "2025/04/18", donor: "張○維", amount: "800" },
    ],
  },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[80rem]">
      <Table {...args} />
    </div>
  ),
}
