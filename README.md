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

28 primitives, all framework-agnostic:

| Group | Components |
| --- | --- |
| Layout | `Container`, `Card` |
| Actions & nav | `Button`, `Link`, `Menu`, `Pagination` |
| Form | `Field`, `Label`, `ValidationMessage`, `Input`, `Textarea`, `Checkbox`, `Select`, `FileUpload`, `Combobox`, `MultiCombobox` |
| Data | `Badge`, `Tag`, `Table`, `DescriptionList`, `ReorderableList` |
| Disclosure & feedback | `Accordion`, `Tabs`, `Dialog`, `Toast`, `LiveRegion`, `Spinner`, `LoadingOverlay` |
| Icons | 13 brand icons from `Icons` |

Also exported: `cn`, `fieldDescribedBy`, `useAnnouncer`, and the `LinkProps` / `AnchorLike` / `TableColumn` /
`TabItem` / `AccordionEntry` / `ComboboxOption` / `ComboboxLabels` /
`ComboboxProps` / `MultiComboboxProps` / `PaginationLabels` / `FileUploadLabels` / `DescriptionItem` / `ReorderableListLabels` / `MenuItem` / `MenuTrigger` / `ToastTone` / `ToastPosition` / `Announcement` types.

There is no provider to mount and nothing to configure globally. Components
take what they need as props.

## Consuming it

### Install Coseeing Github Packages

To install the coseeing packages, please refer to [Github Doc](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages).

In short: the app needs an `.npmrc` pointing the `@coseeing` scope at the
GitHub registry, plus a personal access token with `read:packages`.

```
@coseeing:registry=https://npm.pkg.github.com
```

Then `npm install @coseeing/ui`.

### Styling

Two independent styling paths. **Pick one** — importing both duplicates every
utility.

#### Path A — the app does not use Tailwind

```ts
import "@coseeing/ui/styles.css"       // once, at the app root
import { Button, Card } from "@coseeing/ui"
```

`dist/styles.css` is prebuilt and self-contained: Tailwind preflight, the brand
tokens, the typography classes, and every utility the components use. Nothing
to configure.

#### Path B — the app already runs Tailwind v4 (recommended)

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

### Field descriptions: `fieldDescribedBy`

Given `htmlFor`, `Field` gives its hint the id `${htmlFor}-hint` and its error
`${htmlFor}-error`. The error id sits on Field's always-mounted live region,
so it exists (empty) before any error does. That lets the control carry one
fixed value:

```tsx
<Field label="Email" htmlFor="email" hint="We never share it." error={error}>
  <Input id="email" invalid={!!error} aria-describedby={fieldDescribedBy("email")} />
</Field>
```

`fieldDescribedBy("email")` is `"email-hint email-error"`. While valid, the
description is the hint; once there is an error it is the error (the hint is
hidden, and a missing id is simply ignored). Field does not inject the
attribute into its child — the control still says what describes it.

### Textarea

The `Input` shell, multi-line. `invalid` sets `aria-invalid`; `rows`
(default 4) and every native textarea attribute pass through.

```tsx
<Field label="自我介紹" htmlFor="bio" hint="最多 200 字">
  <Textarea id="bio" aria-describedby={fieldDescribedBy("bio")} maxLength={200} autoResize />
</Field>
```

`autoResize` grows the field with its content using CSS `field-sizing:
content`, so `Textarea` stays a Server Component. Browsers without
`field-sizing` (Firefox, at the time of writing) keep the fixed `rows` height
and the manual resize handle.

### FileUpload

```tsx
const [cover, setCover] = useState<File | string | null>(existingUrl)

<Field label="封面圖片" htmlFor="cover">
  <FileUpload
    id="cover"
    accept="image/*"
    preview
    value={cover}               // a new File, an existing URL, or null
    onChange={setCover}
    onRemove={() => setCover(null)}
  />
</Field>
```

