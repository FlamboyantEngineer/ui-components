#!/usr/bin/env node
// Verifies that the reference stylesheet draws on one token set (UIC-LABS-3.5): partials use the
// base tokens instead of literal colours, radii, type, focus rings, state opacity and durations;
// every token is defined once, used, and not a literal copy of another; component-scoped tokens
// carry their partial's name. A state rule never sizes or places a box (UIC-LABS-3.6), and a
// control takes its height from the control scale at every size (UIC-LABS-3.7).

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dirFlag = process.argv.indexOf('--dir');
const referenceDir =
  dirFlag === -1 ? join(import.meta.dirname, '..', 'labs', 'reference') : process.argv[dirFlag + 1];
const exemptMarker = 'token-exempt:';
const layoutExemptMarker = 'layout-exempt:';
const problems = [];

const stripComments = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.includes(exemptMarker) || comment.includes(layoutExemptMarker)
      ? comment
      : comment.replace(/[^\n]/g, ' '),
  );

function splitSelectors(text) {
  const selectors = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
    } else if (character === '"' || character === "'") quote = character;
    else if (character === '(' || character === '[') depth += 1;
    else if (character === ')' || character === ']') depth -= 1;
    else if (character === ',' && depth === 0) {
      selectors.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(text.slice(start).trim());
  return selectors;
}

/** Each declaration with its selectors, property, value and original line, from one stylesheet. */
function readDeclarations(file) {
  const css = stripComments(readFileSync(join(referenceDir, file), 'utf8'));
  const declarations = [];
  const rulePattern = /([^{}]*)\{([^{}]*)\}/g;
  for (const rule of css.matchAll(rulePattern)) {
    const selectors = splitSelectors(rule[1]);
    const bodyStart = rule.index + rule[1].length + 1;
    for (const match of rule[2].matchAll(
      /(--[\w-]+|[a-z-]+)\s*:\s*([^;]+);([ \t]*\/\*[\s\S]*?\*\/)?/g,
    )) {
      const line = css.slice(0, bodyStart + match.index).split('\n').length;
      const comment = match[3] ?? '';
      const isExempt = comment.includes(exemptMarker);
      const isLayoutExempt = comment.includes(layoutExemptMarker);
      for (const selector of selectors)
        declarations.push({
          file,
          selector,
          property: match[1],
          value: match[2].trim(),
          line,
          isExempt,
          isLayoutExempt,
        });
    }
  }
  return declarations;
}

const files = readdirSync(referenceDir)
  .filter((file) => file.endsWith('.css'))
  .sort();
const declarations = files.flatMap(readDeclarations);
const where = (declaration) => `labs/reference/${declaration.file}:${declaration.line}`;

const colourLiteral =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|\b(?:white|black|red|green|blue|gray|grey|yellow|orange|purple|pink)\b/i;
const radiusValue =
  /^(?:0|50%|25%|inherit|var\(--ref-radius(?:-[a-z]+)?\)|calc\(.*var\(--ref-radius.*\))$/;
const fontSizeValue =
  /^(?:inherit|[\d.]+(?:em|rem|%)|var\(--ref-font-size(?:-[\w]+)?\)|calc\(.*\))$/;
const fontWeightValue = /^(?:inherit|normal|400|var\(--ref-font-weight-[a-z]+\))$/;
const literalDuration = /(?<![\w.-])(?:\d*\.)?\d+m?s\b/;
// States a person or a field moves through; read-only, expanded, editing, empty and loading are modes.
const transientState =
  /\[data-(?:selected|current|current-within|hovered|pressed|focused|focus-visible|focus-within|dirty|validation|pending|invalid|dragging|drop-target|disabled)[\]=]|:(?:hover|active|focus|focus-visible|focus-within|checked)\b/;
const layoutProperty =
  /^(?:display|font(?:-(?:weight|size))?|letter-spacing|line-height|(?:min-|max-)?(?:width|height|inline-size|block-size)|(?:padding|margin)(?:-[a-z-]+)?|border(?:-[a-z]+)*-width|(?:row-|column-)?gap|grid-template(?:-[a-z]+)?|flex(?:-basis)?)$/;

function isTokenFont(value) {
  if (value === 'inherit') return true;
  // Line height is independent of the type scale, including a fixed height in a code view.
  const parts = value.replace(/\/\s*(?:var\([^)]*\)|[\w.%+-]+)/, '').split(/\s+(?![^(]*\))/);
  return (
    /var\(--ref-(?:font|mono|script)\)$/.test(value) &&
    !parts.some(
      (part) =>
        /^[\d.]+px$/.test(part) ||
        (/^(?:bold|bolder|lighter|[1-9]00)$/.test(part) && !fontWeightValue.test(part)),
    )
  );
}

