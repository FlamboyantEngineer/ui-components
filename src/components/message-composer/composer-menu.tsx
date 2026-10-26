// The composer's "+" menu: the host's categories of items, whose actions get the composer's helpers
// (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-5).

import { useRef, type ReactElement, type RefObject } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useFocusHandback } from '../../utils/use-focus-handback.js';
import { Button } from '../button/button.js';
import type { IconSource } from '../icon/icon.js';
import {
  Menu,
  MenuItem,
  MenuOverlay,
  MenuPopover,
  MenuSection,
  MenuTrigger,
  SubmenuTrigger,
} from '../menu/menu.js';
import type { ShortcutProps } from '../shortcut/shortcut.js';
import type { ComposerFrameModel } from './composer-frame.js';
import { composerHooks as hooks } from './composer-hooks.js';
import type { MessageComposerToken } from './composer-message.js';
import { attachChosenFiles } from './use-file-drop.js';

/** What a menu item's action can do with the composer. */
export interface MessageComposerHelpers {
  /** Inserts text at the caret in place of the selection; focus returns after it once the menu closes. */
  insertText: (text: string) => void;
  /**
   * Inserts a mention, command or record reference at the caret, followed by a space: a pill or a
   * record chip in the rich composer (its text in a code block), its text (`@label`, `/label`,
   * `label`) in the plain composer. Focus returns after it once the menu closes.
   */
  insertPill: (pill: Pick<MessageComposerToken, 'kind' | 'id' | 'label' | 'recordType'>) => void;
  /** Opens the system file chooser for several files; the chosen files go to `onAttach`, without which it does nothing. */
  attachFiles: () => void;
  /** Moves focus to the input once the menu closes. */
  focusInput: () => void;
}

/** An item of the composer's menu. */
export interface MessageComposerMenuItem {
  /** Identifies the item; unique within the menu, sections included. */
  id: string;
  /** The item's name. */
  label: string;
  /** A note after the label, such as what the item does or where it comes from. */
  description?: string | undefined;
  /** Drawn before the label: a built-in glyph name or any icon node. */
  icon?: IconSource;
  /** A keyboard chord shown at the end of the row, for a shortcut the host handles itself. */
  shortcut?: ShortcutProps['chord'] | undefined;
  /** Keeps the item listed but out of reach; the arrow keys still reach it. */
  isDisabled?: boolean | undefined;
  /** Why a disabled item is unavailable, shown in place of its description. */
  disabledReason?: string | undefined;
  /** Makes the item a toggle, on while true; flipping it keeps the menu open. */
  isSelected?: boolean | undefined;
  /** Called with the toggle's new state when the reader flips it. */
  onSelectedChange?: ((isSelected: boolean) => void) | undefined;
  /** Nested items, which the item opens as a submenu instead of acting. */
  items?: readonly MessageComposerMenuItem[] | undefined;
  /** Called with the composer's helpers when the reader chooses the item. */
  onAction?: ((composer: MessageComposerHelpers) => void) | undefined;
}

/** A category of the composer's menu: a heading over its items. */
export interface MessageComposerMenuSection {
  /** Identifies the section; unique within the menu, items included. */
  id: string;
  /** The heading, which also names the group. */
  title: string;
  items: readonly MessageComposerMenuItem[];
}

/** The composer's "+" menu. */
export interface MessageComposerMenu {
  /** The categories, in order. */
  sections: readonly MessageComposerMenuSection[];
  /** Leads the menu with a search field that narrows the items by label and description. */
  filterable?: boolean | undefined;
}

interface ComposerMenuProps {
  menu: MessageComposerMenu;
  /** The composer's root, which the menu opens against. */
  anchorRef: RefObject<HTMLElement | null>;
  model: Pick<ComposerFrameModel, 'insertText' | 'insertPill' | 'focusInput'>;
  onAttach: ((files: File[]) => void) | undefined;
  isDisabled: boolean;
}

/** The note an item shows: why it is unavailable while it is disabled, else its description. */
function toNote(item: MessageComposerMenuItem): string | undefined {
  return item.isDisabled ? (item.disabledReason ?? item.description) : item.description;
}

/** One item, or a submenu trigger with its nested items; a toggle reports its new state and stays open. */
function renderItem(item: MessageComposerMenuItem, helpers: MessageComposerHelpers): ReactElement {
  const note = toNote(item);
  const isToggle = item.isSelected !== undefined;
  const element = (
    <MenuItem
      key={item.id}
      id={item.id}
      // The search field matches the note as well as the label; the label leads for type-to-select.
      textValue={note ? `${item.label} ${note}` : item.label}
      icon={item.icon}
      description={note}
      shortcut={item.shortcut}
      isDisabled={item.isDisabled}
      // A disabled item stays reachable by the arrow keys, so its reason can be read.
      focusableWhenDisabled
      isSelected={item.isSelected}
      {...(isToggle ? { shouldCloseOnSelect: false } : {})}
      onAction={() => {
        if (isToggle) item.onSelectedChange?.(!item.isSelected);
        item.onAction?.(helpers);
      }}
    >
      {item.label}
    </MenuItem>
  );
  if (!item.items?.length) return element;
  return (
    <SubmenuTrigger key={item.id}>
      {element}
      <MenuPopover>
        <Menu className={hooks.slotClass('menu')}>
          {item.items.map((child) => renderItem(child, helpers))}
        </Menu>
      </MenuPopover>
    </SubmenuTrigger>
  );
}

/**
 * The "+" button at the start of the toolbar and the menu it opens above the composer: the host's
 * sections of items, optionally led by a search field. Insertions take focus back to the input once
 * the menu has closed and given focus back to the button. The file chooser behind `attachFiles` is a
 * hidden file input, since the press that opens it is the host's menu item rather than a button.
 */
export function ComposerMenu({ menu, anchorRef, model, onAttach, isDisabled }: ComposerMenuProps) {
  const strings = useUiStrings();
  const handback = useFocusHandback(model.focusInput);
  const chooserRef = useRef<HTMLInputElement>(null);
  const helpers: MessageComposerHelpers = {
    insertText: (text) => {
      model.insertText(text);
      handback.request();
    },
    insertPill: (pill) => {
      model.insertPill(pill);
      handback.request();
    },
    attachFiles: () => {
      const chooser = chooserRef.current;
      if (!chooser) return;
      // Choosing the same file again still reports it.
      chooser.value = '';
      chooser.click();
    },
    focusInput: handback.request,
  };
  return (
    <>
      <MenuTrigger>
        <Button
          ref={handback.ref}
          className={hooks.slotClass('menu-button')}
          icon="plus"
          label={strings.composerMenu}
          size="sm"
          isDisabled={isDisabled}
        />
        {/* Above the whole composer, as its completion list opens, rather than over its input. */}
        <MenuOverlay placement="top start" triggerRef={anchorRef}>
          <Menu className={hooks.slotClass('menu')} filterable={menu.filterable}>
            {menu.sections.map((section) => (
              <MenuSection key={section.id} id={section.id} title={section.title}>
                {section.items.map((item) => renderItem(item, helpers))}
              </MenuSection>
            ))}
          </Menu>
        </MenuOverlay>
      </MenuTrigger>
      {onAttach ? (
        <input
          ref={chooserRef}
          type="file"
          multiple
          hidden
          onChange={(event) => attachChosenFiles(event.target.files, onAttach)}
        />
      ) : null}
    </>
  );
}