- The control is a real `<button>`; the `<input type="file">` behind it has
  `tabIndex={-1}` and `aria-hidden`. Paired with a `<label>`, the button's name
  keeps both: 「封面圖片，選擇圖片」.
- The input is reset after every pick, so choosing the same file twice still
  fires `onChange`.
- The chosen file name, removal, and errors are announced through a live
  region that is always mounted. Removing hands focus back to the trigger.
- A URL that fails to load shows 「圖片無法載入」 — the value is still set, so
  the name and actions stay rather than falling back to 「未設定」.
- Drag and drop is a shortcut, never the only way. Dropped files are checked
  against `accept`, since only the picker enforces it natively.
- Strings are in `labels`; set `choose`/`remove` to 「選擇檔案」/「刪除檔案」
  for non-image uploads.

### DescriptionList

Read-only field/value pairs, on a semantic `<dl>`/`<dt>`/`<dd>`:

```tsx
<DescriptionList
  items={[
    { term: "姓名", description: "王小明" },
    { term: "帳號身分", description: <Badge>志工</Badge> },
  ]}
/>
```

Stacked on mobile; two columns from tablet up, with a fixed 16rem term column
so values line up. No state, so it renders on the server.

### Spinner and LoadingOverlay

```tsx
<Spinner label="載入中" size="sm" />          // role="status", label visually hidden

<LoadingOverlay active={saving} label="資料處理中">
  <Card>…</Card>                               // inert while active
</LoadingOverlay>

<LoadingOverlay active={exporting} fullPage label="匯出中" />
```

- `Spinner` holds still under `prefers-reduced-motion`. Its `role="status"`
  is mounted together with its label, which screen readers often do not
  announce — fine for "something is loading here", not for "tell me when it
  starts and ends". That is LoadingOverlay's job.
- `LoadingOverlay` makes the covered content `inert` (not clickable,
  focusable, or readable) and sets `aria-busy`. If focus was inside, it moves
  to the overlay panel and returns afterwards. An always-mounted live region
  announces `label` on start and `doneLabel` (「載入完畢」) on finish.
- `fullPage` renders into `<body>` via a portal and sets `inert` on every other
  child of `<body>`, restoring each afterwards. Started while a modal `Dialog`
  is open, it renders into that dialog instead (in `<body>` it would sit behind
  the modal) and makes the dialog's own content inert.

### ReorderableList

```tsx
<ReorderableList
  label="常見問題排序"
  items={questions}
  getKey={(q) => q.id}
  getLabel={(q) => q.title}
  onChange={setQuestions}
/>
```

- Every row has 上移 / 下移 / 移除 icon buttons named with the item —
  「上移：WCAG 2.2 新增了哪些準則」. There is no drag, so nothing depends on it.
- After a move, focus stays on the moved item's same button. A live region
  says 「已上移，第 2／4 項」, or 「已上移，已抵達第一項」 at an end.
- At the ends 上移/下移 are `aria-disabled` rather than `disabled`, so the item
  just moved to the top keeps focus; pressing it there only says 已抵達第一項.
- Removing moves focus to the next row's 移除, else the previous row's, else
  the empty state, and announces 「已移除 …」.
- The moved row's highlight fades, and simply appears under reduced motion.
- `renderItem` for richer rows; `removable={false}` to hide 移除; strings in
  `labels`.

Two layouts, same behaviour and announcements:

| `layout` | Structure | Tab stops | Use when |
| --- | --- | --- | --- |
| `"list"` (default) | `<ol>`, buttons in each row | 3 per row | Short lists; everyone knows how to read a list |
| `"grid"` | APG layout grid (`role="grid"` / `row` / `gridcell`) | 1 for the whole list | Long lists, where 3 × rows Tab stops is a chore |

