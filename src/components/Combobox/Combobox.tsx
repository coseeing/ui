"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { LiveRegion, useAnnouncer } from "../LiveRegion/LiveRegion.js"
import { cn } from "../../lib/cn.js"
import { ChevronDownIcon, PlusIcon } from "../Icons/Icons.js"

// Combobox / MultiCombobox — design-system extension (not in Figma). A text
// input that filters a listbox, for option sets too long for Select. The input
// shell matches Input; the popup is a white rounded-8 panel like the field it
// hangs from.
//
// WAI-ARIA APG "Combobox with listbox popup", list autocomplete without
// automatic selection: DOM focus never leaves the input, the highlighted option
// is conveyed with aria-activedescendant, and nothing is selected until the
// user commits with Enter or a click. In particular the first match is NOT
// written into the input — a pre-filled value reads as an existing choice.
//
// Enter is ignored while an IME composition is in progress. Chinese, Japanese
// and Korean input methods commit a candidate with Enter, and that keystroke
// still reaches keydown; treating it as "select" would pick whatever option
// happened to be highlighted halfway through typing a word.

export type ComboboxOption = { value: string; label: string }

/** Every user-facing string, overridable to match the host app's locale. */
/**
 * Every user-facing string, overridable to match the host app's locale. The
 * same scheme as FileUploadLabels and ReorderableListLabels: plain keys for
 * shown text, functions where an item's name is part of it, past participles
 * (selected, removed…) for what is announced after an action.
 */
export type ComboboxLabels = {
  /** Shown and announced while `loading`. */
  loading: string
  /** Shown and announced when nothing matches. */
  empty: string
  /** Announced as the filtered match count changes. */
  results: (count: number) => string
  /** The extra "create" row when `creatable`. */
  create: (label: string) => string
  /** Accessible name of a selected item's remove button (multi only). */
  remove: (label: string) => string
  /** Accessible name of the selected-items list (multi only). */
  selectedList: string
  /** Announced after an option is chosen. */
  selected: (label: string) => string
  /** Announced after a selected option is chosen again (multi only). */
  deselected: (label: string) => string
  /** Announced after a selected item's remove button (multi only). */
  removed: (label: string) => string
  /** Announced after `onCreate` resolves, when the caller did not select it. */
  created: (label: string) => string
  /** Announced after `onCreate` resolves and the new option is in `value`. */
  createdAndSelected: (label: string) => string
}

const DEFAULT_LABELS: ComboboxLabels = {
  loading: "載入中",
  empty: "找不到符合的選項",
  results: (count) => `${count} 個結果`,
  create: (label) => `新增「${label}」`,
  remove: (label) => `移除 ${label}`,
  selectedList: "已選取的項目",
  selected: (label) => `已選取 ${label}`,
  deselected: (label) => `已取消選取 ${label}`,
  removed: (label) => `已移除 ${label}`,
  created: (label) => `已新增「${label}」`,
  createdAndSelected: (label) => `已新增並選取「${label}」`,
}

/**
 * One live region (LiveRegion: always mounted, text cleared after a few
 * seconds) carrying two kinds of message:
 *
 * - Action notices — 已選取 WCAG, 已移除 WCAG. Without them a screen reader
 *   user hears nothing after Enter and cannot tell the action happened. A
 *   notice holds the region until the user types again: the action usually
 *   clears the query, and the count for that empty query would otherwise
 *   replace the notice half a second later.
 * - The result count, debounced by the caller; skipped while a notice holds.
 */
function useComboboxAnnouncer() {
  const { message, say, clear } = useAnnouncer()
  const held = useRef(false)
  return {
    message,
    notice: useCallback(
      (text: string) => {
        held.current = true
        say(text)
      },
      [say],
    ),
    count: useCallback((text: string) => !held.current && say(text), [say]),
    clearCount: useCallback(() => !held.current && clear(), [clear]),
    /** The user typed: release the hold and drop whatever was said. */
    release: useCallback(() => {
      held.current = false
      clear()
    }, [clear]),
  }
}

type ComboboxAnnouncer = ReturnType<typeof useComboboxAnnouncer>

/**
 * After `onCreate` resolves, checks whether the caller also put the new option
 * into `value` — the component cannot know — and announces accordingly.
 */
