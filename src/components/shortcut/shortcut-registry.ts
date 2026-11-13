// Each document's registered shortcuts, and which one a key press answers.

import { isTextEntryTarget } from '../../utils/is-editable-target.js';
import { isElement } from '../../utils/is-element.js';
import {
  formatAriaKeyShortcuts,
  type ShortcutChord,
  type ShortcutSequence,
} from './shortcut-format.js';
import { matchesChord } from './shortcut-match.js';

/** A registered shortcut, read afresh at each key press. */
export interface ShortcutRegistration {
  /** The chords pressed one after another; a single chord is a sequence of one. */
  steps: readonly ShortcutChord[];
  onPress: (event: KeyboardEvent) => void;
  /** The scope's element, or `null` for one that answers anywhere in the document. */
  scope: { readonly current: Element | null } | null;
  isDisabled: boolean;
  allowsEditable: boolean;
  allowsRepeat: boolean;
  allowsReserved: boolean;
  /** How long, in milliseconds, the next chord of a sequence is awaited. */
  sequenceTimeout: number;
}

export interface ShortcutEntry {
  readonly current: ShortcutRegistration;
}

interface Registry {
  entries: Set<ShortcutEntry>;
  /** A sequence under way: the shortcuts it may still complete and the next step they await. */
  pending: { candidates: ShortcutEntry[]; step: number; timer: number } | null;
  owner: Document;
  listener: (event: KeyboardEvent) => void;
}

const registries = new WeakMap<Document, Registry>();

/**
 * A press from inside one of these is left to it: an overlay that blocks the page while open and
 * not leaving (a blocking or anchored modal, a drawer, the command palette, a modal tour), or any
 * `aria-modal` element.
 */
const modalSelector = [
  '.ui-modal:not([data-non-modal]):not([data-exiting])',
  '.ui-drawer:not([data-exiting])',
  '.ui-command-palette:not([data-exiting])',
  '.ui-tour:not([data-non-modal])',
  '[aria-modal="true"]',
].join(', ');

/** Keys pressed on the way to a chord, which neither start nor break a sequence. */
const modifierKeys = new Set(['Alt', 'AltGraph', 'CapsLock', 'Control', 'Meta', 'Shift']);

/** Chords the browser or the system keeps, never answered without `allowsReserved`. */
const reservedChords = [
  'Ctrl+L',
  'Ctrl+N',
  'Ctrl+Q',
  'Ctrl+R',
  'Ctrl+T',
  'Ctrl+W',
  'Ctrl+Shift+N',
  'Ctrl+Shift+T',
  'Ctrl+Shift+W',
  'Ctrl+Tab',
  'Ctrl+Shift+Tab',
  'F5',
  'F11',
  'F12',
];

/** The steps of a chord or sequence, without the chords that have no key. */
export function toShortcutSteps(shortcut: ShortcutChord | ShortcutSequence): ShortcutChord[] {
  const steps: readonly ShortcutChord[] = Array.isArray(shortcut) ? shortcut : [shortcut];
  return steps.filter((step) => formatAriaKeyShortcuts(step) !== '');
}

// Every key press ranks every registered shortcut, so the reserved chords are formatted once and
// each registration's answer is kept for as long as its steps are the same array.
let reservedKeys: ReadonlySet<string> | null = null;
const reservedSteps = new WeakMap<readonly ShortcutChord[], boolean>();

function isReserved(steps: readonly ShortcutChord[]): boolean {
  const known = reservedSteps.get(steps);
  if (known !== undefined) return known;
  reservedKeys ??= new Set(reservedChords.map((chord) => formatAriaKeyShortcuts(chord)));
  const keys = reservedKeys;
  const reserved = steps.some((step) => keys.has(formatAriaKeyShortcuts(step)));
  reservedSteps.set(steps, reserved);
  return reserved;
}

/** Where a press's path enters a modal overlay, found once per press. */
interface PressPath {
  nodes: readonly EventTarget[];
  /** The index of the innermost modal overlay in `nodes`, or -1. */
  modal: number;
}

/**
 * How deep in the press's path a shortcut answers, lower first, or `null` when it does not: a
 * scoped shortcut at its scope's place in the path, a document-wide one after every scope. Inside
 * a modal overlay only the scopes within it answer.
 */