for (const declaration of declarations) {
  const { file, selector, property, value, isExempt, isLayoutExempt } = declaration;
  if (file === 'base.css' || property.startsWith('--')) continue;
  const isStateRule = transientState.test(selector.replace(/:not\([^)]*\)/g, ''));
  if (isStateRule && layoutProperty.test(property) && !isLayoutExempt) {
    problems.push(
      `${where(declaration)}: ${property} changes with a state, so the state moves the layout; mark it with colour, background, outline, shadow or a positioned part`,
    );
  }
  if (isExempt) continue;
  const parts = value.split(/\s+(?![^(]*\))/);
  if (colourLiteral.test(value))
    problems.push(`${where(declaration)}: literal colour in ${property}; use a colour token`);
  if (property.endsWith('radius') && parts.some((part) => !radiusValue.test(part))) {
    problems.push(`${where(declaration)}: ${property} "${value}" is not a radius token`);
  }
  if (property === 'font-size' && !fontSizeValue.test(value)) {
    problems.push(`${where(declaration)}: font-size "${value}" is not a type token`);
  }
  if (property === 'font-weight' && !fontWeightValue.test(value)) {
    problems.push(`${where(declaration)}: font-weight "${value}" is not a weight token`);
  }
  if (property === 'font' && !isTokenFont(value)) {
    problems.push(`${where(declaration)}: font "${value}" is not a type token shorthand`);
  }
  if (
    /^(?:transition|animation)(?:-duration|-delay)?$/.test(property) &&
    literalDuration.test(value.replace(/^0s$/, ''))
  ) {
    problems.push(
      `${where(declaration)}: literal duration in ${property}; use --ref-duration or --ref-duration-fast`,
    );
  }
  if (/^(?:outline|box-shadow)$/.test(property) && /\dpx\s+\w*\s*var\(--ref-focus\)/.test(value)) {
    problems.push(
      `${where(declaration)}: ${property} builds a focus ring by hand; use a --ref-focus-* token`,
    );
  }
  if (
    property === 'opacity' &&
    /\[data-(?:disabled|dragging)\]/.test(selector) &&
    !/^(?:1|var\(--ref-.*\))$/.test(value)
  ) {
    problems.push(
      `${where(declaration)}: opacity for a disabled or dragged state; use --ref-disabled-opacity or --ref-dragging-opacity`,
    );
  }
  const isDirtyRule = /\[data-dirty\]/.test(selector.replace(/:not\([^)]*\)/g, ''));
  const dirtyMark = { 'border-color': 'var(--ref-dirty)', outline: 'var(--ref-dirty-outline)' };
  if (
    isDirtyRule &&
    /^(?:border(?!-[a-z-]*radius)|outline(?!-offset)|box-shadow)/.test(property) &&
    dirtyMark[property] !== value
  ) {
    problems.push(
      `${where(declaration)}: a dirty field marks its whole frame; use border-color: var(--ref-dirty) or outline: var(--ref-dirty-outline)`,
    );
  }
}

// Controls: a height from the control scale names the scale step of the rule's own size, and the
// size variants of an element whose height comes from the scale take theirs from it too.
const heightProperty = /^(?:height|min-height|block-size)$/;
const sizeAttribute = /\[data-size='(\w+)'\]/;
const controlHeight = /var\(--ref-control-height-(\w+)\)/g;
const withoutSize = (selector) => selector.replace(/\[data-size='\w+'\]/g, '');
const scaledElements = new Set(
  declarations
    .filter(
      ({ selector, property, value }) =>
        heightProperty.test(property) &&
        /--ref-control-height-/.test(value) &&
        !sizeAttribute.test(selector),
    )
    .map(({ file, selector }) => `${file}|${selector}`),
);
for (const declaration of declarations) {
  const { file, selector, property, value } = declaration;
  const size = sizeAttribute.exec(selector)?.[1];
  if (!size || !heightProperty.test(property)) continue;
  const steps = [...value.matchAll(controlHeight)].map((match) => match[1]);
  if (steps.some((step) => step !== size)) {
    problems.push(
      `${where(declaration)}: a ${size} control takes --ref-control-height-${size}, not --ref-control-height-${steps.find((step) => step !== size)}`,
    );
  }
  if (steps.length === 0 && scaledElements.has(`${file}|${withoutSize(selector)}`)) {
    problems.push(
      `${where(declaration)}: ${property} "${value}" sizes a control off the scale; use var(--ref-control-height-${size})`,
    );
  }
}

// Every token is defined, used, scoped by name and not a literal copy of another.
const defined = new Map();
for (const declaration of declarations) {
  if (!declaration.property.startsWith('--ref-')) continue;
  const entries = defined.get(declaration.property) ?? [];
  entries.push(declaration);
  defined.set(declaration.property, entries);
}
const used = new Set(
  files.flatMap((file) =>
    [
      ...stripComments(readFileSync(join(referenceDir, file), 'utf8')).matchAll(
        /var\(\s*(--ref-[\w-]+)/g,
      ),
    ].map((match) => match[1]),
  ),
);
const baseTokens = new Set(
  [...defined]
    .filter(([, entries]) => entries.some((entry) => entry.file === 'base.css'))
    .map(([name]) => name),
);

for (const name of used) {
  if (!defined.has(name)) problems.push(`${name} is used but never defined`);
}
for (const [name, entries] of defined) {
  if (!used.has(name)) problems.push(`${where(entries[0])}: ${name} is defined but never used`);
  if (baseTokens.has(name)) continue;
  const owners = new Set(entries.map((entry) => entry.file.replace(/\.css$/, '')));
  for (const owner of owners) {
    if (!name.startsWith(`--ref-${owner}-`)) {
      problems.push(
        `${where(entries[0])}: ${name} is scoped to ${owner}.css, so it is named --ref-${owner}-…`,
      );
    }
  }
}

// Literal duplicates: two base tokens holding the same literal in every theme.
const themeValue = (name, theme) => {
  const entries = defined.get(name).filter((entry) => entry.file === 'base.css');
  const dark = entries.find((entry) => entry.selector.includes("data-theme='dark'"));
  const light = entries.find((entry) => !entry.selector.includes('data-theme'));
  return (theme === 'dark' && dark ? dark : light)?.value;
};
const seen = new Map();
for (const name of baseTokens) {
  const light = themeValue(name, 'light');
  if (!light || /var\(/.test(light) || !colourLiteral.test(light)) continue;
  const key = `${light}|${themeValue(name, 'dark')}`;
  if (seen.has(key))
    problems.push(`${name} repeats the value of ${seen.get(key)} in both themes; alias it`);
  else seen.set(key, name);
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} reference token problem(s).`);
  process.exit(1);
}
console.log(
  `${files.length} reference stylesheets use ${baseTokens.size} base tokens consistently.`,
);
