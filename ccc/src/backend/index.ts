#!/usr/bin/env node
import process from "node:process";
import setupApi from "./setupApi";

const PORT = (process.env.PORT as unknown as number) || 8080;

const app = setupApi();

app.listen(PORT, () => {
  console.log('🚀 http://localhost:%d', PORT);
});