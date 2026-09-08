// Brand icons — paths inlined verbatim from the Figma "Coseeing" → Elements
// exports so glyph geometry is preserved exactly. Fills are converted to
// currentColor: the dark (teal-PRIMARY) and light (orange-100) exports share
// identical paths, so one component serves both themes via text color.

type IconProps = React.SVGAttributes<SVGSVGElement>

/** Carousel arrow, pointing right (natural size 45.5 × 17.3). */
export function ArrowRightIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 45.5 17.3205"
      width="45.5"
      height="17.3205"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M1.5 7.16025C0.671573 7.16025 0 7.83183 0 8.66025C0 9.48868 0.671573 10.1603 1.5 10.1603V8.66025V7.16025ZM45.5 8.66025L30.5 0V17.3205L45.5 8.66025ZM1.5 8.66025V10.1603H32V8.66025V7.16025H1.5V8.66025Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Carousel arrow, pointing left — the right arrow rotated 180°, as in Figma. */
export function ArrowLeftIcon({ className, ...props }: IconProps) {
  return <ArrowRightIcon className={`rotate-180 ${className ?? ""}`} {...props} />
}

/** Carousel play control (natural size 40 × 40). */
export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.0457 40 20 40C8.95431 40 0 31.0457 0 20C0 8.95431 8.95431 0 20 0ZM15.6104 12.0537C14.9458 11.7249 14.1671 12.2087 14.167 12.9502V27.0498C14.1671 27.7913 14.9458 28.2751 15.6104 27.9463L29.8555 20.8965C30.5974 20.5293 30.5974 19.4707 29.8555 19.1035L15.6104 12.0537Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Carousel stop/pause control (natural size 40 × 40). */
export function StopIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.0457 40 20 40C8.95431 40 0 31.0457 0 20C0 8.95431 8.95431 0 20 0ZM15.3232 10C14.2187 10 13.3232 10.8954 13.3232 12V28C13.3232 29.1046 14.2187 30 15.3232 30H16.3232C17.4278 30 18.3232 29.1045 18.3232 28V12C18.3232 10.8955 17.4278 10 16.3232 10H15.3232ZM23.6768 10C22.5722 10 21.6768 10.8955 21.6768 12V28C21.6768 29.1045 22.5722 30 23.6768 30H24.6768C25.7813 30 26.6768 29.1046 26.6768 28V12C26.6768 10.8954 25.7813 10 24.6768 10H23.6768Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Hamburger menu (grip-solid-horizontal, natural size 24 × 18). */
export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24.0001 18.0001" width="24" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M22.5 18.0001H1.50001C0.671548 18.0001 0 17.3285 0 16.5001C0 15.6716 0.671548 15 1.50001 15H22.5C23.3285 15 24.0001 15.6716 24.0001 16.5001C24 17.3285 23.3285 18.0001 22.5 18.0001Z"
        fill="currentColor"
      />
      <path
        d="M22.5 10.5H1.50001C0.671548 10.5 0 9.82847 0 9.00006C0 8.17165 0.671548 7.50005 1.50001 7.50005H22.5C23.3285 7.50005 24.0001 8.1716 24.0001 9.00006C24.0001 9.82852 23.3285 10.5 22.5 10.5Z"
        fill="currentColor"
      />
      <path
        d="M22.5 3.00002H1.50001C0.671548 3.00002 0 2.32847 0 1.50001C0 0.671548 0.671548 0 1.50001 0H22.5C23.3285 0 24.0001 0.671548 24.0001 1.50001C24.0001 2.32847 23.3285 3.00002 22.5 3.00002Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** LinkedIn social icon (natural size 24 × 24). */
