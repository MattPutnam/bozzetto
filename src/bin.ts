#!/usr/bin/env node
/** The `bozzetto` executable: connects `run` to the real process, files and terminal. */
import { mkdirSync, writeFileSync } from "node:fs";
import { run } from "./cli";

process.exitCode = run(process.argv.slice(2), {
  stdout: text => process.stdout.write(text),
  stderr: text => process.stderr.write(text),
  writeFile: (path, contents) => writeFileSync(path, contents),
  mkdir: path => mkdirSync(path, { recursive: true }),
});
