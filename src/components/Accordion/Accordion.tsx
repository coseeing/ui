import { cn } from "../../lib/cn.js"
import { ChevronDownIcon } from "../Icons/Icons.js"

// Accordion — from Figma "Coseeing" → 捐款相關 UI 常見問題 (FAQ). Native
// <details>/<summary> so expand/collapse works without JS and stays accessible;
// the chevron rotates via the group-open variant.

export type AccordionEntry = {
  question: React.ReactNode
  answer: React.ReactNode
}

type AccordionProps = {
  items: AccordionEntry[]
  className?: string
}

export function Accordion({ items, className }: AccordionProps) {
  return (
    <div className={cn("flex w-full flex-col gap-16", className)}>
      {items.map((item, i) => (
        <details key={i} className="group w-full border-b border-teal-100 pb-16">
          <summary className="typography-headline3 flex cursor-pointer list-none items-center justify-between gap-16 px-12 py-8 text-teal-PRIMARY focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-PRIMARY [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDownIcon className="w-[2.2rem] shrink-0 text-teal-300 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="px-12 py-16 text-[1.6rem] font-medium leading-[1.5] text-teal-PRIMARY desktop:text-[2rem]">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  )
}