function useCreatedNotice(
  isPicked: (label: string) => boolean,
  say: (text: string) => void,
  l: ComboboxLabels,
) {
  const [created, setCreated] = useState<{ label: string } | null>(null)
  useEffect(() => {
    if (!created) return
    say(
      isPicked(created.label)
        ? l.createdAndSelected(created.label)
        : l.created(created.label),
    )
    setCreated(null)
    // Keyed on `created` alone: one check per creation, against the render
    // that follows it, by which point the caller's state updates have landed.
  }, [created])
  return (label: string) => setCreated({ label })
}

type SharedProps = {
  /** id of the input — pair it with `<Field htmlFor>` / `<Label htmlFor>`. */
  id?: string
  options: ComboboxOption[]
  /** Offer a "create" row when the typed text matches no option label. */
  creatable?: boolean
  /**
   * Called with the trimmed text when the create row is chosen. Adding the new
   * option to `options` and `value` is the caller's job — it usually needs a
   * server id first. The input clears once this returns or its promise
   * resolves; on rejection the text stays so the user can retry.
   */
  onCreate?: (label: string) => Promise<void> | void
  loading?: boolean
  labels?: Partial<ComboboxLabels>
  /**
   * Match rule; defaults to a case-insensitive substring match on `label`.
   * Pass `() => true` when `options` is already filtered server-side.
   */
  filter?: (option: ComboboxOption, query: string) => boolean
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  /**
   * Submit the selection with a native <form>: a hidden input carrying the
   * selected option's `value` — one per option for MultiCombobox, the way a
   * multiple <select> submits. The visible input is never submitted; its text
   * is only the filter.
   */
  name?: string
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  className?: string
}

export type ComboboxProps = SharedProps & {
  value: ComboboxOption | null
  onChange: (value: ComboboxOption | null) => void
}

export type MultiComboboxProps = SharedProps & {
  value: ComboboxOption[]
  onChange: (value: ComboboxOption[]) => void
}

const inputStyles =
  "typography-body1 block w-full rounded-8 border border-bg-warm-gray bg-neutral-white py-8 pl-16 pr-40 text-teal-700 transition-colors placeholder:text-neutral-dark-gray hover:border-teal-100 focus:border-teal-PRIMARY focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-teal-PRIMARY"

const invalidStyles =
  "border-red-PRIMARY focus:border-red-PRIMARY focus-visible:ring-red-PRIMARY"

/** Quiet period before the result count is announced, in ms. */
const ANNOUNCE_DELAY = 500

const defaultFilter = (option: ComboboxOption, query: string) =>
  option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())

const sameLabel = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase()

type Row =
  | { kind: "option"; option: ComboboxOption }
  | { kind: "create"; label: string }

type BaseProps = Omit<SharedProps, "className"> & {
  className?: string
  multiple: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  /** What the input displays. */
  inputValue: string
  /** What the options are filtered by; "" shows every option. */
  query: string
  onQueryChange: (query: string) => void
  isSelected: (option: ComboboxOption) => boolean
  onSelect: (option: ComboboxOption) => void
  onCreated: (label: string) => void
  announcer: ComboboxAnnouncer
  /** Escape with the popup already closed. */
  onClear: () => void
  /** Focus left the combobox. */
  onLeave: () => void
}

