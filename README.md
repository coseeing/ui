# @coseeing/ui

Coseeing brand design system: React primitives plus the Tailwind v4 design
tokens they are built on.

```
src/
  components/       one directory per component, with its stories
  lib/
    cn.ts           clsx + tailwind-merge
  styles/
    tokens.css      @theme — colours, spacing, type scale, radii, breakpoints
    base.css        html/body/element defaults (incl. the 62.5% root size)
    typography.css  .typography-* classes
    theme.css       consumer entry for Tailwind v4 apps
    index.css       build entry for the prebuilt stylesheet
```

## What's in it

16 primitives, all framework-agnostic:

| Group | Components |
| --- | --- |
| Layout | `Container`, `Card` |
| Actions & nav | `Button`, `Link` |
| Form | `Field`, `Label`, `ValidationMessage`, `Input`, `Checkbox`, `Select` |
| Data | `Badge`, `Tag`, `Table` |
| Disclosure & feedback | `Accordion`, `Tabs`, `Dialog`, `Toast` |
| Icons | 13 brand icons from `Icons` |

Also exported: `cn`, and the `LinkProps` / `AnchorLike` / `TableColumn` /
`TabItem` / `AccordionEntry` types.

There is no provider to mount and nothing to configure globally. Components
take what they need as props.

## Consuming it

Two independent styling paths. **Pick one** — importing both duplicates every
utility.

### Path A — the app does not use Tailwind

```ts
import "@coseeing/ui/styles.css"       // once, at the app root
import { Button, Card } from "@coseeing/ui"
```

`dist/styles.css` is prebuilt and self-contained: Tailwind preflight, the brand
tokens, the typography classes, and every utility the components use. Nothing
to configure.

### Path B — the app already runs Tailwind v4 (recommended)

```css
/* app/globals.css */
@import "tailwindcss";
@import "@coseeing/ui/theme.css";
```

This registers the tokens in the app's own Tailwind build, so `bg-teal-PRIMARY`,
`px-36`, and `typography-headline2` work in app markup as well as inside the
components — emitted once, into a single stylesheet.

`theme.css` carries its own `@source "./"`, which points Tailwind at
`node_modules/@coseeing/ui/dist` so it scans the compiled components for class
names. **Without that scan the components render unstyled**, because Tailwind
would tree-shake away every utility that only appears inside the library. It is
built in, so there is nothing to add on the consumer side — but it is the first
thing to check if styles go missing.

Finer-grained imports are available if you want the tokens without the global
element defaults: `@coseeing/ui/tokens.css`, `/base.css`, `/typography.css`.

> The whole scale is rem-against-a-10px root, so `base.css` sets
> `html { font-size: 62.5% }`. If you skip `base.css`, set that yourself or
> every size renders 1.6× too large.

Fonts are named but not shipped. Load "Noto Sans TC" (and Inter for display
faces) from the app — e.g. `next/font` — or the stack falls through to the
system sans-serif.

### Links and routing

`Link` — and `Button` when given an `href` — is a styled anchor and nothing
more. It reads no router and no global config:

```tsx
<Link href="/settings">帳號設定</Link>
```

Two optional props cover the rest. `as` swaps the underlying element for the
app's router link; `current` sets `aria-current="page"`:

```tsx
"use client"
import NextLink from "next/link"
import { usePathname } from "next/navigation"
import { Link } from "@coseeing/ui"
import { appPath } from "@/lib/app-path"

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <Link as={NextLink} href={appPath(href)} current={pathname === href}>
      {children}
    </Link>
  )
}
```

Pass `href` already resolved. If the app runs under a base path, prefix it in
the app — Next's `basePath` does this for `next/link` but not for a plain
`<a>`, which is what a helper like `appPath()` is for. The base path is a
property of the deployment, not of the design system, so it does not live here.

That six-line wrapper is the deliberate trade. An earlier version of this
package shipped a `UIProvider` that supplied `basePath`, `pathname`, and
`linkComponent` by context, so `<Link href="/settings">` "just worked". It cost
six exports, a mandatory app-root wrapper, a `"use client"` boundary on `Link`
itself, and implicit action-at-a-distance — to save an app from writing the
wrapper above once. Props won.

### Server Components

The build preserves the module graph, so `"use client"` stays on just the two
files that actually need it — `Dialog` and `Tabs`, the only components with
state. Everything else, including `Link` and `Button`, renders on the server.
Importing `Button` does not drag `Table` into the bundle.

ESM only. Every current bundler and Node ≥ 18 handles it; there is no CJS build.

### A runnable example

`examples/vite-app` is a real consumer using path B and most of the components:

```sh
cd examples/vite-app && npm install && npm run dev
```

It depends on the library via `file:../..`, so it builds against `dist/` — run
`npm run build` at the root first.

## Developing