function rankEntry(entry: ShortcutEntry, event: KeyboardEvent, path: PressPath) {
  const shortcut = entry.current;
  const { nodes, modal } = path;
  if (shortcut.isDisabled || (event.repeat && !shortcut.allowsRepeat)) return null;
  if (!shortcut.allowsEditable && isTextEntryTarget(nodes[0] ?? event.target)) return null;
  if (!shortcut.allowsReserved && isReserved(shortcut.steps)) return null;
  const limit = modal === -1 ? nodes.length : modal;
  if (shortcut.scope === null) return modal === -1 ? nodes.length : null;
  const place = shortcut.scope.current ? nodes.indexOf(shortcut.scope.current) : -1;
  return place !== -1 && place < limit ? place : null;
}

/** The shortcuts a press may answer, innermost scope first, the latest registered first. */
function rankEntries(registry: Registry, event: KeyboardEvent): ShortcutEntry[] {
  const nodes = event.composedPath();
  const modal = nodes.findIndex((node) => isElement(node) && node.matches(modalSelector));
  const path = { nodes, modal };
  return [...registry.entries]
    .reverse()
    .map((entry) => ({ entry, rank: rankEntry(entry, event, path) }))
    .filter((each): each is { entry: ShortcutEntry; rank: number } => each.rank !== null)
    .sort((a, b) => a.rank - b.rank)
    .map(({ entry }) => entry);
}

function clearPending(registry: Registry) {
  if (registry.pending) registry.owner.defaultView?.clearTimeout(registry.pending.timer);
  registry.pending = null;
}

/**
 * Takes a press that matched step `step - 1` of the candidates: the first candidate runs once that
 * was its last chord, otherwise the candidates with more chords await the next one.
 */
function advance(registry: Registry, event: KeyboardEvent, found: ShortcutEntry[]) {
  const step = (registry.pending?.step ?? 0) + 1;
  clearPending(registry);
  event.preventDefault();
  const [leader] = found;
  if (!leader) return;
  if (leader.current.steps.length === step) {
    leader.current.onPress(event);
    return;
  }
  const candidates = found.filter((entry) => entry.current.steps.length > step);
  const timeout = Math.max(...candidates.map((entry) => entry.current.sequenceTimeout));
  const timer = registry.owner.defaultView?.setTimeout(() => clearPending(registry), timeout) ?? 0;
  registry.pending = { candidates, step, timer };
}

function matchesStep(entry: ShortcutEntry, step: number, event: KeyboardEvent): boolean {
  const chord = entry.current.steps[step];
  return chord !== undefined && matchesChord(event, chord);
}

function handleKeyDown(registry: Registry, event: KeyboardEvent) {
  // A keydown without a key, as browsers send when they autofill a field, is no press.
  if (typeof event.key !== 'string') return;
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
  if (modifierKeys.has(event.key)) return;
  const pending = registry.pending;
  // A key held after a sequence's first step repeats it; the sequence still awaits its next step.
  if (pending && event.repeat) {
    event.preventDefault();
    return;
  }
  const ranked = rankEntries(registry, event);
  if (pending) {
    const next = ranked.filter(
      (entry) => pending.candidates.includes(entry) && matchesStep(entry, pending.step, event),
    );
    if (next.length > 0) {
      advance(registry, event, next);
      return;
    }
    clearPending(registry);
  }
  const first = ranked.filter((entry) => matchesStep(entry, 0, event));
  if (first.length > 0) advance(registry, event, first);
}

/**
 * Registers a shortcut with its document, which listens for key presses once for all of them,
 * and returns its removal. The entry is read at each press, so it can change in place.
 */
export function registerShortcut(owner: Document, entry: ShortcutEntry): () => void {
  let registry = registries.get(owner);
  if (!registry) {
    const created: Registry = {
      entries: new Set(),
      pending: null,
      owner,
      listener: (event) => handleKeyDown(created, event),
    };
    registries.set(owner, created);
    registry = created;
  }
  const current = registry;
  if (current.entries.size === 0) owner.addEventListener('keydown', current.listener);
  current.entries.add(entry);
  return () => {
    current.entries.delete(entry);
    if (current.pending?.candidates.includes(entry)) clearPending(current);
    if (current.entries.size === 0) owner.removeEventListener('keydown', current.listener);
  };
}
