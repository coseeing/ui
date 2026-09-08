import { cn } from "../../lib/cn.js"

type ContainerProps = {
  id?: string
  className?: string
  as?: keyof React.JSX.IntrinsicElements
  "data-variant"?: string
  children: React.ReactNode
}

export function Container({
  id,
  className,
  "data-variant": dataVariant,
  as: Tag = "div",
  children,
}: ContainerProps) {
  return (
    <Tag
      {...(id ? { id } : {})}
      {...(dataVariant ? { "data-variant": dataVariant } : {})}
      className={cn("mx-auto px-20 desktop:max-w-[112rem]", className)}
    >
      {children}
    </Tag>
  )
}
