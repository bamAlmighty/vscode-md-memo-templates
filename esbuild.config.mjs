import { build } from "esbuild";

await build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  outfile: "dist/extension.js",
  external: ["vscode"]
});
