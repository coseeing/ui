// Only used by Storybook's Vite dev/build pass, so it can compile
// src/styles/index.css. The shipped stylesheet is built by the Tailwind CLI in
// scripts/build-css.mjs and does not go through PostCSS here.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
