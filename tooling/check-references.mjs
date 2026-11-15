// Fails when any authored file (or file path) mentions a host application (specs/TOOLING.md,
// UIC-TOOLING-2.1). The denylist is stored base64-encoded so no repository contains the terms it
// forbids; every repository that runs the check shares this one list.
//
//   ui-components-tooling check-references              scan tracked and untracked, non-ignored files
//   ui-components-tooling check-references --dir <path> scan every file under <path> (e.g. an unpacked tarball)
//   ui-components-tooling check-references --encode <regex> [flags]   print a denylist entry
//   --denylist <path> reads another denylist file of the same shape (the check's own tests use one)

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.mjs';
import { option, relativePosix, reportProblems, root, walk } from './lib/script.mjs';

const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|pdf|woff2?|ttf|otf|eot|zip|gz|tgz|wasm|mp4|webm)$/i;
// Generated third-party metadata, not authored content.
const GENERATED = new Set(['package-lock.json']);
const DENYLIST = fileURLToPath(new URL('reference-denylist.json', import.meta.url));

const args = process.argv.slice(2);

if (args[0] === '--encode') {
  const [, source, flags = 'i'] = args;
  if (!source) {
    console.error('Usage: check-references.mjs --encode <regex> [flags]');
    process.exit(2);
  }
  new RegExp(source, flags);
  console.log(JSON.stringify({ source: Buffer.from(source).toString('base64'), flags }));
  process.exit(0);
}

// Upstream vocabulary in a vendored copy may overlap the denylist, so the repository lists such
// copies and only exact copies of the installed package files are accepted.
const resolvePackage = createRequire(join(root, 'package.json')).resolve;
const vendorFiles = new Map(Object.entries((await loadConfig(root)).references?.verbatim ?? {}));

function loadDenylist() {
  const denylistPath = resolve(option('denylist', DENYLIST));
  const entries = JSON.parse(readFileSync(denylistPath, 'utf8'));
  return entries.map((entry, index) => ({
    index,
    pattern: new RegExp(Buffer.from(entry.source, 'base64').toString('utf8'), entry.flags + 'g'),
  }));
}

function listFiles() {
  const dirOption = option('dir');
  if (dirOption !== undefined) {
    const dir = resolve(dirOption);
    return { base: dir, files: walk(dir).map((file) => relativePosix(dir, file)) };
  }
  const output = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    // A large checkout lists more than the default 1 MB of paths.
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  const files = output.split('\0').filter((file) => file && !GENERATED.has(file));
  return { base: root, files };
}

function lineOf(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

const denylist = loadDenylist();
const { base, files } = listFiles();
const findings = [];

for (const file of files) {
  const vendor = vendorFiles.get(file);
  if (vendor) {
    try {
      const actual = readFileSync(join(base, file));
      const expected = readFileSync(resolvePackage(vendor));
      if (!actual.equals(expected)) findings.push(`${file}: differs from the installed ${vendor}`);
    } catch {
      findings.push(`${file}: cannot verify against the installed ${vendor}`);
    }
    continue;
  }
  for (const { index, pattern } of denylist) {
    pattern.lastIndex = 0;
    if (pattern.test(file)) findings.push(`${file}: path matches denylist entry #${index}`);
  }
  if (BINARY.test(file)) continue;
  let text;
  try {
    text = readFileSync(join(base, file), 'utf8');
  } catch {
    continue;
  }
  for (const { index, pattern } of denylist) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      findings.push(`${file}:${lineOf(text, match.index)}: matches denylist entry #${index}`);
      if (match[0].length === 0) pattern.lastIndex += 1;
    }
  }
}

reportProblems(findings, {
  heading: 'Host references found. Rewrite these in neutral terms',
  hint: 'Decode an entry with: node -e "console.log(Buffer.from(process.argv[1], \'base64\').toString())" <source>',
  success: `No host references in ${files.length} files (${denylist.length} denylist entries).`,
});
