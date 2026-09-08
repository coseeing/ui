import { setProjectAnnotations } from "@storybook/react-vite"
import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview"
import { beforeAll } from "vitest"
import * as previewAnnotations from "./preview"

// Load the same preview config Storybook uses, so a test renders a story
// exactly as the Storybook UI does — same global stylesheet, same parameters.
//
// The a11y annotations are what make `a11y: { test: "error" }` in preview.ts
// mean something under Vitest: without them axe never runs and `npm test`
// would silently check only the play functions.
const project = setProjectAnnotations([a11yAddonAnnotations, previewAnnotations])

beforeAll(project.beforeAll)
