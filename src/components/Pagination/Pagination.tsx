import { cn } from "../../lib/cn.js"
import { ChevronDownIcon } from "../Icons/Icons.js"
import { Link, type AnchorLike } from "../Link/Link.js"

// Pagination — design-system extension (not in Figma). Square page buttons in
// the Tabs/Dialog idiom (rounded-8, teal label, beige hover); the current page
// is a solid teal fill so it reads at a glance without relying on colour alone
// (it is also the only one with aria-current).
//
// No hooks and no "use client": in link mode (`href`) it renders on the
// server, which is the only way an `href={(page) => …}` function can reach it
// from a Server Component. Button mode (`onPageChange`) is client-only by
// nature, and attaches its handlers only then.
//
// At the ends, previous/next must stop working without dropping focus — the
// user may have just pressed "下一頁" to reach the last page. Focus is lost
// when the focused element is replaced *or* disabled, so:
//
// - Button mode: they are really `disabled`, and the click that reaches an end
//   hands focus to the now-current page button first.
// - Link mode: they stay the same <a> and become aria-disabled, pointing at
//   the current page. A disabled <button> in their place would be a different
//   element, and with client-side routing (the page re-renders in place) focus
//   on "下一頁" would fall to <body>. Swapping to a <button> throughout would
//   not help either — it would still be disabled at the end, and could not
//   navigate without script. Pointer clicks are off; Enter re-requests the
//   page you are on.

export type PaginationLabels = {
  previous: string
  next: string
  /** Accessible name of a page button; the visible text is just the number. */
  page: (page: number) => string
  /** Visible and announced, e.g. 第 2／10 頁，共 195 筆. */
  status: (page: number, pageCount: number, total?: number) => string
}

const DEFAULT_LABELS: PaginationLabels = {
  previous: "上一頁",
  next: "下一頁",
  page: (page) => `第 ${page} 頁`,
  status: (page, pageCount, total) =>
    total === undefined
      ? `第 ${page}／${pageCount} 頁`
      : `第 ${page}／${pageCount} 頁，共 ${total} 筆`,
}

type PaginationProps = {
  /** 1-based. */
  page: number
  pageCount: number
  /** Button mode. Also called in link mode, before navigation, if given. */
  onPageChange?: (page: number) => void
  /** Item count, for the status line. */
  total?: number
  /** Accessible name of the <nav>. */
  label?: string
  /** Link mode: the URL for a page. */
  href?: (page: number) => string
  /** Link mode: the app's router link. Defaults to a plain <a>. */
  as?: "a" | AnchorLike
  /** Pages shown either side of the current one before an ellipsis. */
  siblingCount?: number
  labels?: Partial<PaginationLabels>
  className?: string
}

const ELLIPSIS = "ellipsis" as const

/**
 * Page numbers to render. The slot count is fixed (first, last, current ±
 * siblings, two ellipses) once there are enough pages, so the control does
 * not change width as the user pages through.
 */
function pageItems(
  page: number,
  pageCount: number,
  siblingCount = 1,
): (number | typeof ELLIPSIS)[] {
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i)
  const slots = siblingCount * 2 + 5
  if (pageCount <= slots) return range(1, pageCount)

  const left = Math.max(page - siblingCount, 1)
  const right = Math.min(page + siblingCount, pageCount)
  const leftGap = left > 3
  const rightGap = right < pageCount - 2
  const edge = siblingCount * 2 + 3

  if (!leftGap) return [...range(1, edge), ELLIPSIS, pageCount]
  if (!rightGap) return [1, ELLIPSIS, ...range(pageCount - edge + 1, pageCount)]
  return [1, ELLIPSIS, ...range(left, right), ELLIPSIS, pageCount]
}

const itemStyles =
  "typography-strong2 inline-flex min-w-32 items-center justify-center gap-4 rounded-8 border-0 px-8 py-8 tablet:min-w-40 tablet:px-12 no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-PRIMARY"
