"use client"

import { useEffect, useId, useRef, useState } from "react"
import { LiveRegion, useAnnouncer } from "../LiveRegion/LiveRegion.js"
import { cn } from "../../lib/cn.js"
import { buttonClasses } from "../Button/Button.js"
import { PlusIcon } from "../Icons/Icons.js"

// FileUpload — design-system extension (not in Figma). A preview tile beside
// the file name and actions, in the Input shell's language (rounded-8,
// warm-gray border, white field); the actions are Small GreenStroke buttons.
//
// The control is a real <button>. The <input type="file"> it drives is kept
// out of the tab order and the accessibility tree — a native file input's
// built-in button cannot be styled or renamed, and would otherwise be a
// second, unlabelled stop next to ours.
//
// The trigger stays the same element in every state (選擇圖片 ↔ 重新選取), so
// removing the file can hand focus straight back to it.

/** Same scheme as ComboboxLabels: shown text, then announcements. */
export type FileUploadLabels = {
  /** Trigger text with no value. */
  choose: string
  /** Trigger text with a value. */
  replace: string
  /** Remove button text. */
  remove: string
  /**
   * A button's accessible name when the control is paired with a <label>:
   * the field and the action together, e.g. 封面圖片，選擇圖片.
   */
  named: (field: string, action: string) => string
  /** Shown in place of a file name when there is no value. */
  empty: string
  /** Name for a value that is a URL without a usable file name. */
  current: string
  dropHint: string
  /** Announced after a file is chosen or dropped. */
  selected: (name: string) => string
  /** Announced after the file is removed. */
  removed: (name: string) => string
  /** Shown and announced when the preview image fails to load. */
  loadError: string
  /** Shown and announced when a dropped file does not match `accept`. */
  wrongType: string
  previewAlt: (name: string) => string
}

const DEFAULT_LABELS: FileUploadLabels = {
  choose: "選擇圖片",
  replace: "重新選取",
  remove: "刪除圖片",
  named: (field, action) => `${field}，${action}`,
  empty: "未設定",
  current: "目前的圖片",
  dropHint: "或將檔案拖曳到這裡",
  selected: (name) => `已選擇 ${name}`,
  removed: (name) => `已刪除 ${name}`,
  loadError: "圖片無法載入",
  wrongType: "不支援這個檔案類型",
  previewAlt: (name) => `預覽：${name}`,
}

type FileUploadProps = {
  /** id of the trigger button — pair it with `<Field htmlFor>`. */
  id?: string
  /** As on <input type="file">; also enforced for dropped files. */
  accept?: string
  /** A newly chosen File, the URL of an existing file, or nothing. */
  value: File | string | null
  onChange: (file: File) => void
  /** Omit to hide the remove action. */
  onRemove?: () => void
  /** Show an image preview. */
  preview?: boolean
  invalid?: boolean
  disabled?: boolean
  /**
   * Submit the file with a native <form> under this name. The hidden file
   * input is kept holding the current File — including a dropped one — and
   * is emptied when `value` is cleared or is an existing URL.
   */
  name?: string
  onFocus?: React.FocusEventHandler<HTMLButtonElement>
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
  /**
   * The field's name, when there is no <label> to pair with. Like a label's
   * text it is combined with the action: aria-label="封面圖片" names the
   * buttons 封面圖片，選擇圖片 and 封面圖片，刪除圖片.
   */
  "aria-label"?: string
  /** As `aria-label`, by reference: the element's text is the field's name. */
  "aria-labelledby"?: string
  "aria-describedby"?: string
  labels?: Partial<FileUploadLabels>
  className?: string
}

// Small GreenStroke Buttons — Button's own classes, not a copy, so they stay
// in step with every other button.
const buttonStyles = cn(buttonClasses("small", "greenStroke"), "cursor-pointer border-0")

