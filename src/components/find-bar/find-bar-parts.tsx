'use client';

import type { KeyboardEvent } from 'react';
import { ChevronDownGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Input } from '../../primitives/index.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { Button } from '../button/button.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import type { FindBarOption, FindBarProps } from './find-bar.js';
import { findBarHooks as hooks } from './find-bar-hooks.js';

/**
 * The menu of matching options, each one checked while it is on; choosing one keeps it open. The
 * bar owns the selection, so it outlasts the menu while the options are gone.
 */
export function FindBarOptions({
  options,
  selected,
  setSelected,
}: {
  options: readonly FindBarOption[];
  selected: Iterable<Key>;
  setSelected: (keys: Iterable<Key>) => void;
}) {
  const strings = useUiStrings();
  return (
    <DropdownMenu
      className={hooks.slotClass('options')}
      iconOnly
      icon={ChevronDownGlyph}
      label={strings.findOptions}
      size="sm"
      selectionMode="multiple"
      shouldCloseOnSelect={false}
      selectedKeys={selected}
      onSelectionChange={(keys) =>
        setSelected(keys === 'all' ? new Set(options.map(({ id }) => id)) : new Set(keys))
      }
      items={options.map(({ id, label }) => ({ id, label }))}
    />
  );
}

/**
 * The replacement box with the Replace and Replace all buttons the caller asked for. The bar owns the
 * replacement, so it outlasts the box while the replace handlers are gone.
 */
export function FindBarReplace({
  hasMatches,
  replacement,
  setReplacement,
  onReplace,
  onReplaceAll,
  isReplaceDisabled = false,
  isReplaceAllDisabled = false,
  replacementInputRef,
}: Pick<
  FindBarProps,
  | 'onReplace'
  | 'onReplaceAll'
  | 'isReplaceDisabled'
  | 'isReplaceAllDisabled'
  | 'replacementInputRef'
> & {
  hasMatches: boolean;
  replacement: string;
  setReplacement: (replacement: string) => void;
}) {
  const strings = useUiStrings();
  const canReplace = hasMatches && !isReplaceDisabled;
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // The Enter that confirms a text composition replaces nothing.
    if (event.key !== 'Enter' || isComposingKey(event.nativeEvent)) return;
    event.preventDefault();
    event.stopPropagation();
    if (canReplace) onReplace?.(replacement);
  };
  return (
    // One part, so the replacement box and its buttons stay on a line of their own when the bar wraps.
    <div {...hooks.slot('replace-group')}>
      <Input
        ref={replacementInputRef}
        className={hooks.slotClass('replacement')}
        aria-label={strings.replaceWith}
        value={replacement}
        onChange={(event) => setReplacement(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {onReplace ? (
        <Button
          className={hooks.slotClass('replace')}
          size="sm"
          variant="ghost"
          isDisabled={!canReplace}
          onPress={() => onReplace(replacement)}
        >
          {strings.replace}
        </Button>
      ) : null}
      {onReplaceAll ? (
        <Button
          className={hooks.slotClass('replace-all')}
          size="sm"
          variant="ghost"
          isDisabled={!hasMatches || isReplaceAllDisabled}
          onPress={() => onReplaceAll(replacement)}
        >
          {strings.replaceAll}
        </Button>
      ) : null}
    </div>
  );
}
