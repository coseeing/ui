import { cn } from "../../lib/cn.js"

// Table — from Figma "Coseeing" → 芳名錄 Event list. White rounded panel with a
// bold header row, hairline divider, and plain body rows. Semantic <table> for
// screen readers; wide content scrolls inside the panel.

export type TableColumn = {
  key: string
  label: React.ReactNode
  /** Fixed column width (e.g. "9.6rem"); omit for a fluid column. */
  width?: string
}

type TableProps = {
  columns: TableColumn[]
  rows: Record<string, React.ReactNode>[]
  className?: string
}

export function Table({ columns, rows, className }: TableProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-[1.2rem] border border-neutral-light-gray bg-neutral-white px-20 py-16 desktop:px-32 desktop:py-24",
        className,
      )}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-neutral-light-gray">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className="typography-strong1 h-[4rem] pr-40 text-left align-middle text-teal-700 last:pr-0"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col, c) => (
                <td
                  key={col.key}
                  className={cn(
                    "typography-body2 h-[3.8rem] pr-40 align-middle last:pr-0",
                    c === 0 ? "text-teal-500" : "text-teal-700",
                  )}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
