#!/usr/bin/env -S tsx
/* eslint-disable import/no-extraneous-dependencies */
import esbuild from "esbuild";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import process from "node:process";
import { livereloadPlugin as LiveReloadPlugin } from "@jgoz/esbuild-plugin-livereload";
import { minify } from "html-minifier-terser";
import InlineImagePlugin from "esbuild-plugin-inline-image";
import index from "./src/frontend/index.htb";

const watchPlugin = {
  name: "rebuild-notify",
  setup(build) {
    build.onEnd((result) => {
      console.log(`build ended with ${result.errors.length} errors`);
    });
  },
};

const run = async () => {
  await mkdir("./dist/frontend", { recursive: true }).catch(() => {
    // ignore
  });

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

  const frontendCtx = await esbuild
    .context({
      entryPoints: ["src/frontend/app.ts"],
      bundle: true,
      metafile: true,
      format: "esm",
      target: ["esnext"],
      write: true,
      outdir: "./dist/frontend",
      plugins: [InlineImagePlugin(), LiveReloadPlugin(), watchPlugin],
    })
    .catch(() => process.exit(1));

  await frontendCtx.watch();
};

run();
