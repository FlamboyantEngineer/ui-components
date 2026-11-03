'use client';

import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { PlusGlyph } from '../../core/glyphs.js';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { CompletionList, getCompletionOptionId } from '../completion-list/completion-list.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { getInsertItems, type InsertMenuItem } from './insert-items.js';
import { useRichTextEditorContext } from './rich-text-context.js';
import { useRichTextController } from './rich-text-controller.js';
import { useFocusReturn } from './use-focus-return.js';
import { useSlashMenu } from './use-slash-menu.js';

export interface InsertMenuProps extends RefProps<HTMLElement>, BaseProps, AriaLabellingProps {
  /** Entries after the built-in blocks, such as a template or a custom node. */
  items?: readonly InsertMenuItem[] | undefined;
}

export interface InsertMenuButtonProps extends RefProps<HTMLButtonElement>, BaseProps {
  /** Entries after the built-in blocks. */
  items?: readonly InsertMenuItem[] | undefined;
}

const hooks = createHooks('insert-menu', ['caret']);
const buttonHooks = createHooks('insert-menu-button');

/** The entries the schema and the editor's state allow. */
function useAvailableItems(items: readonly InsertMenuItem[] | undefined) {
  const strings = useUiStrings();
  const controller = useRichTextController();
  return useMemo(
    () => getInsertItems(strings, items).filter((item) => controller.supports(item.command)),
    [strings, items, controller],
  );
}

/**
 * The slash command menu of the enclosing `RichTextEditor`, for its children: typing `/` at the
 * start of a block or after a space lists the blocks to insert at the caret, filtered by what
 * follows the slash. Arrow keys move through the list, Enter or Tab inserts, Escape closes it.
 */
export function InsertMenu({ items, className, ...rest }: InsertMenuProps) {
  const strings = useUiStrings();
  const { surfaceRef, setContentAttributes } = useRichTextEditorContext('InsertMenu');
  const available = useAvailableItems(items);
  const menu = useSlashMenu(available, surfaceRef);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const listId = `${useId()}-insert`;
  const activeItem = menu.isOpen ? menu.matches[menu.activeIndex] : undefined;
  const activeId = activeItem ? getCompletionOptionId(listId, activeItem.id) : undefined;
  useEffect(() => {
    setContentAttributes({
      'aria-autocomplete': 'list',
      'aria-haspopup': 'listbox',
      'aria-controls': menu.isOpen ? listId : undefined,
      'aria-activedescendant': activeId,
    });
  }, [setContentAttributes, menu.isOpen, listId, activeId]);
  useEffect(() => () => setContentAttributes({}), [setContentAttributes]);
  const label = rest['aria-labelledby']
    ? undefined
    : (rest['aria-label'] ?? strings.insertCommands);
  return (
    <>
      {menu.caret ? (
        <span
          {...hooks.slot('caret')}
          ref={anchorRef}
          aria-hidden="true"
          style={{ position: 'absolute', ...menu.caret }}
        />
      ) : null}
      <CompletionList
        {...rest}
        {...hooks.root({ className, props: rest })}
        id={listId}
        aria-label={label}
        isOpen={menu.isOpen}
        anchorRef={anchorRef}
        items={menu.matches}
        activeKey={activeItem?.id ?? null}
        onActiveKeyChange={(key) =>
          menu.setActiveIndex(menu.matches.findIndex((item) => item.id === key))
        }
        onAction={(key: Key) => {
          const item = menu.matches.find((candidate) => candidate.id === key);
          if (item) menu.choose(item);
        }}
      />
    </>
  );
}

/**
 * A button that opens the menu of blocks to insert at the selection in the enclosing
 * `RichTextEditor`, for its toolbar.
 */
export function InsertMenuButton({ ref, items, className, ...rest }: InsertMenuButtonProps) {
  const strings = useUiStrings();
  const controller = useRichTextController();
  const { ref: returnFocusRef, request: returnFocus } = useFocusReturn(controller);
  const rootRefs = useMergedRefs(returnFocusRef, ref);
  const available = useAvailableItems(items);
  const [isOpen, setOpen] = useState(false);
  if (isOpen && !controller.isEditable) setOpen(false);
  return (
    <DropdownMenu
      {...rest}
      ref={rootRefs}
      className={mergeClassNames(buttonHooks.className, className)}
      label={strings.insert}
      icon={PlusGlyph}
      iconOnly
      size="sm"
      isDisabled={!controller.isEditable}
      isOpen={isOpen && controller.isEditable}
      onOpenChange={setOpen}
      items={available.map(({ id, label, description, icon }) => ({
        id,
        label,
        description,
        icon,
      }))}
      onAction={(key) => {
        const item = available.find((candidate) => candidate.id === key);
        if (item && controller.run(item.command)) returnFocus();
      }}
    />
  );
}

export type { InsertMenuItem } from './insert-items.js';
