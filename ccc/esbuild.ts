#!/usr/bin/env -S tsx
/* eslint-disable import/no-extraneous-dependencies */
import esbuild from "esbuild";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import process from "node:process";
import { livereloadPlugin as LiveReloadPlugin } from "@jgoz/esbuild-plugin-livereload";
import { minify } from "html-minifier-terser";
import InlineImagePlugin from "esbuild-plugin-inline-image";
import index from "./src/frontend/index.htb";

const watchMode: boolean = process.argv.includes("--watch");

(async () => {
  await mkdir("./dist/frontend", { recursive: true });

  await esbuild
    .build({
      entryPoints: ["src/frontend/app.ts"],
      bundle: true,
      metafile: watchMode,
      minify: true,
      format: "esm",
      target: ["esnext"],
      write: true,
      outdir: "./dist/frontend",
      plugins: [InlineImagePlugin()].concat(
        watchMode ? [LiveReloadPlugin()] : []
      ),
    })
    .catch(() => process.exit(1));

  //const html = await readFile("public/index.html", "utf8");

  const minifyOptions = {
    collapseWhitespace: true,
    keepClosingSlash: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
  };

  const css = await readFile("src/frontend/index.css", "utf8");

  await writeFile(
    "dist/frontend/index.html",
    `${await minify(index(css), minifyOptions)}`
  );
})();
