"use client"

import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { LiveRegion, useAnnouncer } from "../LiveRegion/LiveRegion.js"
import { cn } from "../../lib/cn.js"
import { SpinnerRing } from "../Spinner/Spinner.js"

// LoadingOverlay — design-system extension (not in Figma). Blocks a region (or
// the page) while work runs: a translucent veil with a white panel holding the
// spinner and label — Dialog's backdrop and panel language, lighter.
//
// "Blocks" means `inert`, not just a veil: covered content cannot be clicked,
// focused, or reached by a screen reader's virtual cursor. If focus was inside
// it, focus moves to the panel, and back again when the overlay lifts.
//
// The live region is always mounted and outside anything made inert — an
// inert subtree's live region is not announced — so both the start (label)
// and the end (doneLabel) are heard.
//
// fullPage cannot make "the rest of the page" inert from where it sits in the
// tree, so it renders into <body> through a portal and sets `inert` on every
// other child of <body>, restoring each one's previous state afterwards.
// (A modal <dialog> would make the background inert for free, but takes its
// own content out of the page when closed, which is exactly when "載入完畢"
// has to be announced.)

type LoadingOverlayProps = {
  active: boolean
  /** Shown on the panel and announced when the overlay appears. */
  label?: string
  /** Announced when the overlay lifts. */
  doneLabel?: string
  /** Cover the whole viewport instead of `children`. */
  fullPage?: boolean
  /** The content to cover (ignored with `fullPage`). */
  children?: React.ReactNode
  className?: string
}

export function LoadingOverlay({
  active,
  label = "資料處理中",
  doneLabel = "載入完畢",
  fullPage = false,
  children,
  className,
}: LoadingOverlayProps) {
  const labelId = useId()
  const contentRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)

  // The portal target only exists in the browser.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Announce on transitions. Mounting already active counts as one; mounting
  // inactive says nothing. Waits for `mounted`, so the (portalled) region is
  // in the page, empty, before its first text arrives.
  const { message, say } = useAnnouncer()
  const wasActive = useRef<boolean | null>(null)
  useEffect(() => {
    if (!mounted) return
    if (wasActive.current === null) {
      wasActive.current = active
      if (active) say(label)
      return
    }
    if (active === wasActive.current) return
    wasActive.current = active
    say(active ? label : doneLabel)
  }, [active, mounted, label, doneLabel, say])

  // Full page: make every other child of <body> inert while active.
  useEffect(() => {
    if (!fullPage || !active || !mounted) return
    const host = portalRef.current
    const touched: HTMLElement[] = []
    for (const el of Array.from(document.body.children)) {
      if (el === host || !(el instanceof HTMLElement) || el.inert) continue
      el.inert = true
      touched.push(el)
    }
    return () => touched.forEach((el) => (el.inert = false))
  }, [fullPage, active, mounted])

  // Focus: off the covered content and onto the panel; back when done.
  useEffect(() => {
    if (!active || !mounted) return
    const focused = document.activeElement as HTMLElement | null
    const covered = fullPage
      ? !!focused && focused !== document.body && !portalRef.current?.contains(focused)
      : !!focused && !!contentRef.current?.contains(focused)
    if (covered) {
      restoreFocus.current = focused
      panelRef.current?.focus()
    }
    return () => {
      const back = restoreFocus.current
      restoreFocus.current = null
      // Only if focus has not gone somewhere else meanwhile.
      const now = document.activeElement
      if (back?.isConnected && (now === document.body || panelRef.current?.contains(now))) {
        // After React re-renders without `inert`; focus() is a no-op on inert.
        requestAnimationFrame(() => back.focus())
      }
    }
  }, [active, fullPage, mounted])

  const panel = active ? (
    <div
      className={cn(
        "z-50 flex items-center justify-center",
        fullPage
          ? "fixed inset-0 bg-teal-700/60 backdrop-blur-[0.3rem]"
          : "absolute inset-0 rounded-[inherit] bg-neutral-white/70",
      )}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="group"
        aria-labelledby={labelId}
        className="flex items-center gap-12 rounded-16 bg-neutral-white px-24 py-16 text-teal-PRIMARY shadow-[0_0.8rem_2.4rem_rgb(16_36_42_/_0.16)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-PRIMARY"
      >
        <SpinnerRing size="md" />
        <span id={labelId} className="typography-strong2 text-teal-700">
          {label}
        </span>
      </div>
    </div>
  ) : null

  const region = <LiveRegion message={message} />

  if (fullPage) {
    return mounted
      ? createPortal(
          <div ref={portalRef} className={className}>
            {panel}
            {region}
          </div>,
          document.body,
        )
      : null
  }

  return (
    <div className={cn("relative", className)}>
      <div ref={contentRef} inert={active} aria-busy={active || undefined}>
        {children}
      </div>
      {panel}
      {region}
    </div>
  )
}
