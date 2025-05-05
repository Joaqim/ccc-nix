#!/usr/bin/env node
import process from "node:process";
import setupApi from "./setupApi";

const PORT = (process.env.PORT as unknown as number) || 8080;

const app = setupApi();

// https://stackoverflow.com/a/76508414
// TODO: Consider expanding this implementation, see link above
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

app.listen(PORT, () => {
  console.log("🚀 Backend running at: http://localhost:%d", PORT);
  console.log("Press Ctrl+C to stop");
});