export function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M22.2234 0H1.77187C0.792187 0 0 0.773438 0 1.72969V22.2656C0 23.2219 0.792187 24 1.77187 24H22.2234C23.2031 24 24 23.2219 24 22.2703V1.72969C24 0.773438 23.2031 0 22.2234 0ZM7.12031 20.4516H3.55781V8.99531H7.12031V20.4516ZM5.33906 7.43438C4.19531 7.43438 3.27188 6.51094 3.27188 5.37187C3.27188 4.23281 4.19531 3.30937 5.33906 3.30937C6.47813 3.30937 7.40156 4.23281 7.40156 5.37187C7.40156 6.50625 6.47813 7.43438 5.33906 7.43438ZM20.4516 20.4516H16.8937V14.8828C16.8937 13.5563 16.8703 11.8453 15.0422 11.8453C13.1906 11.8453 12.9094 13.2938 12.9094 14.7891V20.4516H9.35625V8.99531H12.7687V10.5609H12.8156C13.2891 9.66094 14.4516 8.70938 16.1813 8.70938C19.7859 8.70938 20.4516 11.0813 20.4516 14.1656V20.4516V20.4516Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Facebook social icon (natural size 24 × 23.9). */
export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24.0005 23.9122" width="24" height="23.9122" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 0C5.37264 0 0 5.37264 0 12C0 17.6275 3.87456 22.3498 9.10128 23.6467V15.6672H6.62688V12H9.10128V10.4198C9.10128 6.33552 10.9498 4.4424 14.9597 4.4424C15.72 4.4424 17.0318 4.59168 17.5685 4.74048V8.06448C17.2853 8.03472 16.7933 8.01984 16.1822 8.01984C14.2147 8.01984 13.4544 8.76528 13.4544 10.703V12H17.3741L16.7006 15.6672H13.4544V23.9122C19.3963 23.1946 24.0005 18.1354 24.0005 12C24 5.37264 18.6274 0 12 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Chevron pointing down — accordion/expander indicator (natural size 22 × 12). */
export function ChevronDownIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 22.1156 11.9328"
      width="22.1156"
      height="11.9328"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M20.6563 0.53125C20.9198 0.267675 21.3214 0.267675 21.585 0.53125C21.8476 0.794178 21.8484 1.1945 21.5869 1.45801L11.5244 11.3447L11.5225 11.3467C11.3324 11.5367 11.1932 11.5996 11.0576 11.5996C10.8859 11.5996 10.7413 11.5468 10.5752 11.416L0.529297 1.54492C0.267674 1.28132 0.268326 0.881088 0.53125 0.618164C0.79483 0.354882 1.19648 0.354687 1.45996 0.618164L1.46289 0.621094L10.8252 9.76465L11.0586 9.99316L11.292 9.76367L20.6543 0.532227L20.6563 0.53125Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.666667"
      />
    </svg>
  )
}

/** Search magnifier (natural size 17 × 17, stroke-based). */
export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 17 17" width="17" height="17" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16 16L11 11M12.6667 6.83333C12.6667 10.055 10.055 12.6667 6.83333 12.6667C3.61167 12.6667 1 10.055 1 6.83333C1 3.61167 3.61167 1 6.83333 1C10.055 1 12.6667 3.61167 12.6667 6.83333Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Plus — expand indicator on report cards (tabler:plus, 24 × 24, stroke-based). */
export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Brand curve doodle — decorative squiggle on event/report cards
 * (natural size 149 × 58.6; fill-opacity 0.2 baked in, as exported).
 */
export function CurveDoodleIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 148.992 58.5937"
      width="148.992"
      height="58.5937"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M73.7992 19.5429C73.7992 19.5429 73.7992 19.5429 73.7557 19.5429C54.3347 19.5429 43.7098 38.7785 37.0039 47.0787C32.5187 52.6561 27.2063 56.0816 20.152 57.7505C15.1444 58.9362 8.43847 58.9362 4.8678 57.1796C-0.488211 54.5006 -0.793015 44.5755 0.948777 40.5351C4.084 40.9304 7.4805 40.5351 10.7464 40.2716C20.1085 39.6568 24.4194 36.7144 33.3896 23.6711C45.4951 6.01659 60.4745 0 73.7992 0C73.7992 0 73.7992 0 73.8427 0H75.1491C75.1491 0 75.1491 0 75.1926 0C88.5173 0 103.453 6.01659 115.602 23.6711C124.572 36.7144 128.883 39.6568 138.245 40.2716C141.511 40.4912 144.908 40.9304 148.043 40.5351C149.785 44.5755 149.48 54.5006 144.124 57.1796C140.597 58.9801 133.891 58.9362 128.84 57.7505C121.786 56.1255 116.473 52.6561 111.988 47.0787C105.282 38.7345 94.6572 19.5429 75.2362 19.5429C75.2362 19.5429 75.2362 19.5429 75.1926 19.5429H73.8863H73.7992Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
    </svg>
  )
}

/** 4px dot divider used between skill labels. */
export function DotDividerIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 4 4" width="4" height="4" fill="none" aria-hidden="true" {...props}>
      <circle cx="2" cy="2" r="2" fill="currentColor" />
    </svg>
  )
}

/**
 * Generic avatar — head and shoulders, drawn on a 40×40 grid.
 *
 * Not from Figma: the settings identity card needs a person mark, and the
 * brand set has none. Kept as flat currentColor shapes (no strokes) so it
 * scales and recolors like the rest of this file, and stays legible at the
 * 2.4rem it renders at inside the avatar circle.
 */
export function AvatarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" {...props}>
      {/* head */}
      <circle cx="20" cy="14" r="7" fill="currentColor" />
      {/* shoulders — a capsule clipped by the viewBox, so it reads as a bust */}
      <path
        d="M20 24c-7.2 0-13 4.8-13 10.8V36a1 1 0 0 0 1 1h24a1 1 0 0 0 1-1v-1.2C33 28.8 27.2 24 20 24Z"
        fill="currentColor"
      />
    </svg>
  )
}
