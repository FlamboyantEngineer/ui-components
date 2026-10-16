// Asserts that rendered markup matches the hook tables in specs/ (specs/README.md#hooks).

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type HookKind = 'root' | 'slot' | 'attribute' | 'state' | 'property';

export interface SpecHook {
  hook: string;
  kind: HookKind;
  /** Allowed values for an attribute or state; `null` allows any value. */
  values: string[] | null;
}

export interface SpecHooks {
  name: string;
  hooks: SpecHook[];
}

/** Third-party markers that are not part of any component's contract. */
const IGNORED_DATA = /^data-(rac|react-aria-[a-z-]+|slot|testid|lab-[a-z-]+)$/;

// Vitest runs from the repository root.
const specsDir = join(process.cwd(), 'specs');

/** Parses the table under `## Hooks` in a spec. */
export function parseHookTable(name: string, markdown: string): SpecHooks {
  const lines = markdown.split('\n');
  const start = lines.indexOf('## Hooks');
  if (start === -1) return { name, hooks: [] };
  const hooks: SpecHook[] = [];
  const rows = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('#')) break;
    if (line.startsWith('|')) rows.push(line);
  }
  for (const row of rows.slice(2)) {
    const [hookCell = '', kind = '', valuesCell = ''] = row
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    const hook = hookCell.match(/`([^`]+)`/)?.[1];
    if (!hook) continue;
    const values = [...valuesCell.matchAll(/`([^`]+)`/g)].map((match) => match[1] as string);
    hooks.push({ hook, kind: kind as HookKind, values: values.length > 0 ? values : null });
  }
  return { name, hooks };
}

let registry: Map<string, SpecHooks> | null = null;

/** Every spec's hook table, keyed by spec name (file name without `.md`). */
export function specRegistry(): Map<string, SpecHooks> {
  if (!registry) {
    registry = new Map();
    for (const file of readdirSync(specsDir)) {
      if (!file.endsWith('.md') || file === 'README.md') continue;
      const name = file.slice(0, -'.md'.length);
      registry.set(name, parseHookTable(name, readFileSync(join(specsDir, file), 'utf8')));
    }
  }
  return registry;
}

export interface HookExpectations {
  /** Slots that must be rendered, by slot name (`icon`) or full class; `'all'` requires every declared slot. */
  slots?: readonly string[] | 'all';
  /** `data-*` attributes the test passed as caller attributes; they are exempt from the spec check. */
  callerAttributes?: readonly string[];
}

function classHooks(spec: SpecHooks) {
  return spec.hooks.filter((entry) => entry.kind === 'root' || entry.kind === 'slot');
}

/**
 * Fails unless the markup under `container` matches the spec:
 * - every `ui-*` class is declared by some spec;
 * - every `data-*` attribute and `--ui-*` property on a hooked element is declared by a spec that owns
 *   one of that element's classes, with an allowed value;
 * - the spec's root renders, and so do the required slots.
 */
export function expectHooksMatchSpec(
  container: Element,
  spec: string | SpecHooks,
  expectations: HookExpectations = {},
): void {
  const target = typeof spec === 'string' ? specRegistry().get(spec) : spec;
  if (!target) throw new Error(`No spec named ${String(spec)} in specs/`);

  const owners = new Map<string, SpecHooks>();
  for (const entry of [...specRegistry().values(), target]) {
    for (const { hook } of classHooks(entry)) owners.set(hook, entry);
  }
  const callerAttributes = new Set(expectations.callerAttributes ?? []);
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const element of [container, ...container.querySelectorAll('*')]) {
    const hookClasses = [...element.classList].filter((token) => token.startsWith('ui-'));
    if (hookClasses.length === 0) continue;
    const specs = new Set<SpecHooks>();
    for (const token of hookClasses) {
      seen.add(token);
      const owner = owners.get(token);
      if (owner) specs.add(owner);
      else problems.push(`class ${token} is not declared in any spec`);
    }
    const allowed = new Map<string, string[] | null>();
    for (const owner of specs) {
      for (const entry of owner.hooks) {
        if (entry.kind === 'root' || entry.kind === 'slot') continue;
        const previous = allowed.get(entry.hook);
        allowed.set(
          entry.hook,
          previous === null || entry.values === null
            ? null
            : [...(previous ?? []), ...entry.values],
        );
      }
    }
    const label = hookClasses.join(' ');
    for (const attribute of element.attributes) {
      if (!attribute.name.startsWith('data-') || IGNORED_DATA.test(attribute.name)) continue;
      if (callerAttributes.has(attribute.name)) continue;
      if (!allowed.has(attribute.name)) {
        problems.push(`${label} carries undeclared ${attribute.name}="${attribute.value}"`);
        continue;
      }
      const values = allowed.get(attribute.name);
      if (values && !values.includes(attribute.value)) {
        problems.push(
          `${label} has ${attribute.name}="${attribute.value}", expected one of ${values.join(', ')}`,
        );
      }
    }
    const style = (element as HTMLElement).style;
    for (let index = 0; style && index < style.length; index += 1) {
      const property = style.item(index);
      if (property.startsWith('--ui-') && !allowed.has(property)) {
        problems.push(`${label} sets undeclared custom property ${property}`);
      }
    }
  }

  const roots = target.hooks.filter((entry) => entry.kind === 'root').map((entry) => entry.hook);
  if (!roots.some((root) => seen.has(root))) {
    problems.push(`none of the roots ${roots.join(', ')} rendered`);
  }
  const declaredSlots = target.hooks
    .filter((entry) => entry.kind === 'slot')
    .map((entry) => entry.hook);
  const required =
    expectations.slots === 'all'
      ? declaredSlots
      : (expectations.slots ?? []).map((slot) =>
          slot.startsWith('ui-')
            ? slot
            : (declaredSlots.find((hook) => hook.endsWith(`__${slot}`)) ??
              `<undeclared slot ${slot}>`),
        );
  for (const slot of required) {
    if (!seen.has(slot)) problems.push(`slot ${slot} did not render`);
  }

  if (problems.length > 0) {
    throw new Error(`Hooks do not match spec ${target.name}:\n  ${problems.join('\n  ')}`);
  }
}
