'use client';

import { createContext, Fragment, use, useSyncExternalStore, type ReactNode } from 'react';
import { Keyboard } from '../../primitives/index.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { MetaLine, type MetaLineProps } from '../meta-line/meta-line.js';
import {
  formatShortcutAccessibleText,
  formatShortcutSteps,
  getShortcutPlatform,
  getShortcutKeySeparator,
  type ShortcutChord,
  type ShortcutPlatform,
  type ShortcutSequence,
} from './shortcut-format.js';

/**
 * How a shortcut draws its keys: each in a keycap (`keycaps`), or as quiet inline text such as
 * `Ctrl+Shift+K` or `⌘⇧K` (`text`). Published as `data-appearance` for the stylesheet.
 */
export type ShortcutAppearance = 'keycaps' | 'text';

/**
 * The appearance of every shortcut inside it that sets none, such as those of menu items and
 * button tooltips. Defaults to `keycaps`.
 */
export const ShortcutAppearanceContext = createContext<ShortcutAppearance>('keycaps');

export interface ShortcutProps extends BaseProps {
  /**
   * The chord, such as `Ctrl+Shift+K` (`Ctrl` is Command on macOS) or `{ key, modifiers }`, or a
   * sequence of chords pressed one after another, such as `['G', 'I']`.
   */
  chord: ShortcutChord | ShortcutSequence;
  /** The notation to draw. Defaults to the detected platform; set it for deterministic output. */
  platform?: ShortcutPlatform | undefined;
  /** Draw only the keycaps, for a control that already describes the chord. */
  decorative?: boolean | undefined;
  /** Keycaps or quiet text. Defaults to the nearest `ShortcutAppearanceContext`, else `keycaps`. */
  appearance?: ShortcutAppearance | undefined;
}

/** One entry of a key legend: the keys, then what they do. */
export interface KeyHint {
  /** The chords or sequences that trigger the action, drawn side by side. */
  keys: readonly (ShortcutChord | ShortcutSequence)[];
  /** What the keys do. */
  action: ReactNode;
}

export interface KeyHintsProps
  extends BaseProps, Pick<MetaLineProps, 'aria-label' | 'aria-labelledby'> {
  /** The legend's entries, in order. */
  hints: readonly KeyHint[];
  /** The notation of every shortcut. Defaults to the detected platform. */
  platform?: ShortcutPlatform | undefined;
  /** The appearance of every shortcut. Defaults to the nearest `ShortcutAppearanceContext`. */
  appearance?: ShortcutAppearance | undefined;
}

const hooks = createHooks('shortcut', ['keys', 'chord', 'key', 'text']);
const hintHooks = createHooks('key-hints', ['hint', 'action']);

const subscribeToNothing = () => () => {};
/** What detection reports without a browser, so the server and hydration render the same notation. */
const getServerPlatform = (): ShortcutPlatform => 'linux';

/** The detected platform: the server's notation while hydrating, the browser's once hydrated. */
export function useDetectedPlatform(): ShortcutPlatform {
  return useSyncExternalStore(subscribeToNothing, getShortcutPlatform, getServerPlatform);
}

/** One chord's keys, as keycaps or text, with the platform separator between them. */
function Keycaps({ keys, separator }: { keys: readonly string[]; separator: string }) {
  return keys.map((label, index) => (
    <Fragment key={index}>
      {index > 0 ? separator : null}
      <kbd {...hooks.slot('key')}>{label}</kbd>
    </Fragment>
  ));
}

/**
 * A keyboard chord or key sequence in the reader's platform notation, with readable text for
 * assistive technology.
 */
export function Shortcut({
  chord,
  platform,
  decorative,
  appearance,
  className,
  ...rest
}: ShortcutProps) {
  const strings = useUiStrings();
  const inherited = use(ShortcutAppearanceContext);
  const detected = useDetectedPlatform();
  const resolved = platform ?? detected;
  const steps = formatShortcutSteps(chord, resolved);
  const [first] = steps;
  if (!first) return null;
  const separator = getShortcutKeySeparator(resolved);
  return (
    <Keyboard
      {...rest}
      {...hooks.root({
        className,
        data: { platform: resolved, appearance: appearance ?? inherited },
      })}
    >
      <span {...hooks.slot('keys')} aria-hidden="true">
        {steps.length === 1 ? (
          <Keycaps keys={first} separator={separator} />
        ) : (
          steps.map((keys, index) => (
            <Fragment key={index}>
              {index > 0 ? ' ' : null}
              <span {...hooks.slot('chord')}>
                <Keycaps keys={keys} separator={separator} />
              </span>
            </Fragment>
          ))
        )}
      </span>
      {decorative ? null : (
        <VisuallyHidden as="span" className={hooks.slotClass('text')}>
          {formatShortcutAccessibleText(chord, {
            platform: resolved,
            keyName: strings.shortcutKeyName,
            joinSteps: strings.shortcutThen,
          })}
        </VisuallyHidden>
      )}
    </Keyboard>
  );
}

/** A key legend such as `↑↓ move · Enter select`, drawn on one metadata line. */
export function KeyHints({ hints, platform, appearance, className, ...rest }: KeyHintsProps) {
  return (
    <MetaLine
      {...rest}
      className={mergeClassNames(hintHooks.className, className)}
      items={hints.map((hint, index) => (
        <span key={index} {...hintHooks.slot('hint')}>
          {hint.keys.map((key, keyIndex) => (
            <Shortcut key={keyIndex} chord={key} platform={platform} appearance={appearance} />
          ))}{' '}
          <span {...hintHooks.slot('action')}>{hint.action}</span>
        </span>
      ))}
    />
  );
}

export { formatAriaKeyShortcuts } from './shortcut-format.js';
export type { ShortcutChord, ShortcutPlatform } from './shortcut-format.js';
export { isChordPress, matchesChord, readCommandKey } from './shortcut-match.js';
