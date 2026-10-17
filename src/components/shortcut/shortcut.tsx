import { Fragment, type ReactNode } from 'react';
import { Keyboard, VisuallyHidden } from 'react-aria-components';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { MetaLine } from '../meta-line/meta-line.js';
import {
  formatShortcutAccessibleText,
  formatShortcutKeys,
  getShortcutPlatform,
  getShortcutKeySeparator,
  type ShortcutChord,
  type ShortcutPlatform,
} from './shortcut-format.js';

export interface ShortcutProps extends BaseProps {
  /** The chord, such as `Ctrl+Shift+K` (`Ctrl` is Command on macOS) or `{ key, modifiers }`. */
  chord: ShortcutChord;
  /** The notation to draw. Defaults to the detected platform; set it for deterministic output. */
  platform?: ShortcutPlatform | undefined;
  /** Draw only the keycaps, for a control that already describes the chord. */
  decorative?: boolean | undefined;
}

/** One entry of a key legend: the keys, then what they do. */
export interface KeyHint {
  /** The chords that trigger the action, drawn side by side. */
  keys: readonly ShortcutChord[];
  /** What the keys do. */
  action: ReactNode;
}

export interface KeyHintsProps extends BaseProps {
  /** The legend's entries, in order. */
  hints: readonly KeyHint[];
  /** The notation of every shortcut. Defaults to the detected platform. */
  platform?: ShortcutPlatform | undefined;
}

const hooks = createHooks('shortcut', ['keys', 'key', 'text']);
const hintHooks = createHooks('key-hints', ['hint', 'action']);

/** A keyboard chord in the reader's platform notation, with readable text for assistive technology. */
export function Shortcut({ chord, platform, decorative, className, ...rest }: ShortcutProps) {
  const strings = useUiStrings();
  const resolved = platform ?? getShortcutPlatform();
  const keys = formatShortcutKeys(chord, resolved);
  if (keys.length === 0) return null;
  const separator = getShortcutKeySeparator(resolved);
  return (
    <Keyboard {...rest} {...hooks.root({ className, data: { platform: resolved } })}>
      <span {...hooks.slot('keys')} aria-hidden="true">
        {keys.map((label, index) => (
          <Fragment key={index}>
            {index > 0 ? separator : null}
            <kbd {...hooks.slot('key')}>{label}</kbd>
          </Fragment>
        ))}
      </span>
      {decorative ? null : (
        <VisuallyHidden elementType="span" className={hooks.slotClass('text')}>
          {formatShortcutAccessibleText(chord, {
            platform: resolved,
            keyName: strings.shortcutKeyName,
          })}
        </VisuallyHidden>
      )}
    </Keyboard>
  );
}

/** A key legend such as `↑↓ move · Enter select`, drawn on one metadata line. */
export function KeyHints({ hints, platform, className, ...rest }: KeyHintsProps) {
  return (
    <MetaLine
      {...rest}
      className={mergeClassNames(hintHooks.className, className)}
      items={hints.map((hint, index) => (
        <span key={index} {...hintHooks.slot('hint')}>
          {hint.keys.map((key, keyIndex) => (
            <Shortcut key={keyIndex} chord={key} platform={platform} />
          ))}{' '}
          <span {...hintHooks.slot('action')}>{hint.action}</span>
        </span>
      ))}
    />
  );
}
