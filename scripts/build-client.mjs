/**
 * Builds all client-side TypeScript entry points using esbuild.
 * Each file in src/client/scripts/ becomes one bundle in public/scripts/.
 * Run with --watch to rebuild on every file change.
 */
import * as esbuild from "esbuild";
import { readdirSync, cpSync } from "fs";

const watch = process.argv.includes("--watch");

// Copy static files that don't need compilation
cpSync("src/client/pages", "public/pages", { recursive: true });
cpSync("src/client/locales", "public/locales", { recursive: true });
console.log("Copied pages and locales to public/");

const entryPoints = readdirSync("src/client/scripts")
  .filter((f) => f.endsWith(".ts"))
  .map((f) => `src/client/scripts/${f}`);

const ctx = await esbuild.context({
  entryPoints,
  bundle: true,
  format: "esm",
  outdir: "public/scripts",
  platform: "browser",
  target: "es2022",
	  sourcemap: false,
  minify: !watch,
});

if (watch) {
  await ctx.watch();
  console.log("Watching client scripts for changes…");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("Client scripts built.");
}