In the grid, ←/→ move within a row, ↑/↓ between rows in the same column,
Home/End to the row's ends, Ctrl+Home/End to the first/last row. The single
Tab stop is the last cell you were on, and it follows the item: after 上移 you
are still on that item's 上移, one row up. The trade-off is that it is read as
a grid rather than a list, and screen reader users need to know grid
navigation (they are switched to focus mode inside it).

### Menu

A menu button for actions or navigation — 更多操作, 帳號選單. Not a form
control: to pick a value, use `Select` or `Combobox`.

```tsx
<Menu
  label="更多操作"
  trigger={{ variant: "small", theme: "greenStroke" }}
  placement="bottom-end"
  items={[
    { key: "edit", label: "編輯活動", onSelect: edit },
    { key: "report", label: "下載報名名單", href: "/events/42/report.csv", as: NextLink },
    { key: "archive", label: "封存", onSelect: archive, disabled: true },
    { type: "separator" },
    { key: "delete", label: "刪除活動", onSelect: confirmDelete, tone: "danger" },
  ]}
/>

// Icon-only: the type requires aria-label.
<Menu label="帳號選單" trigger={{ icon: <MenuIcon />, iconOnly: true, "aria-label": "帳號選單" }} items={…} />
```

- APG Menu Button: `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`;
  `role="menu"` / `menuitem` (an `<a>` for `href` items) / `separator`.
- Enter, Space or ↓ open on the first item, ↑ on the last. Inside: ↑/↓ wrap,
  Home/End, type to jump (keys within 500ms build one prefix), Enter/Space
  activate and close, Esc closes back to the trigger, Tab closes and moves on.
  Clicking outside closes. Focus is not trapped.
- After an action, focus returns to the trigger — unless the action moved it
  (e.g. opened a Dialog).
- `disabled` items are `aria-disabled`: reachable and announced, but inert.
- `tone: "danger"` is red-600 text: 6.13:1 on white, 4.95:1 on the focus fill.
- The trigger takes any Button `variant`/`theme`. The popup flips to the
  trigger's other edge when `placement` would overflow the viewport.

### Announcements: `LiveRegion` and `useAnnouncer`

For telling screen reader users something that has no other voice — 已儲存,
已複製連結:

```tsx
const { message, say } = useAnnouncer()

<Button onClick={async () => { await copyLink(); say("已複製連結") }}>複製連結</Button>
<LiveRegion message={message} />            // render it always, unconditionally
```

- The region is mounted up front and empty; `say()` only changes its text. A
  `role="status"`/`"alert"` inserted together with its message is announced
  unreliably, which is why nothing in this package does that any more.
- The text is cleared after 7s (`useAnnouncer({ clearAfter })`, React Aria's
  default). The region is visually hidden, so its text duplicates something
  on screen; left in place, someone browsing with the virtual cursor would
  meet it twice. Clearing is silent and does not cut off an announcement.
- The same text twice in a row is still announced.
- `politeness="assertive"` (`role="alert"`) interrupts — keep it for errors.

Combobox, FileUpload, ReorderableList, LoadingOverlay and Toast announce
through it. Visible live text — Field's error, Pagination's status line — is
the content itself, not a copy, so it is not cleared.

### Toasts: `<Toast open>`

One component per notification, like `Dialog`: put it in the JSX and flip
`open`. No list to manage and no provider.

```tsx
const [saved, setSaved] = useState(false)

<Button onClick={async () => { await save(); setSaved(true) }}>儲存</Button>
<Toast
  open={saved}
  onClose={() => setSaved(false)}   // close button, and on timeout
  tone="success"
  title="已儲存"
  message="你的變更已儲存。"
  // optional:
  autoHide={5000}                   // ms; null = until closed. Danger defaults to null.
  position="top-center"             // also top-right, bottom-center, bottom-right
  max={3}                           // shown at once per position; later ones wait
/>
```

