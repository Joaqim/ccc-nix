#!/usr/bin/env -S tsx
/* eslint-disable import/no-extraneous-dependencies */
import esbuild from "esbuild";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import process from "node:process";
import { minify } from "html-minifier-terser";
import InlineImagePlugin from "esbuild-plugin-inline-image";
import index from "./src/frontend/index.htb";

(async () => {
  await mkdir("./dist/frontend", { recursive: true }).catch(() => {
    // ignore
  });

  await esbuild
    .build({
      entryPoints: ["src/frontend/app.ts"],
      bundle: true,
      minify: true,
      format: "esm",
      target: ["esnext"],
      write: true,
      outdir: "./dist/frontend",
      plugins: [InlineImagePlugin()],
    })
    .catch(() => process.exit(1));

  await esbuild
    .build({
      entryPoints: ["src/backend/index.ts"],
      platform: "node",
      bundle: true,
      minify: true,
      format: "esm",
      target: ["es2022"],
      write: true,
      outdir: "./dist/backend",
    })
    .catch(() => process.exit(1));

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
