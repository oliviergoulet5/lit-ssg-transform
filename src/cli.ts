#!/usr/bin/env node

import { Command } from "commander";
import { createRequire } from "node:module";
import { run } from "./run.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const program = new Command();

program
  .name("lit-ssg")
  .description("Render Lit web components in generated SSG outputs")
  .version(version)
  .action(async (options) => {
    try {
      await run(options);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });

program.parse();
