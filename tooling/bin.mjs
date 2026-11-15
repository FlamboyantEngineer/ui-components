#!/usr/bin/env node
// `ui-components-tooling <command> [options]`: the checks this package shares with the repositories
// built on it (specs/TOOLING.md, UIC-TOOLING-1.3). Each runs in the working directory, which npm sets
// to the package root for its scripts, with that repository's tooling.config.mjs.

const COMMANDS = ['check-references', 'check-specs', 'check-structure'];

const [command] = process.argv.splice(2, 1);
if (!command || !COMMANDS.includes(command)) {
  console.error(`Usage: ui-components-tooling <${COMMANDS.join(' | ')}> [options]`);
  process.exit(2);
}
await import(new URL(`./${command}.mjs`, import.meta.url).href);
