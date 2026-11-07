// The parts of a headless engine view that hold no commit state: the element stand-in, the
// members that need a DOM and the prop lookup. It reads no DOM.

import type { EditorState, Plugin } from 'prosemirror-state';
import type { EditorProps } from 'prosemirror-view';

/** The error a headless view throws from a member that needs a rendered document. */
export interface RichTextHeadlessDomError extends Error {
  /** The view member that was called, such as `coordsAtPos`. */
  readonly member: string;
}

/** A direction `endOfTextblock` checks. */
export type HeadlessDirection = 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward';

const HEADLESS_DOM_ERROR = 'RichTextHeadlessDomError';

/** The view members that read or change a rendered document. */
const DOM_MEMBERS = [
  'posAtDOM',
  'coordsAtPos',
  'domAtPos',
  'nodeDOM',
  'posAtCoords',
  'domSelection',
  'domSelectionRange',
  'updateRoot',
  'pasteHTML',
  'pasteText',
  'dispatchEvent',
] as const;

function headlessDomError(member: string): RichTextHeadlessDomError {
  const error = new Error(
    `The headless rich-text engine renders no DOM, so view.${member} is unavailable. Read ` +
      'positions and geometry from a rendered view instead.',
  );
  return Object.assign(error, { name: HEADLESS_DOM_ERROR, member });
}

/** Whether an error came from a headless view member that needs a rendered document. */
export function isRichTextHeadlessDomError(error: unknown): error is RichTextHeadlessDomError {
  return error instanceof Error && error.name === HEADLESS_DOM_ERROR;
}

/**
 * A stand-in for the view's element: not an element, and every listener, class and query on it
 * does nothing, so a plugin view that listens to its editor's element runs unchanged.
 */
export function createHeadlessDom() {
  const none = () => undefined;
  return {
    nodeType: 0,
    isConnected: false,
    classList: { add: none, remove: none, toggle: () => false, contains: () => false },
    addEventListener: none,
    removeEventListener: none,
    contains: () => false,
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

/** The members that need a rendered document, each throwing an error that names it. */
export function createDomMembers(): Record<(typeof DOM_MEMBERS)[number], () => never> {
  const members = DOM_MEMBERS.map((member) => [
    member,
    () => {
      throw headlessDomError(member);
    },
  ]);
  return Object.fromEntries(members) as Record<(typeof DOM_MEMBERS)[number], () => never>;
}

/**
 * Whether the selection's head is at the edge of its textblock in a direction, as a rendered view
 * answers for left-to-right text; up and down answer as backward and forward.
 */
export function isAtTextblockEnd(state: EditorState, direction: HeadlessDirection): boolean {
  const { $head } = state.selection;
  if (!$head.parent.isTextblock) return false;
  if (direction === 'up' || direction === 'left' || direction === 'backward') {
    return $head.parentOffset === 0;
  }
  return $head.parentOffset === $head.parent.content.size;
}

type PropHolder = Readonly<Record<string, unknown>> | undefined;

/**
 * The first value of a view prop, as a rendered view's `someProp` finds it: the view's own props
 * first, then each plugin's. With `select`, the first truthy result of it instead.
 */
export function findProp(
  sources: { props: Readonly<EditorProps>; plugins: readonly Plugin[] },
  name: string,
  select?: (value: never) => unknown,
): unknown {
  const holders: PropHolder[] = [
    sources.props as PropHolder,
    ...sources.plugins.map((plugin) => plugin.props as PropHolder),
  ];
  for (const holder of holders) {
    const value = holder?.[name];
    if (value == null) continue;
    const result = select ? select(value as never) : value;
    if (result) return result;
  }
  return undefined;
}
