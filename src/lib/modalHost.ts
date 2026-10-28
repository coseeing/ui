/**
 * Where page-level overlays (the toast stack, a full-page LoadingOverlay) must
 * live to be usable: the topmost open modal <dialog>, else <body>.
 *
 * showModal() makes everything outside the dialog inert and hides it from
 * assistive tech. Anything rendered into <body> while a modal is open is
 * therefore unseeable, unclickable and unannounced until the dialog closes.
 */
export function modalHost(): HTMLElement {
  const modals = document.querySelectorAll<HTMLDialogElement>("dialog:modal")
  return modals[modals.length - 1] ?? document.body
}
