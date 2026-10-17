import { Fragment, type ReactNode } from 'react';
import { Keyboard, VisuallyHidden } from 'react-aria-components';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { MetaLine } from '../meta-line/meta-line.js';
import {
  formatShortcutAccessibleText,
  formatShortcutKeys,
  getShortcutPlatform,
  shortcutKeySeparator,
  type ShortcutChord,
  type ShortcutPlatform,
} from './shortcut-format.js';

export interface ShortcutProps {
  /** The chord, such as `Ctrl+Shift+K` (`Ctrl` is Command on macOS) or `{ key, modifiers }`. */
  chord: ShortcutChord;
  /** The notation to draw. Defaults to the detected platform; set it for deterministic output. */
  platform?: ShortcutPlatform | undefined;
  /**
   * Draw the keycaps only, without readable text, when the surrounding control already
   * describes the chord (for example through its accessible description).
   */
  decorative?: boolean | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('shortcut', ['keys', 'key', 'text']);

/** A keyboard chord in the reader's platform notation, with readable text for assistive technology. */
export function Shortcut({ chord, platform, decorative, className, id, ...rest }: ShortcutProps) {
  const strings = useUiStrings();
  const resolved = platform ?? getShortcutPlatform();
  const keys = formatShortcutKeys(chord, resolved);
  if (keys.length === 0) return null;
  const separator = shortcutKeySeparator(resolved);
  return (
    <Keyboard {...hooks.root({ className, props: rest, data: { platform: resolved } })} id={id}>
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
          {formatShortcutAccessibleText(chord, resolved, strings.shortcutKeyName)}
        </VisuallyHidden>
      )}
    </Keyboard>
  );
}

/** One entry of a key legend: the keys, then what they do. */
export interface KeyHint {
  keys: readonly ShortcutChord[];
  action: ReactNode;
}

export interface KeyHintsProps {
  hints: readonly KeyHint[];
  platform?: ShortcutPlatform | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hintHooks = createHooks('key-hints', ['hint', 'action']);

/** A key legend such as `↑↓ move · Enter select`, drawn on one metadata line. */
export function KeyHints({ hints, platform, className, id, ...rest }: KeyHintsProps) {
  return (
    <MetaLine
      {...rest}
      className={mergeClassNames(hintHooks.className, className)}
      id={id}
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
