// The settings the shared checks take from the repository that runs them, read from the
// `tooling.config.mjs` at its root (specs/TOOLING.md, UIC-TOOLING-1.2).

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CONFIG_FILE = 'tooling.config.mjs';

/**
 * @typedef {object} SpecsConfig
 * @property {string} prefix Requirement IDs start with it and a hyphen, such as `UIC` for `UIC-BUTTON-1.1`.
 * @property {string} [hookPrefix] Hook names in a spec's `## Hooks` table start with it and a hyphen,
 *   such as `ui` for `ui-button`; without it, a spec declares no hooks.
 * @property {boolean} [everyModuleImplemented] Every library module in `src/` (tests and `index.ts`
 *   files aside) is the `Implementation:` of some requirement.
 */

/**
 * @typedef {object} StructureLayer
 * @property {string[]} imports The other layers its modules may import.
 * @property {boolean} [browser] Its modules run in a browser, so they import no Node module.
 */

/**
 * @typedef {object} StructureConfig
 * @property {string[]} names Directories whose files and directories are kebab-case.
 * @property {string} [cyclesAcross] Only a cycle that spans two directories under it is reported,
 *   such as `src/components`; without it, every cycle between library modules is.
 * @property {boolean} [typeImportCycles] Type-only imports count towards a cycle.
 * @property {Record<string, StructureLayer>} [layers] The directories under `src/` whose imports are
 *   limited, by name.
 * @property {(context: { root: string }) => string[]} [rules] The repository's own structure rules,
 *   returning their problems.
 */

/**
 * @typedef {object} ToolingConfig
 * @property {SpecsConfig} specs
 * @property {StructureConfig} structure
 * @property {{ verbatim?: Record<string, string> }} [references] Files checked byte for byte against
 *   the installed package file they copy (`'labs/vendor/x.js': 'x/dist/x.js'`) instead of scanned.
 */

/**
 * The configuration of the repository at `dir`.
 * @param {string} dir
 * @returns {Promise<ToolingConfig>}
 */
export async function loadConfig(dir) {
  const file = join(dir, CONFIG_FILE);
  if (!existsSync(file)) throw new Error(`${CONFIG_FILE} is missing at the repository root ${dir}`);
  const module = /** @type {{ default: ToolingConfig }} */ (await import(pathToFileURL(file).href));
  return module.default;
}
