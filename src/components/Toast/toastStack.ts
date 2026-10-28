// The shared stack that open Toasts render into — one per position.
//
// Each <Toast open> is its own component, placed wherever the app likes, with
// no list for the app to manage and no provider. What they still have to
// share is somewhere to appear: a fixed container in <body> per position, so
// two toasts open at once stack instead of overlapping. That container, the
// order the toasts opened in (which decides who is within `max`), and the
// hover/focus pause are kept here, created on the first open toast and
// removed with the last.
//
// The pause belongs to the stack, not the card: while the pointer is over any
// toast, or focus is in one, none of them time out — nobody loses the toast
// under the one they are reading.

export type ToastPosition = "top-center" | "top-right" | "bottom-center" | "bottom-right"

const POSITION: Record<ToastPosition, string> = {
  "top-center": "inset-x-16 top-16 items-center",
  "top-right": "right-16 top-16 items-end",
  "bottom-center": "inset-x-16 bottom-16 items-center",
  "bottom-right": "right-16 bottom-16 items-end",
}

type Stack = {
  el: HTMLElement
  ids: string[]
  hovered: boolean
  focused: boolean
  /** Focused before focus entered the stack; where it goes after the last close. */
  returnFocus: HTMLElement | null
}

const stacks = new Map<ToastPosition, Stack>()
const listeners = new Map<ToastPosition, Set<() => void>>()

const emit = (position: ToastPosition) => listeners.get(position)?.forEach((fn) => fn())

function create(position: ToastPosition, label: string): Stack {
  const el = document.createElement("section")
  el.setAttribute("aria-label", label)
  el.dataset.toastStack = position
  el.className = `pointer-events-none fixed z-50 flex flex-col gap-8 ${POSITION[position]}`
  const stack: Stack = { el, ids: [], hovered: false, focused: false, returnFocus: null }

  const outside = (e: MouseEvent | FocusEvent) => !el.contains(e.relatedTarget as Node | null)
  el.addEventListener("mouseover", () => {
    if (!stack.hovered) (stack.hovered = true), emit(position)
  })
  el.addEventListener("mouseout", (e) => {
    if (outside(e)) (stack.hovered = false), emit(position)
  })
  el.addEventListener("focusin", (e) => {
    if (outside(e)) stack.returnFocus = e.relatedTarget as HTMLElement | null
    if (!stack.focused) (stack.focused = true), emit(position)
  })
  el.addEventListener("focusout", (e) => {
    if (outside(e)) (stack.focused = false), emit(position)
  })

  document.body.appendChild(el)
  stacks.set(position, stack)
  return stack
}

/** Join the stack (creating it if needed); returns the element to portal into. */
export function register(position: ToastPosition, id: string, label: string) {
  const stack = stacks.get(position) ?? create(position, label)
  if (!stack.ids.includes(id)) stack.ids.push(id)
  emit(position)
  return stack.el
}

export function unregister(position: ToastPosition, id: string) {
  const stack = stacks.get(position)
  if (!stack) return
  stack.ids = stack.ids.filter((x) => x !== id)
  // Focus was in the toast that just went; it is no longer "in" the stack.
  if (stack.focused && !stack.el.contains(document.activeElement)) stack.focused = false
  if (stack.ids.length === 0) {
    stack.el.remove()
    stacks.delete(position)
  }
  emit(position)
}

export function subscribe(position: ToastPosition, fn: () => void) {
  const set = listeners.get(position) ?? new Set()
  set.add(fn)
  listeners.set(position, set)
  return () => set.delete(fn)
}

/** A string, so useSyncExternalStore can compare snapshots cheaply. */
export function snapshot(position: ToastPosition) {
  const stack = stacks.get(position)
  return stack ? `${stack.hovered || stack.focused ? 1 : 0}|${stack.ids.join(" ")}` : "0|"
}

export function parse(snap: string, id: string) {
  const [paused, ids] = snap.split("|") as [string, string]
  return { paused: paused === "1", index: ids ? ids.split(" ").indexOf(id) : -1 }
}

export function returnFocusOf(position: ToastPosition) {
  return stacks.get(position)?.returnFocus ?? null
}
