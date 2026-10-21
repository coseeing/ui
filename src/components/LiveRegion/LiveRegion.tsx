"use client"

import { useCallback, useEffect, useState } from "react"

// Screen-reader announcements through a live region that is always mounted.
//
// Two rules, both learned the hard way in this package:
//
// 1. The region must exist before its text does. A role="status" / "alert"
//    inserted together with its message is announced unreliably (VoiceOver
//    often says nothing), so the region is rendered up front, empty, and
//    `say()` only changes what is inside it.
// 2. The text is cleared again after `clearAfter`. The region is visually
//    hidden, so its text duplicates something on screen — a toast, a chosen
//    file name. Left in place, a screen reader user browsing the page with
//    the virtual cursor meets the same message twice, long after it mattered.
//    Clearing is silent; screen readers take the text when it changes, so it
//    does not cut off an announcement in progress. 7s matches React Aria's
//    LiveAnnouncer default.
//
// Each message carries a counter, rendered as the key of its node, so saying
// the same text twice in a row (已選取 WCAG, 已取消選取 WCAG, 已選取 WCAG) is
// still a change and is announced again.

export type Announcement = { text: string; n: number }

/** Default time before an announcement's text is cleared, in ms. */
export const CLEAR_AFTER = 7000

/**
 * State for one live region: `say(text)` to announce, `clear()` to empty it
 * now. Render `<LiveRegion message={message} />` (always, unconditionally).
 */
export function useAnnouncer({ clearAfter = CLEAR_AFTER }: { clearAfter?: number } = {}) {
  const [message, setMessage] = useState<Announcement | null>(null)

  useEffect(() => {
    if (!message || clearAfter === Infinity) return
    const timer = setTimeout(() => setMessage(null), clearAfter)
    return () => clearTimeout(timer)
  }, [message, clearAfter])

  const say = useCallback(
    (text: string) => setMessage((prev) => ({ text, n: (prev?.n ?? 0) + 1 })),
    [],
  )
  const clear = useCallback(() => setMessage(null), [])

  return { message, say, clear }
}

type LiveRegionProps = {
  message: Announcement | null
  /** "assertive" interrupts (role="alert") — reserve it for errors. */
  politeness?: "polite" | "assertive"
}

/** A visually hidden live region. Keep it mounted; change only `message`. */
export function LiveRegion({ message, politeness = "polite" }: LiveRegionProps) {
  return (
    <div role={politeness === "assertive" ? "alert" : "status"} className="sr-only">
      {message ? <span key={message.n}>{message.text}</span> : null}
    </div>
  )
}
