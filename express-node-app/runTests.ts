#!/usr/bin/env -S tsx
import test from "node:test";
import reporters from "node:test/reporters";
import os from "node:os";

type NodeTestRunnerParameters = Required<Parameters<typeof test.run>>;
type NodeTestRunnerOptions = NodeTestRunnerParameters[0];

const options: NodeTestRunnerOptions = {
  globPatterns: [
    "src/**/*.test.ts",
  ],
  concurrency: os.availableParallelism() - 1,
  setup(testsStream) {
    // Log test failures to console
    testsStream.on('test:fail', (testFail) => {
      console.error(testFail);
      process.exitCode = 1; // must be != 0, to avoid false positives in CI pipelines
    });
    // coverage reporter
    const isTTY = process.stdout.isTTY;
    const reporter = isTTY ? reporters.spec : reporters.tap;
    testsStream.compose(reporter).pipe(process.stdout);
  },
  // ... 
} satisfies NodeTestRunnerOptions;

const run = (proc: NodeJS.Process, options?: NodeTestRunnerOptions) => {
  proc.on('unhandledRejection', (error) => {
    throw error;
  });
  // ... 
  return test.run(options)
}

run(global.process, options);