- Open toasts with the same `position` share one stack in `<body>` (created
  with the first, removed with the last), in the order they opened. While a
  modal `Dialog` is open the stack moves inside it — `showModal()` makes
  everything outside inert, so a toast raised from the dialog's form would
  otherwise be unseeable and unclosable — and back out when it closes. Past
  `max`, a toast waits — not shown, not announced, timer stopped — until an
  earlier one closes.
- Each `<Toast open>` keeps its own `LiveRegion` mounted for as long as the
  component is, open or not, and writes its text there when it appears:
  assertive for `danger`, polite otherwise. The card itself has no role, so
  nothing depends on a region inserted together with its text, and the region
  text clears after 7s so it does not linger beside the card. Keep the
  component mounted and toggle `open` — don't render it conditionally, or its
  region is created at the same moment as its text.
- Danger toasts stay until closed unless given an `autoHide`; an error should
  not vanish unread.
- Timers pause while the pointer is over the stack or focus is inside it.
- The close button is 「關閉通知」 (`closeLabel`). Closing moves focus to the
  next toast, or back to where it was before entering the stack.
- Without `open`, `Toast` is a static card rendered in place: no timer, no
  announcement — for content that is on the page from the start.

### Badge tones

`tone`: `brand` (default), `muted`, and the status tones `success`,
`warning`, `danger`.

```tsx
<Badge tone="success">已通過</Badge>
<Badge tone="warning">審核中</Badge>
<Badge tone="danger">已退件</Badge>
```

The status tones are outlined rather than filled, so their text sits on the
page surface, and each text colour clears 4.5:1 on all three brand surfaces:

| Tone | Text | White | Off-white | Beige |
| --- | --- | --- | --- | --- |
| success | `green-800` | 5.98 | 5.55 | 4.83 |
| warning | `orange-800` (new) | 5.64 | 5.24 | 4.55 |
| danger | `red-600` | 6.13 | 5.69 | 4.95 |

A tinted fill was tried first and fails: even an 8% tint over beige drops the
three to 4.36 / 4.14 / 4.43. `orange-800: #985700` extends the Figma ramp for
the same reason `green-800` does — `orange-700` is 3.54 on beige — and is the
lightest step of that hue that passes everywhere (see `tokens.css`).

### Pagination

Two modes. With `onPageChange` it renders buttons:

```tsx
<Pagination page={page} pageCount={20} total={195} onPageChange={setPage} />
```

With `href` it renders links, and works in a Server Component (no
`"use client"`, no hooks). `as` takes the router link, as on `Link`:

```tsx
<Pagination page={page} pageCount={20} href={(p) => `/articles?page=${p}`} as={NextLink} />
```

- `<nav aria-label="分頁">` (override with `label`); the current page has
  `aria-current="page"`; page buttons are named 「第 3 頁」.
- At the ends, previous/next stop working without dropping focus. In button
  mode they are `disabled`, and reaching an end moves focus to the new current
  page. In link mode they stay the same `<a>`, `aria-disabled` and pointing at
  the current page — so with client-side routing, focus stays on 下一頁 after
  it takes you to the last page. (Swapping it for a disabled `<button>`, as an
  earlier version did, replaced the focused element and dropped focus to
  `<body>`.)
- The status line 「第 2／10 頁，共 195 筆」 is visible and is a live region
  (`role="status"`), so page changes are announced. `total` is optional.
- Ellipses keep a fixed number of slots — first, last, current ±
  `siblingCount` — whatever the page count.
- Strings are in `labels` (`previous`, `next`, `page`, `status`).

### Searchable selects: `Combobox` and `MultiCombobox`

For option sets too long for `Select`. Both are controlled: the caller owns
`value` and `options`.

```tsx
const [topics, setTopics] = useState<ComboboxOption[]>([])

<Field label="主題標籤" htmlFor="topics" error={error}>
  <MultiCombobox
    id="topics"
    options={options}
    value={topics}
    onChange={setTopics}
    creatable
    onCreate={async (label) => {
      const created = await api.createTopic(label)   // caller adds it to options + value
      setOptions((o) => [...o, created])
      setTopics((t) => [...t, created])
    }}
    invalid={!!error}
    aria-describedby={fieldDescribedBy("topics")}
  />
</Field>
```

