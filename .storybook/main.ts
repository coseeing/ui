import type { StorybookConfig } from "@storybook/react-vite"

// react-vite, not nextjs-vite: this package has no Next dependency any more.
// Storybook is the development harness for the library — the components are
// developed and reviewed here, not inside a consuming app.
const config: StorybookConfig = {
  stories: ["../src/components/**/*.stories.@(ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "storybook-addon-pseudo-states",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
}

export default config
