import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Link } from "./Link.js"

/**
 * Link — a styled anchor, and not much more.
 *
 * It takes no router and no provider: `current` is passed in by the caller,
 * which already knows the route, and `href` arrives already resolved. That is
 * what lets it render on the server and what let these components leave the
 * SSO app without the design system importing `next/navigation`.
 *
 * In a Next app:
 * ```tsx
 * const pathname = usePathname()
 * <Link as={NextLink} href={appPath("/settings")} current={pathname === "/settings"}>
 * ```
 */
const meta = {
  title: "Components/Link",
  component: Link,
  parameters: { layout: "centered" },
  args: { href: "/settings", children: "帳號設定" },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

/** A plain anchor: href untouched, no `aria-current`. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link")
    await expect(link).toHaveAttribute("href", "/settings")
    await expect(link).not.toHaveAttribute("aria-current")
    await expect(link.tagName).toBe("A")
  },
}

/** `current` is what sets `aria-current="page"` — nothing is inferred. */
export const Current: Story = {
  render: () => (
    <nav className="flex gap-16">
      <Link href="/settings" current>
        帳號設定
      </Link>
      <Link href="/welcome">歡迎</Link>
    </nav>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("link", { name: "帳號設定" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    // Exactly one current link, not "every link on the page".
    await expect(canvas.getByRole("link", { name: "歡迎" })).not.toHaveAttribute(
      "aria-current",
    )
  },
}

/**
 * `as` swaps the underlying element — this is where a Next app passes
 * `next/link` to get client-side navigation and prefetching.
 */
export const AsRouterLink: Story = {
  render: (args) => {
    // Stands in for next/link: receives href plus the forwarded anchor props.
    function RouterLink({
      href,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
      return (
        <a href={href} data-router-link="true" {...props}>
          {children}
        </a>
      )
    }
    return <Link {...args} as={RouterLink} current />
  },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link")
    // Rendered through the injected component, not the built-in <a>.
    await expect(link).toHaveAttribute("data-router-link", "true")
    // ...and it still received href and the derived aria-current.
    await expect(link).toHaveAttribute("href", "/settings")
    await expect(link).toHaveAttribute("aria-current", "page")
  },
}

/** Anchor props pass straight through, so external links work as usual. */
export const ExternalLink: Story = {
  args: {
    href: "https://coseeing.org",
    target: "_blank",
    rel: "noreferrer",
    children: "Coseeing 官網（另開新視窗）",
  },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link")
    await expect(link).toHaveAttribute("href", "https://coseeing.org")
    await expect(link).toHaveAttribute("target", "_blank")
    await expect(link).toHaveAttribute("rel", "noreferrer")
  },
}
