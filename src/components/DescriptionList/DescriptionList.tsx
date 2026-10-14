import { cn } from "../../lib/cn.js"

// DescriptionList — design-system extension (not in Figma). Field/value pairs
// for read-only detail views (帳號資料, 申請內容). Semantic <dl>, one <div>
// per pair (valid HTML, and what lets each pair be a grid row): stacked on
// mobile, two columns from tablet up with a fixed-width term column, so the
// values line up down the page. Hairline warm-gray rules, as in Table.

export type DescriptionItem = {
  term: React.ReactNode
  description: React.ReactNode
}

type DescriptionListProps = {
  items: DescriptionItem[]
  className?: string
}

export function DescriptionList({ items, className }: DescriptionListProps) {
  return (
    <dl className={cn("m-0 border-t border-bg-warm-gray", className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className="grid gap-4 border-b border-bg-warm-gray py-12 tablet:grid-cols-[16rem_minmax(0,1fr)] tablet:items-baseline tablet:gap-16"
        >
          <dt className="typography-strong2 text-teal-700">{item.term}</dt>
          <dd className="typography-body1 m-0 break-words text-teal-700">
            {item.description}
          </dd>
        </div>
      ))}
    </dl>
  )
}