```sh
npm install
npx playwright install chromium   # one-off, for the story tests
npm run storybook      # dev harness — components are built and reviewed here
npm run typecheck
npm run test           # unit + every story, with axe
npm run build          # js -> types -> css, into dist/
```

`npm run build` runs three steps:

1. **`build:js`** — tsup, transpile-only (`bundle: false`), one output file per
   source file. Bundling would collapse the graph and hoist the per-file
   `"use client"` directives into one boundary, making the whole library
   client-side for RSC consumers.
2. **`build:types`** — `tsc --emitDeclarationOnly`. Separate from tsup because
   tsup's dts step bundles, and a bundled `.d.ts` can't describe a preserved
   module graph.
3. **`build:css`** — compiles `dist/styles.css` and copies the raw `@theme`
   partials. It asserts that the output contains the tokens, the typography
   classes, the root font-size, and at least one utility that only exists inside
   a component; that last check is what catches a silently mis-scoped `@source`,
   whose only other symptom is unstyled components far downstream.

## Testing

`npm test` runs every story as a test in real Chromium: its `play` function
runs, and axe runs against the rendered result. `npm run test:watch` while
developing. The `@storybook/addon-vitest` panel runs the same tests from inside
the Storybook UI, so a failure is clickable straight to the story.

There is no separate Node project — the components carry no pure logic worth
unit-testing on its own. If that changes, add a second entry under
`test.projects` in `vitest.config.ts` with `include: ["src/**/*.test.ts"]`.

**Why a real browser and not jsdom.** `Dialog` is built on
`<dialog>.showModal()` and `Accordion` on `<details>/<summary>`. jsdom stubs
both incompletely — it reports `open` but does not make the dialog modal or
move focus — so tests that passed there would say nothing about a browser.

**axe runs on every story.** `preview.ts` sets `a11y: { test: "error" }`, and
`.storybook/vitest.setup.ts` loads the a11y addon annotations so that setting
applies under Vitest too. Without those annotations axe never runs and the
suite would silently check only the `play` functions.

What the story tests actually pin down, beyond "it renders":

- **Button** — `href` renders an `<a>` and *still* fires `onClick` (a bug that
  had already been fixed once); `href` + inert falls back to a real
  `<button disabled>`, because a disabled `<a>` stays focusable and clickable.
- **Link** — `aria-current="page"` on exactly the link marked `current`,
  rendering through an `as` component, and anchor props (`target`, `rel`)
  passing through. `as` is the seam that decoupled the library from Next, so it
  is worth guarding on both `Link` and `Button`.
- **Tabs** — APG roving tabindex, ←/→ wrap-around at both ends, Home/End, and
  the `aria-controls`/`aria-labelledby` pairing.
- **Dialog** — `showModal()` moves focus inside; close via ✕ and via backdrop
  click but *not* a click on the panel; a browser-driven close reaches
  `onClose`; and it reopens, so the effect re-runs rather than firing once.
- **Accordion** — expand/collapse, and items open independently.
- **Checkbox** — clicking the label text toggles the box, which only works if
  the `htmlFor`/`id` pairing holds.
- **Field** — the error message lands in an always-mounted `aria-live` region
  and does not also carry `role="alert"` (which would announce twice); `error`
  replaces `hint` rather than stacking.

Two conventions worth knowing before adding tests:

- `userEvent` dispatches *synthetic* events, so it cannot trigger user-agent
  behaviour like ESC-to-close on `<dialog>`, and it refuses to click anything
  with `pointer-events: none`. Reach for `fireEvent` in those two cases, and
  say why in a comment.
- Query summaries and roles, not free text. A question and its answer can share
  a phrase, which makes `getByText` ambiguous the moment an item expands.

### Two real bugs this found immediately

Turning axe on over the inherited stories failed the build on two counts, both
now fixed:

1. **`ValidationMessage` success text failed WCAG AA.** `Field.tsx` claimed
   "green-700 (4.5:1) meets AA" — true on pure white (4.53), but the brand page
   background is off-white, where it is 4.21, and beige, where it is 3.66. The
   ratio had been measured against the wrong surface. Added
   `--color-green-800: #3a7018`, the lightest green that clears 4.5:1 on all
   three (5.98 / 5.55 / 4.83), and pointed the success variant at it. This
   extends the Figma ramp, which stops at 700 — revert to `text-green-700` if
   you would rather keep the exact Figma value and accept the violation.
2. **`Select`'s own stories shipped an unnamed control** (axe `select-name`).
   Stories are what people copy, so they now carry a real label.

`Storybook` also logs `"use client" in "src/lib/config.tsx" was ignored` when
building the static Storybook. That is expected: Storybook bundles an SPA where
the directive is meaningless. It still matters in `dist/`, which is not bundled.

Relative imports in `src/` carry explicit `.js` extensions. That is what makes
the `bundle: false` output valid Node ESM; TypeScript resolves them back to the
`.ts`/`.tsx` sources.