// Below tablet, previous/next go icon-only so ten pages fit a 375px row
// without wrapping; the text stays as their accessible name.
const stepTextStyles = "sr-only tablet:not-sr-only"
const idleStyles = "cursor-pointer bg-transparent text-teal-700 hover:bg-bg-light-beige"
const currentStyles = "bg-teal-PRIMARY text-neutral-white"
const disabledStyles =
  "cursor-not-allowed bg-transparent text-teal-700 opacity-40 [&[aria-disabled]]:pointer-events-none"

export function Pagination({
  page: rawPage,
  pageCount: rawCount,
  onPageChange,
  total,
  label = "分頁",
  href,
  as,
  siblingCount = 1,
  labels,
  className,
}: PaginationProps) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const pageCount = Math.max(1, Math.floor(rawCount))
  const page = Math.min(Math.max(1, Math.floor(rawPage)), pageCount)

  const go = (target: number) =>
    onPageChange
      ? (e: React.MouseEvent<HTMLElement>) => {
          if (target === page) return
          // Previous/next become disabled at the ends, and a focused element
          // that turns disabled drops focus to <body>. Hand it to the page
          // that is now current instead — the control the user just reached.
          const nav = e.currentTarget.closest("nav")
          const willDisable =
            e.currentTarget.dataset.step !== undefined &&
            (target === 1 || target === pageCount)
          onPageChange(target)
          if (nav && willDisable) {
            requestAnimationFrame(() =>
              nav.querySelector<HTMLElement>(`[data-page="${target}"]`)?.focus(),
            )
          }
        }
      : undefined

  const control = ({
    target,
    current,
    disabled,
    step,
    ariaLabel,
    children,
  }: {
    target: number
    current?: boolean
    disabled?: boolean
    step?: "previous" | "next"
    ariaLabel?: string
    children: React.ReactNode
  }) => {
    const shared = {
      "aria-label": ariaLabel,
      "data-page": step ? undefined : target,
      "data-step": step,
      className: cn(
        itemStyles,
        disabled ? disabledStyles : current ? currentStyles : idleStyles,
      ),
    }
    if (href) {
      return (
        <Link
          {...shared}
          href={href(disabled ? page : target)}
          current={current}
          aria-disabled={disabled || undefined}
          {...(as ? { as } : {})}
          // Handlers only where script runs (onPageChange given); on the
          // server, pointer-events-none keeps the disabled link inert enough.
          onClick={
            disabled
              ? onPageChange
                ? (e: React.MouseEvent) => e.preventDefault()
                : undefined
              : go(target)
          }
        >
          {children}
        </Link>
      )
    }
    return (
      <button
        type="button"
        {...shared}
        disabled={disabled}
        aria-current={current ? "page" : undefined}
        onClick={disabled ? undefined : go(target)}
      >
        {children}
      </button>
    )
  }

  return (
    <nav aria-label={label} className={cn("grid justify-items-center gap-8", className)}>
      <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-4 p-0">
        <li>
          {control({
            target: page - 1,
            disabled: page <= 1,
            step: "previous",
            children: (
              <>
                <ChevronDownIcon className="w-[1.2rem] rotate-90" />
                <span className={stepTextStyles}>{l.previous}</span>
              </>
            ),
          })}
        </li>
        {pageItems(page, pageCount, siblingCount).map((item, i) =>
          item === ELLIPSIS ? (
            <li
              key={`e${i}`}
              aria-hidden="true"
              className="typography-strong2 min-w-24 text-center text-neutral-dark-gray"
            >
              …
            </li>
          ) : (
            <li key={item}>
              {control({
                target: item,
                current: item === page,
                ariaLabel: l.page(item),
                children: item,
              })}
            </li>
          ),
        )}
        <li>
          {control({
            target: page + 1,
            disabled: page >= pageCount,
            step: "next",
            children: (
              <>
                <span className={stepTextStyles}>{l.next}</span>
                <ChevronDownIcon className="w-[1.2rem] -rotate-90" />
              </>
            ),
          })}
        </li>
      </ul>
      {/* Visible, and a live region: a page change re-renders this text in
          place, so it is announced without the region being re-inserted. */}
      <p role="status" className="typography-body2 m-0 text-neutral-dark-gray">
        {l.status(page, pageCount, total)}
      </p>
    </nav>
  )
}