`<Combobox>` takes the same props with `value: ComboboxOption | null`.

- Keyboard follows the APG combobox pattern: ↑/↓ open and move (wrapping),
  Enter commits, Esc closes and a second Esc clears. Home/End and ←/→ are
  text-editing keys: with an option highlighted they clear the highlight (the
  popup stays open) and move the caret, rather than jumping through the list.
  Enter is ignored during IME composition, so committing a 注音/倉頡
  candidate never selects an option.
- Nothing is pre-selected: the first match is highlighted but not written into
  the input.
- The match count is announced through a live region that is always mounted,
  once typing pauses (500ms) and never mid-IME-composition. Actions are
  announced too — 「已選取 WCAG」, 「已取消選取 WCAG」, 「已移除 WCAG」,
  「已新增並選取「X」」 (or 「已新增「X」」 when the caller did not select it)
  — and hold the region until the user types again.
- In the multi version, choosing a selected option again deselects it, and
  each selected item has a named remove button (「移除 WCAG」). Removing one
  moves focus to the next item, or back to the input.
- `onCreate` only reports the text. Adding the new option to `options` and
  `value` is the caller's job, since it usually needs a server id first. If the
  promise rejects, the typed text stays so the user can retry.
- For server-side search, pass `filter={() => true}` and update `options`
  (with `loading`) as the query changes.
- Default strings are Traditional Chinese. Override `emptyText` and `labels`
  (`loading`, `results`, `create`, `remove`, `selected`, and the
  `announce*` messages); see `ComboboxLabels`.

### Server Components

The build preserves the module graph, so `"use client"` stays on just the
files that actually need it — `Dialog`, `Tabs`, `Combobox`, `FileUpload`,
`LoadingOverlay`, `ReorderableList`, `Menu`, `Toast`, and
`LiveRegion`, the only components with state. Everything else, including `Link` and `Button`, renders on the server.
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

## Publishing

The package goes to GitHub Packages as `@coseeing/ui`, via the **Publish
package to GitHub Packages** workflow (`.github/workflows/publish.yml`). It is
`workflow_dispatch` only — nothing publishes on a push or a merge.

1. Bump the version on `main`:

   ```sh
   npm version patch    # or minor / major
   ```

   `npm version` writes `package.json`, commits, and tags. Push both:

   ```sh
   git push && git push --tags
   ```

2. Actions → **Publish package to GitHub Packages** → **Run workflow**.

The workflow installs, installs Chromium, then runs `typecheck`, `test`, and
`build` before `npm publish`. A failure in any of those stops the run, so a
broken build never reaches the registry. Auth is the workflow's own
`GITHUB_TOKEN` — there is no separate secret to rotate.

**A version can only be published once.** Re-running the workflow without a
bump fails at `npm publish` with a 409, and GitHub Packages does not allow
overwriting or re-using a version after a delete. Always bump first.

`npm publish` runs `prepack`, which runs `npm run build` — so `dist/` is always
rebuilt from the checked-out source at publish time and never taken from a
local working tree. `files: ["dist"]` is what keeps `src/`, stories, and configs
out of the tarball; `npm publish --dry-run` prints the exact file list.

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
- **Combobox** — APG wiring (`aria-controls`, `aria-activedescendant`), no
  pre-selection, ↑/↓ wrap, Home/End and ←/→ clearing the highlight and moving
  the caret, double Esc, Enter ignored during IME
  composition, create, multi toggle, focus after removing an item, and the
  persistent result-count live region.
