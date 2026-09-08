// Public API of @coseeing/ui.
//
// This is the only entry point; there are no deep imports into `dist/`. The
// package is built with the module graph preserved, so importing from the
// barrel still tree-shakes — pulling in `Button` does not drag in `Table`.
//
// Styles are separate and must be imported once by the consuming app. Either:
//   import "@coseeing/ui/styles.css"      // prebuilt, no Tailwind needed
// or, in a Tailwind v4 app's own CSS entry:
//   @import "@coseeing/ui/theme.css"      // tokens + typography, one build
//
// There is no provider to mount. Components that can render a link take an
// `as` prop for the app's router link; nothing reads global config.

// ── Layout ──────────────────────────────────────────────────────────────────
export { Container } from "./components/Container/Container.js"
export { Card } from "./components/Card/Card.js"

// ── Actions & navigation ────────────────────────────────────────────────────
export { Button } from "./components/Button/Button.js"
export { Link } from "./components/Link/Link.js"
export type { LinkProps, AnchorLike } from "./components/Link/Link.js"

// ── Form primitives ─────────────────────────────────────────────────────────
export { Field, Label, ValidationMessage } from "./components/Field/Field.js"
export { Input } from "./components/Input/Input.js"
export { Checkbox } from "./components/Checkbox/Checkbox.js"
export { Select } from "./components/Select/Select.js"

// ── Data display ────────────────────────────────────────────────────────────
export { Badge } from "./components/Badge/Badge.js"
export { Tag } from "./components/Tag/Tag.js"
export { Table } from "./components/Table/Table.js"
export type { TableColumn } from "./components/Table/Table.js"

// ── Disclosure & feedback ───────────────────────────────────────────────────
export { Accordion } from "./components/Accordion/Accordion.js"
export type { AccordionEntry } from "./components/Accordion/Accordion.js"
export { Tabs } from "./components/Tabs/Tabs.js"
export type { TabItem } from "./components/Tabs/Tabs.js"
export { Dialog } from "./components/Dialog/Dialog.js"
export { Toast } from "./components/Toast/Toast.js"

// ── Icons ───────────────────────────────────────────────────────────────────
export * from "./components/Icons/Icons.js"

// `cn` is re-exported because consumers extending these components via
// `className` need the same clsx + tailwind-merge conflict resolution the
// components use internally; mixing in a different merge loses overrides.
export { cn } from "./lib/cn.js"
