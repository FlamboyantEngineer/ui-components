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

export interface HookExpectations {
  /** Slots that must be rendered, by slot name (`icon`) or full class; `'all'` requires every declared slot. */
  slots?: readonly string[] | 'all';
  /** `data-*` attributes the test passed as caller attributes; they are exempt from the spec check. */
  callerAttributes?: readonly string[];
}

/** What the element checks share: class owners, exempt attributes, and the findings so far. */
interface CheckContext {
  owners: Map<string, SpecHooks>;
  callerAttributes: Set<string>;
  problems: string[];
  seen: Set<string>;
}

/** Third-party markers that are not part of any component's contract. */
const ignoredData = /^data-(rac|react-aria-[a-z-]+|slot|testid|lab-[a-z-]+)$/;

// Vitest runs from the repository root.
const specsDir = join(process.cwd(), 'specs');

let registry: Map<string, SpecHooks> | null = null;

function isClassHook(entry: SpecHook): boolean {
  return entry.kind === 'root' || entry.kind === 'slot';
}

/** The data attributes and properties the specs owning an element allow, with their values. */
function collectAllowedHooks(specs: Iterable<SpecHooks>): Map<string, string[] | null> {
  const allowed = new Map<string, string[] | null>();
  for (const entry of [...specs].flatMap((spec) => spec.hooks)) {
    if (isClassHook(entry)) continue;
    const previous = allowed.get(entry.hook);
    const merged =
      previous === null || entry.values === null ? null : [...(previous ?? []), ...entry.values];
    allowed.set(entry.hook, merged);
  }
  return allowed;
}

/** The specs owning an element's hook classes; undeclared classes are reported. */
function findOwners(hookClasses: string[], context: CheckContext): Set<SpecHooks> {
  const specs = new Set<SpecHooks>();
  for (const token of hookClasses) {
    context.seen.add(token);
    const owner = context.owners.get(token);
    if (owner) specs.add(owner);
    else context.problems.push(`class ${token} is not declared in any spec`);
  }
  return specs;
}

function checkAttribute(attribute: Attr, allowed: Map<string, string[] | null>, label: string) {
  if (!allowed.has(attribute.name)) {
    return `${label} carries undeclared ${attribute.name}="${attribute.value}"`;
  }
  const values = allowed.get(attribute.name);
  if (values && !values.includes(attribute.value)) {
    return `${label} has ${attribute.name}="${attribute.value}", expected one of ${values.join(', ')}`;
  }
  return null;
}

function checkElement(element: Element, context: CheckContext): void {
  const hookClasses = [...element.classList].filter((token) => token.startsWith('ui-'));
  if (hookClasses.length === 0) return;
  const allowed = collectAllowedHooks(findOwners(hookClasses, context));
  const label = hookClasses.join(' ');
  for (const attribute of element.attributes) {
    if (!attribute.name.startsWith('data-') || ignoredData.test(attribute.name)) continue;
    if (context.callerAttributes.has(attribute.name)) continue;
    const problem = checkAttribute(attribute, allowed, label);
    if (problem) context.problems.push(problem);
  }
  const style = (element as HTMLElement).style;
  for (let index = 0; style && index < style.length; index += 1) {
    const property = style.item(index);
    if (property.startsWith('--ui-') && !allowed.has(property)) {
      context.problems.push(`${label} sets undeclared custom property ${property}`);
    }
  }
}

/** The slot classes a test requires, resolved from slot names to declared classes. */
function resolveRequiredSlots(target: SpecHooks, slots: HookExpectations['slots']): string[] {
  const declared = target.hooks.filter((entry) => entry.kind === 'slot').map((entry) => entry.hook);
  if (slots === 'all') return declared;
  return (slots ?? []).map((slot) =>
    slot.startsWith('ui-')
      ? slot
      : (declared.find((hook) => hook.endsWith(`__${slot}`)) ?? `<undeclared slot ${slot}>`),
  );
}

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
    for (const { hook } of entry.hooks.filter(isClassHook)) owners.set(hook, entry);
  }
  const callerAttributes = new Set(expectations.callerAttributes ?? []);
  const context: CheckContext = { owners, callerAttributes, problems: [], seen: new Set() };
  for (const element of [container, ...container.querySelectorAll('*')]) {
    checkElement(element, context);
  }

  const { problems, seen } = context;
  const roots = target.hooks.filter((entry) => entry.kind === 'root').map((entry) => entry.hook);
  if (!roots.some((root) => seen.has(root))) {
    problems.push(`none of the roots ${roots.join(', ')} rendered`);
  }
  for (const slot of resolveRequiredSlots(target, expectations.slots)) {
    if (!seen.has(slot)) problems.push(`slot ${slot} did not render`);
  }
  if (problems.length > 0) {
    throw new Error(`Hooks do not match spec ${target.name}:\n  ${problems.join('\n  ')}`);
  }
}
