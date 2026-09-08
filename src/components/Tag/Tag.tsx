import { cn } from "../../lib/cn.js"

// Tag — orange pill from Figma "Coseeing" → 列表頁 ProjectCard. Fully rounded,
// orange fill, dark label; grows px-8 → px-12 at the desktop breakpoint.
type TagProps = {
  className?: string
  children: React.ReactNode
}

export function Tag({ className, children }: TagProps) {
  return (
    <span
      className={cn(
        "typography-emphasised3 inline-flex items-center rounded-[6rem] bg-orange-PRIMARY px-8 py-4 text-neutral-black desktop:px-12",
        className,
      )}
    >
      {children}
    </span>
  )
}
