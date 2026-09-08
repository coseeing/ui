/**
 * Anchor-like component: `next/link`, a router link, or a plain `<a>`. It must
 * accept `href` and forward the remaining anchor props.
 */
export type AnchorLike = React.ComponentType<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  /** Sets `aria-current="page"`. The caller knows the route; this doesn't. */
  current?: boolean
  /**
   * What to render. Defaults to a plain `<a>`; pass `next/link` (or any router
   * link) to get client-side navigation and prefetching.
   */
  as?: "a" | AnchorLike
}

/**
 * A styled anchor. Deliberately dumb: it does not read the current route or
 * know about a deployment base path, so it needs no router and no provider and
 * renders on the server.
 *
 * Pass `href` already resolved — if the app runs under a base path, prefix it
 * there (Next's `basePath` does this for `next/link` but not for plain `<a>`,
 * which is what an app-level `appPath()` helper is for).
 */
export function Link({ href, current, as: Anchor = "a", ...props }: LinkProps) {
  return (
    <Anchor href={href} aria-current={current ? "page" : undefined} {...props} />
  )
}
