import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { defineConfig } from "vitest/config"

const root = dirname(fileURLToPath(import.meta.url))

// Every story, executed as a test: its `play` function runs and, via the a11y
// addon annotations in vitest.setup.ts, axe runs against the rendered result.
//
// Real Chromium rather than jsdom, and not negotiable for this library: Dialog
// is built on <dialog>.showModal() and Accordion on <details>/<summary>.
// jsdom's stubs for both are incomplete enough that passing tests there would
// say nothing about the browser.
//
// There is no separate Node project: the components carry no pure logic worth
// unit-testing on its own any more. If that changes, add a second entry under
// `test.projects` with `include: ["src/**/*.test.ts"]` and `environment: "node"`.
export default defineConfig({
  plugins: [storybookTest({ configDir: join(root, ".storybook") })],
  // Both of these exist to guarantee exactly one React instance in the browser.
  // Without them a cold cache fails with "Cannot read properties of null
  // (reading 'useState')" — React's null-dispatcher error, i.e. two copies of
  // React — in every story that uses a hook, while a warm cache passes. CI is
  // always cold, so this is not optional.
  //
  // `dedupe` handles resolution; `optimizeDeps.include` handles timing. React
  // is otherwise discovered mid-run and pre-bundled while modules are already
  // being served, so some stories get the raw ESM copy and others the
  // pre-bundled one. Listing it up front pre-bundles it before any story loads.
  resolve: { dedupe: ["react", "react-dom"] },
  optimizeDeps: {
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
    ],
  },
  test: {
    name: "storybook",
    setupFiles: [join(root, ".storybook/vitest.setup.ts")],
    browser: {
      enabled: true,
      headless: true,
      provider: "playwright",
      instances: [{ browser: "chromium" }],
    },
  },
})