/** The display name of a value: a File's own name, or a URL's last segment. */
function nameOf(value: File | string): string | undefined {
  if (typeof value !== "string") return value.name
  if (/^(data|blob):/.test(value)) return undefined
  const segment = value.split(/[?#]/)[0]!.split("/").pop()
  if (!segment) return undefined
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/** The `accept` attribute's matching rules, for drops (the picker does its own). */
function accepts(file: File, accept?: string) {
  if (!accept) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .some((rule) =>
      rule.startsWith(".")
        ? name.endsWith(rule)
        : rule.endsWith("/*")
          ? type.startsWith(rule.slice(0, -1))
          : type === rule,
    )
}

export function FileUpload({
  id,
  accept,
  value,
  onChange,
  onRemove,
  preview,
  invalid,
  disabled,
  name: fieldName,
  onFocus,
  onBlur,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  labels,
  className,
}: FileUploadProps) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const generatedId = useId()
  const triggerId = id ?? generatedId
  const errorId = `${triggerId}-error`
  const fileId = `${triggerId}-file`
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Announcements happen only in response to the user (or a preview failing
  // to load), never on mount.
  const { message, say } = useAnnouncer()

  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState(false)

  // A File previews through an object URL, revoked when it is replaced.
  const [objectUrl, setObjectUrl] = useState<string>()
  useEffect(() => {
    if (!(value instanceof File) || !value.type.startsWith("image/")) {
      setObjectUrl(undefined)
      return
    }
    const url = URL.createObjectURL(value)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])
  const src = typeof value === "string" ? value : objectUrl

  // Keyed on the src that failed, so a new value clears the error by itself.
  const [failedSrc, setFailedSrc] = useState<string>()
  const loadFailed = !!src && failedSrc === src
  useEffect(() => {
    if (loadFailed) say(l.loadError)
    // Once per failure; the label is not a reason to say it again.
  }, [loadFailed, say])

  // The <label> text, if the trigger is paired with one (e.g. via Field). It
  // is folded into the button's name so the name says both what the field is
  // and what the button does — "封面圖片，選擇圖片" — instead of the label
  // replacing the action, which is what <label for> on a button does.
  // Re-read after every render (setting state only on a change), so a label
  // that changes later — a locale switch — does not leave a stale name.
  const [labelText, setLabelText] = useState<string>()
  useEffect(() => {
    const text = triggerRef.current?.labels?.[0]?.textContent ?? undefined
    if (text !== labelText) setLabelText(text)
  })

  const hasValue = value !== null && value !== ""
  const name = hasValue ? (nameOf(value) ?? l.current) : undefined
  const triggerText = hasValue ? l.replace : l.choose
  const error = loadFailed ? l.loadError : rejected ? l.wrongType : undefined

  // The file input mirrors `value`, so a native form submit sends what the
  // user sees: a dropped File is written into it, and it is emptied when the
  // value is cleared or is a URL (nothing new to upload).
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    if (value instanceof File) {
      if (input.files?.[0] === value) return
      try {
        const dt = new DataTransfer()
        dt.items.add(value)
        input.files = dt.files
      } catch {
        // DataTransfer is not constructible in very old browsers; the picker
        // path still works there, only a dropped file is not submitted.
      }
    } else if (input.value) {
      input.value = ""
    }
  }, [value])

  // Re-selecting the same file must still fire `change`, which it does not
  // while the input already holds that file. So the input is emptied just
  // before the picker opens — and restored if the picker is cancelled,
  // or a form would lose the file the user still sees.
  const openPicker = () => {
    const input = inputRef.current
    if (!input) return
    // Copied: input.files is a live FileList, emptied with the input.
    const held = Array.from(input.files ?? [])
    input.value = ""
    input.addEventListener(
      "cancel",
      () => {
        if (held.length === 0) return
        const dt = new DataTransfer()
        held.forEach((file) => dt.items.add(file))
        input.files = dt.files
      },
      { once: true },
    )
    input.click()
  }

  // Names: aria-labelledby (by reference) > aria-label > a paired <label>.
  // Each is the field's name, combined with the button's action.
  const fieldLabel = ariaLabel ?? labelText
  const triggerTextId = `${triggerId}-action`
  const removeTextId = `${triggerId}-remove`
  const buttonName = (action: string, textId: string) =>
    ariaLabelledBy
      ? { "aria-labelledby": `${ariaLabelledBy} ${textId}` }
      : { "aria-label": fieldLabel ? l.named(fieldLabel, action) : undefined }

  const take = (file: File | undefined) => {
    if (!file) return
    if (!accepts(file, accept)) {
      setRejected(true)
      say(l.wrongType)
      return
    }
    setRejected(false)
    onChange(file)
    say(l.selected(file.name))
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-16 rounded-8 border border-bg-warm-gray bg-neutral-white p-16 transition-colors",
        invalid && "border-red-PRIMARY",
        dragging && "border-teal-PRIMARY bg-bg-light-off-white",
        className,
      )}
      // Drop is a shortcut; the button does everything drop does.
      onDragOver={(e) => {
        if (disabled) return
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={(e) => {
        if (disabled) return
        e.preventDefault()
        setDragging(false)
        take(e.dataTransfer?.files?.[0])
      }}
    >
      {preview ? (
        <div className="flex size-88 shrink-0 items-center justify-center overflow-hidden rounded-8 border border-dashed border-bg-warm-gray bg-bg-light-off-white text-teal-100">
          {src && !loadFailed ? (
            <img
              src={src}
              alt={l.previewAlt(name ?? l.current)}
              onError={() => setFailedSrc(src)}
              className="size-full object-cover"
            />
          ) : hasValue ? null : (
            // Placeholder only when empty: over a failed image it would read
            // as "add", while the value is in fact still set.
            <PlusIcon />
          )}
        </div>
      ) : null}

      <div className="grid min-w-0 flex-1 gap-8">
        <p
          id={fileId}
          className={cn(
            "typography-body2 m-0 truncate",
            hasValue ? "text-teal-700" : "text-neutral-dark-gray",
          )}
        >
          {name ?? l.empty}
        </p>
        {error ? (
          <p id={errorId} className="typography-body2 m-0 text-red-600">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-8">
          <button
            ref={triggerRef}
            id={triggerId}
            type="button"
            disabled={disabled}
            {...buttonName(triggerText, triggerTextId)}
            onFocus={onFocus}
            onBlur={onBlur}
            // The current file name (or 未設定) first: without it, after
            // choosing a file a screen reader user heard only 重新選取.
            aria-describedby={[fileId, error ? errorId : undefined, ariaDescribedBy]
              .filter(Boolean)
              .join(" ")}
            onClick={openPicker}
            // Invalid: the focus outline turns red, as on Input.
            className={cn(buttonStyles, invalid && "focus-visible:outline-red-600")}
          >
            <span id={triggerTextId}>{triggerText}</span>
          </button>
          {hasValue && onRemove ? (
            <button
              type="button"
              disabled={disabled}
              // Named with the field, so two uploaders on a page do not both
              // offer an indistinguishable 刪除圖片.
              {...buttonName(l.remove, removeTextId)}
              onClick={() => {
                setRejected(false)
                onRemove()
                say(l.removed(name ?? l.current))
                // The remove button is about to unmount; the trigger is not.
                triggerRef.current?.focus()
              }}
              className={buttonStyles}
            >
              <span id={removeTextId}>{l.remove}</span>
            </button>
          ) : null}
        </div>
        {!hasValue && !disabled ? (
          <p className="typography-body2 m-0 text-neutral-dark-gray">{l.dropHint}</p>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        name={fieldName}
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        className="sr-only"
        // Not emptied here: it keeps the file for form submission. See
        // openPicker for how re-selecting the same file still works.
        onChange={(e) => take(e.target.files?.[0])}
      />

      <LiveRegion message={message} />
    </div>
  )
}