function ComboboxBase({
  id,
  options,
  creatable,
  onCreate,
  loading,
  labels,
  filter = defaultFilter,
  invalid,
  disabled,
  placeholder,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  onFocus,
  onBlur,
  className,
  multiple,
  inputRef,
  inputValue,
  query,
  onQueryChange,
  isSelected,
  onSelect,
  onCreated,
  announcer,
  onClear,
  onLeave,
}: BaseProps) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const generatedId = useId()
  const inputId = id ?? generatedId
  const listboxId = `${inputId}-listbox`
  const optionId = (i: number) => `${inputId}-option-${i}`

  const rootRef = useRef<HTMLDivElement>(null)
  const composingRef = useRef(false)
  // State as well as the ref: the announcement effect must re-run when a
  // composition ends.
  const [composing, setComposing] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [creating, setCreating] = useState(false)

  // The listbox needs its own accessible name (axe: aria-input-field-name).
  // Explicit aria-label / aria-labelledby are forwarded; otherwise borrow the
  // text of the <label> the input is paired with, e.g. via Field. Re-read
  // after every render (state set only on a change), so a label that changes
  // later — a locale switch — does not leave the listbox with a stale name.
  const [labelText, setLabelText] = useState<string>()
  useEffect(() => {
    const text = inputRef.current?.labels?.[0]?.textContent ?? undefined
    if (text !== labelText) setLabelText(text)
  })

  const trimmed = query.trim()
  const matches = useMemo(
    () => (trimmed ? options.filter((o) => filter(o, trimmed)) : options),
    [options, filter, trimmed],
  )
  const canCreate =
    !!creatable && trimmed !== "" && !options.some((o) => sameLabel(o.label, trimmed))
  const rows: Row[] = [
    ...matches.map((option): Row => ({ kind: "option", option })),
    ...(canCreate ? [{ kind: "create", label: trimmed } as const] : []),
  ]

  // An empty listbox is not shown; the popup shows the empty/loading message
  // instead, so aria-expanded only claims what is actually there.
  const expanded = open && rows.length > 0
  const activeIndex = expanded && active < rows.length ? active : -1

  useEffect(() => {
    if (activeIndex < 0) return
    document
      .getElementById(`${inputId}-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" })
  }, [activeIndex, inputId])

  const close = () => {
    setOpen(false)
    setActive(-1)
  }

  const create = (label: string) => {
    if (!onCreate || creating) return
    setCreating(true)
    Promise.resolve()
      .then(() => onCreate(label))
      .then(() => {
        setActive(-1)
        if (!multiple) setOpen(false)
        onCreated(label)
      })
      // The caller owns error reporting (e.g. Field `error` + `invalid`); the
      // text is left in place so the user can correct it and try again.
      .catch(() => {})
      .finally(() => setCreating(false))
  }

  const choose = (row: Row) => {
    if (row.kind === "create") return create(row.label)
    onSelect(row.option)
    if (!multiple) close()
    else if (trimmed) setActive(-1) // the caller clears the query, so the rows change
  }

  const move = (delta: 1 | -1) => {
    const count = rows.length
    if (!expanded) {
      setOpen(true)
      setActive(count === 0 ? -1 : delta > 0 ? 0 : count - 1)
      return
    }
    setActive(
      activeIndex < 0
        ? delta > 0 ? 0 : count - 1
        : (activeIndex + delta + count) % count,
    )
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // keyCode 229 covers Safari, which fires compositionend *before* the
    // keydown of the Enter that commits the candidate.
    if (e.nativeEvent.isComposing || composingRef.current || e.keyCode === 229) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        // Alt+↓ opens without moving into the list (APG).
        if (e.altKey) setOpen(true)
        else move(1)
        break
      case "ArrowUp":
        e.preventDefault()
        move(-1)
        break
      case "Home":
      case "End":
      case "ArrowLeft":
      case "ArrowRight":
        // APG, editable combobox: these are text-editing keys. With an
        // option highlighted they hand "focus" back to the input — the
        // highlight clears, the popup stays open — and the caret moves as
        // it normally would, so no preventDefault.
        if (activeIndex >= 0) setActive(-1)
        break
      case "Enter": {
        if (!open) break
        const row =
          activeIndex >= 0
            ? rows[activeIndex]
            : rows.find((r) => r.kind === "option" && sameLabel(r.option.label, trimmed)) ??
              rows.find((r) => r.kind === "create")
        if (row) {
          e.preventDefault()
          choose(row)
        }
        break
      }
      case "Escape":
        if (open) {
          e.preventDefault()
          close()
        } else if (inputValue !== "") {
          e.preventDefault()
          onClear()
        }
        break
    }
  }

  let status = ""
  if (open) {
    status = loading
      ? l.loading
      : matches.length === 0
        ? l.empty
        : l.results(matches.length)
  }
  const message = open && (loading || matches.length === 0) ? status : ""

  // The count is announced once input settles. Updating it on every keystroke
  // made VoiceOver read stale counts: it speaks the typed character first, so
  // by the time it reached the region the text had moved on, and it would say
  // "2 個結果" for a query that now matched nothing. Never mid-composition
  // either, when the text is still 注音 like ㄨˊ.
  const { count, clearCount } = announcer
  useEffect(() => {
    if (!status) {
      clearCount()
      return
    }
    if (composing) return
    const timer = setTimeout(() => count(status), ANNOUNCE_DELAY)
    return () => clearTimeout(timer)
  }, [status, composing, count, clearCount])

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full", className)}
      onBlur={(e) => {
        if (rootRef.current?.contains(e.relatedTarget as Node | null)) return
        close()
        onLeave()
      }}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          // Drop the last notice or count, and let counts through again.
          announcer.release()
          onQueryChange(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        // Opens, never toggles: a click inside the text is usually placing
        // the caret mid-filter, and closing the results then was jarring.
        // Esc or a click outside closes.
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onCompositionStart={() => {
          composingRef.current = true
          setComposing(true)
        }}
        onCompositionEnd={() => {
          composingRef.current = false
          setComposing(false)
        }}
        className={cn(inputStyles, invalid && invalidStyles)}
      />
      <ChevronDownIcon
        className={cn(
          "pointer-events-none absolute right-16 top-[1.8rem] w-[1.4rem] text-teal-300 transition-transform motion-reduce:transition-none",
          open && "rotate-180",
        )}
      />

      <div
        className={cn(
          "absolute inset-x-0 top-full z-10 mt-4 overflow-hidden rounded-8 border border-bg-warm-gray bg-neutral-white shadow-[0_0.8rem_2.4rem_rgb(16_36_42_/_0.16)]",
          !open && "hidden",
        )}
      >
        <ul
          role="listbox"
          id={listboxId}
          aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labelText)}
          aria-labelledby={ariaLabelledBy}
          aria-multiselectable={multiple || undefined}
          aria-busy={loading || undefined}
          hidden={!expanded}
          // Keep DOM focus in the input when an option is clicked.
          onMouseDown={(e) => e.preventDefault()}
          className="m-0 max-h-[28rem] list-none overflow-y-auto p-0 py-4"
        >
          {rows.map((row, i) => {
            const selected = row.kind === "option" && isSelected(row.option)
            return (
              <li
                key={row.kind === "option" ? `o:${row.option.value}` : "create"}
                id={optionId(i)}
                role="option"
                aria-selected={selected}
                aria-disabled={(row.kind === "create" && creating) || undefined}
                onClick={() => choose(row)}
                className={cn(
                  "flex cursor-pointer items-center gap-8 px-16 py-8 text-teal-700 hover:bg-bg-light-off-white",
                  selected ? "typography-strong1" : "typography-body1",
                  i === activeIndex &&
                    // teal-PRIMARY bar: 10.5:1 on beige, so the highlight
                    // clears 3:1 (WCAG 1.4.11) without relying on the fill
                    // (1.24:1). Forced colors drops shadows and fills, so the
                    // option also gets a real outline there — it never holds
                    // DOM focus, so nothing else would mark it.
                    "bg-bg-light-beige shadow-[inset_0.4rem_0_0_var(--color-teal-PRIMARY)] hover:bg-bg-light-beige forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-solid",
                )}
              >
                {row.kind === "create" ? (
                  <>
                    <PlusIcon className="size-16 shrink-0" />
                    <span>{l.create(row.label)}</span>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1">{row.option.label}</span>
                    {selected ? <CheckMark /> : null}
                  </>
                )}
              </li>
            )
          })}
        </ul>
        {message ? (
          <p className="typography-body2 m-0 px-16 py-8 text-neutral-dark-gray">{message}</p>
        ) : null}
      </div>

      <LiveRegion message={announcer.message} />
    </div>
  )
}

/** Selected-option tick. Not a brand icon; drawn here to match PlusIcon. */
function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-16 shrink-0 text-teal-PRIMARY">
      <path
        d="M5 12.5L10 17.5L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Single-select combobox. `value` is one option or null. */
export function Combobox({ value, onChange, name, ...props }: ComboboxProps) {
  const l = { ...DEFAULT_LABELS, ...props.labels }
  const inputRef = useRef<HTMLInputElement>(null)
  const announcer = useComboboxAnnouncer()
  const announceCreated = useCreatedNotice(
    (label) => !!value && sameLabel(value.label, label),
    announcer.notice,
    l,
  )
  const [query, setQuery] = useState("")
  // While editing, the input shows what the user typed; otherwise it mirrors
  // the committed value.
  const [editing, setEditing] = useState(false)

  const reset = () => {
    setEditing(false)
    setQuery("")
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={value?.value ?? ""} /> : null}
      <ComboboxBase
        {...props}
        multiple={false}
        inputRef={inputRef}
        inputValue={editing ? query : (value?.label ?? "")}
        query={editing ? query : ""}
        onQueryChange={(q) => {
          setQuery(q)
          setEditing(true)
        }}
        isSelected={(o) => o.value === value?.value}
        onSelect={(o) => {
          onChange(o)
          reset()
          announcer.notice(l.selected(o.label))
        }}
        onCreated={(label) => {
          reset()
          announceCreated(label)
        }}
        announcer={announcer}
        onClear={() => {
          reset()
          if (value) onChange(null)
        }}
        onLeave={() => {
          // Typed text that was never committed is discarded — except an input
          // the user deliberately emptied, which means "no value".
          if (editing && query.trim() === "" && value) onChange(null)
          reset()
        }}
      />
    </>
  )
}

/**
 * Multi-select combobox. Selected options are listed above the input, each
 * with its own remove button; choosing a selected option again deselects it.
 */
export function MultiCombobox({
  value,
  onChange,
  className,
  labels,
  disabled,
  name,
  ...props
}: MultiComboboxProps) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const inputRef = useRef<HTMLInputElement>(null)
  const removeRefs = useRef(new Map<string, HTMLButtonElement>())
  const [query, setQuery] = useState("")
  const announcer = useComboboxAnnouncer()
  const announceCreated = useCreatedNotice(
    (label) => value.some((o) => sameLabel(o.label, label)),
    announcer.notice,
    l,
  )

  // After a removal, focus goes to the next item's remove button, or back to
  // the input when the last one went. Applied once the new `value` renders.
  // undefined = nothing pending, null = the input.
  const pendingFocus = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    const target = pendingFocus.current
    if (target === undefined) return
    pendingFocus.current = undefined
    ;(target === null ? inputRef.current : removeRefs.current.get(target))?.focus()
  }, [value])

  const selected = new Set(value.map((o) => o.value))

  const remove = (index: number) => {
    pendingFocus.current = value[index + 1]?.value ?? null
    onChange(value.filter((_, i) => i !== index))
    announcer.notice(l.removed(value[index]!.label))
  }

  return (
    <div className={cn("grid w-full gap-8", className)}>
      {name
        ? value.map((o) => <input key={o.value} type="hidden" name={name} value={o.value} />)
        : null}
      {value.length > 0 ? (
        <ul aria-label={l.selectedList} className="m-0 flex list-none flex-wrap gap-8 p-0">
          {value.map((option, i) => (
            <li
              key={option.value}
              className="typography-body2 inline-flex items-center gap-4 rounded-[6rem] bg-orange-100 py-4 pl-12 pr-4 text-teal-700"
            >
              {option.label}
              <button
                type="button"
                ref={(el) => {
                  if (el) removeRefs.current.set(option.value, el)
                  else removeRefs.current.delete(option.value)
                }}
                aria-label={l.remove(option.label)}
                disabled={disabled}
                onClick={() => remove(i)}
                className="flex size-24 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-teal-700 transition-colors hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-teal-PRIMARY"
              >
                <PlusIcon className="size-16 rotate-45" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <ComboboxBase
        {...props}
        labels={labels}
        disabled={disabled}
        multiple
        inputRef={inputRef}
        inputValue={query}
        query={query}
        onQueryChange={setQuery}
        isSelected={(o) => selected.has(o.value)}
        onSelect={(o) => {
          const was = selected.has(o.value)
          onChange(was ? value.filter((v) => v.value !== o.value) : [...value, o])
          setQuery("")
          announcer.notice(was ? l.deselected(o.label) : l.selected(o.label))
        }}
        onCreated={(label) => {
          setQuery("")
          announceCreated(label)
        }}
        announcer={announcer}
        onClear={() => setQuery("")}
        onLeave={() => setQuery("")}
      />
    </div>
  )
}
