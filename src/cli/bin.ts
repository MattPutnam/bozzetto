#!/usr/bin/env node
/** The `bozzetto` executable: connects `run` to the real process, files and terminal. */
import { mkdirSync, writeFileSync } from "node:fs";
import { run } from "./cli";

run(process.argv.slice(2), {
  stdout: contents => process.stdout.write(contents),
  stderr: text => process.stderr.write(text),
  writeFile: (path, contents) => writeFileSync(path, contents),
  mkdir: path => mkdirSync(path, { recursive: true }),
}).then(code => (process.exitCode = code));
