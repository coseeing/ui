import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  CurveDoodleIcon,
  DotDividerIcon,
  FacebookIcon,
  LinkedinIcon,
  MenuIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  StopIcon,
} from "./Icons.js"

/**
 * Icons — glyphs inlined verbatim from the Figma "Coseeing" → Elements exports,
 * with fills converted to `currentColor` so one component serves every theme
 * (set the color via a `text-*` class on the icon or its parent).
 */
const meta: Meta = {
  title: "Components/Icons",
  parameters: { layout: "padded" },
}
export default meta
type Story = StoryObj

const ICONS = [
  { name: "ArrowLeftIcon", el: <ArrowLeftIcon /> },
  { name: "ArrowRightIcon", el: <ArrowRightIcon /> },
  { name: "PlayIcon", el: <PlayIcon /> },
  { name: "StopIcon", el: <StopIcon /> },
  { name: "MenuIcon", el: <MenuIcon /> },
  { name: "ChevronDownIcon", el: <ChevronDownIcon /> },
  { name: "SearchIcon", el: <SearchIcon /> },
  { name: "PlusIcon", el: <PlusIcon /> },
  { name: "CurveDoodleIcon", el: <CurveDoodleIcon className="text-orange-PRIMARY" /> },
  { name: "LinkedinIcon", el: <LinkedinIcon /> },
  { name: "FacebookIcon", el: <FacebookIcon /> },
  { name: "DotDividerIcon", el: <DotDividerIcon /> },
]

/** Every icon at natural size, in teal-PRIMARY. */
export const Overview: Story = {
  render: () => (
    <div className="flex flex-wrap gap-16">
      {ICONS.map((i) => (
        <div
          key={i.name}
          className="flex min-w-[12rem] flex-col items-center justify-center gap-12 rounded-16 border border-bg-warm-gray bg-neutral-white p-20 text-teal-PRIMARY"
        >
          <div className="flex h-40 items-center">{i.el}</div>
          <code className="typography-body3 text-neutral-dark-gray">{i.name}</code>
        </div>
      ))}
    </div>
  ),
}

/** The same glyphs recolored purely via text color (currentColor). */
export const Themed: Story = {
  render: () => (
    <div className="flex flex-col gap-16">
      <div className="flex items-center gap-24 rounded-16 bg-bg-light-off-white p-20 text-teal-PRIMARY">
        <ArrowLeftIcon /> <PlayIcon /> <StopIcon /> <ArrowRightIcon />
      </div>
      <div className="flex items-center gap-24 rounded-16 bg-teal-PRIMARY p-20 text-orange-100">
        <ArrowLeftIcon /> <PlayIcon /> <StopIcon /> <ArrowRightIcon />
      </div>
    </div>
  ),
}
