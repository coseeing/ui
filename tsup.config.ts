import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx", "!src/**/*.stories.tsx"],
  outDir: "dist",
  format: ["esm"],
  target: "es2022",
  // Transpile-only, one output file per source file. Bundling would collapse
  // the module graph and hoist the per-file "use client" directives into a
  // single boundary, which would make the whole library client-side for React
  // Server Component consumers. Preserving modules also means a consumer's
  // bundler can tree-shake unused components out of the barrel export.
  bundle: false,
  // Types come from `tsc -p tsconfig.build.json`: tsup's dts step bundles, and
  // bundled .d.ts cannot describe a preserved module graph.
  dts: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
})
