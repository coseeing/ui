// CSS half of the build. Emits two independent consumption paths into dist/:
//
//   dist/styles.css      prebuilt + self-contained (Tailwind preflight, tokens,
//                        typography, every utility the components use). For
//                        consumers with no Tailwind of their own.
//
//   dist/theme.css       raw @theme source, copied verbatim alongside its three
//   dist/tokens.css      partials. For Tailwind v4 consumers, who @import it
//   dist/base.css        into their own entry and get one deduplicated
//   dist/typography.css  stylesheet instead of two overlapping ones.
//
// Runs after `build:js`, which owns `clean` — this script only adds to dist.

import { execFileSync } from "node:child_process"
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const styles = join(root, "src", "styles")
const dist = join(root, "dist")

mkdirSync(dist, { recursive: true })

// The compiled stylesheet. --minify is deliberately off: this ships as a
// dependency, and the consumer's own pipeline minifies. Readable output also
// makes "is my token actually in here?" answerable with grep.
execFileSync(
  "npx",
  [
    "@tailwindcss/cli",
    "--input",
    join(styles, "index.css"),
    "--output",
    join(dist, "styles.css"),
  ],
  { cwd: root, stdio: "inherit" },
)

for (const file of ["theme.css", "tokens.css", "base.css", "typography.css"]) {
  copyFileSync(join(styles, file), join(dist, file))
}

// Guard against the silent failure mode of this setup: Tailwind emitting a
// stylesheet that has the tokens but not the component utilities, which renders
// as "components look unstyled" far downstream. Assert on a class that only
// exists inside a component (Button's pill radius) plus a token and a
// typography class.
const css = readFileSync(join(dist, "styles.css"), "utf8")
const required = [
  ["--color-teal-PRIMARY", "brand tokens"],
  [".typography-strong1", "typography classes"],
  ["62.5%", "root font-size from base.css"],
  [".rounded-\\[62px\\]", "utilities scanned from component sources"],
]
const missing = required.filter(([needle]) => !css.includes(needle))
if (missing.length > 0) {
  console.error("dist/styles.css is incomplete — missing:")
  for (const [needle, what] of missing) console.error(`  ${what} (${needle})`)
  process.exit(1)
}

const kb = (statSync(join(dist, "styles.css")).size / 1024).toFixed(1)
console.log(`CSS  dist/styles.css  ${kb} kB`)
console.log("CSS  dist/{theme,tokens,base,typography}.css  (raw @theme source)")