- **FileUpload** — the trigger is a named `<button>` and the native input is
  hidden from the tab order and a11y tree; re-selecting twice (including the
  same file); an existing URL shows preview and 刪除; a broken image shows an
  error, not 未設定; focus after removing; drop, and drop outside `accept`.
- **Spinner** — the label reaches the status role, and the reduced-motion
  rule really sets `animation: none` on the ring.
- **LoadingOverlay** — covered content is inert and `aria-busy`, content
  outside is not; focus moves to the panel and back; start and 載入完畢 are
  announced; `fullPage` inerts the rest of `<body>` and restores it.
- **ReorderableList** — `<ol>` semantics and item-named buttons;
  `aria-disabled` at the ends; focus kept through moves and an end;
  announcements; focus after removing the middle, last, and only row. Grid
  layout: one Tab stop, arrow / Home / End / Ctrl+Home / Ctrl+End movement
  without wrapping, and the Tab stop following the moved item.
- **Menu** — trigger and menu wiring; Enter/Space/↓/↑ opening; wrap,
  Home/End and typeahead; activation returns focus; disabled items are
  reachable and inert; Esc, Tab and outside-click close; the viewport flip;
  icon-only naming.
- **Toast** — static: the close button and `closeLabel`, and no tone gives
  the card a live-region role. `open`: each toast's region exists (empty)
  before it opens, danger goes assertive and the rest polite; the stack
  appears with the first toast and goes with the last; `max` holds later
  toasts back, unannounced, until one closes; auto-hide pauses on hover and
  on focus; danger stays; focus after closing.
- **Badge** — every tone on all three brand surfaces, with the contrast ratio
  computed from the browser's colours (so a failure names the tone, the
  surface, and the ratio), on top of axe.
- **LiveRegion** — mounted empty, `say()` fills it, the same text twice is a
  new node (announced again), and the text clears after `clearAfter`.
- **Pagination** — landmark name, `aria-current`, real `disabled` at both
  ends in button mode with focus handed to the current page, the live status
  line, ellipsis slots at the start / middle / end, link mode with `as`, and
  focus kept on an `aria-disabled` 下一頁 through a client-side navigation.
- **Field** — `fieldDescribedBy` gives the hint while valid and the error
  once invalid; the error message lands in an always-mounted `aria-live` region
  and does not also carry `role="alert"` (which would announce twice); `error`
  replaces `hint` rather than stacking.

Two conventions worth knowing before adding tests:

- `userEvent` dispatches *synthetic* events, so it cannot trigger user-agent
  behaviour like ESC-to-close on `<dialog>`, and it refuses to click anything
  with `pointer-events: none`. Reach for `fireEvent` in those two cases, and
  say why in a comment.
- Query summaries and roles, not free text. A question and its answer can share
  a phrase, which makes `getByText` ambiguous the moment an item expands.

### Real bugs this found

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

A third turned up later. **`Badge tone="muted"` failed WCAG AA** at 4.42
(`neutral-dark-gray` on `neutral-very-light-gray`): Badge had no stories, so
axe never saw it. It now uses `teal-200` (4.75). Found when the status tones
were added with a story that renders every tone on every surface.

`Storybook` also logs `"use client" in "src/lib/config.tsx" was ignored` when
building the static Storybook. That is expected: Storybook bundles an SPA where
the directive is meaningless. It still matters in `dist/`, which is not bundled.

Focus styles use `outline-hidden`, never `outline-none`. In Tailwind v4,
`outline-none` sets `outline-style: none`, and every focus indicator here is a
ring or box-shadow — which Windows High Contrast (forced colors) removes, so
focus vanished entirely there. `outline-hidden` is a transparent outline that
forced-colors mode paints. Anything marked without DOM focus (the combobox's
highlighted option) also needs a `forced-colors:outline-*`.

Relative imports in `src/` carry explicit `.js` extensions. That is what makes
the `bundle: false` output valid Node ESM; TypeScript resolves them back to the
`.ts`/`.tsx` sources.
