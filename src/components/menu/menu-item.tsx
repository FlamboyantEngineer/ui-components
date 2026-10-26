import { useContext, type ComponentPropsWithRef, type ReactNode } from 'react';
import {
  Header,
  KeyboardContext,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  useLocale,
} from '../../primitives/index.js';
import type { PressEventProps, SelectionProps } from '../../core/events.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Key, SelectionMode, Tone } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import { toCollectionSelectionProps } from '../../utils/collection-selection.js';
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import { toCollectionItemKey } from '../../utils/to-collection-key.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { Separator } from '../separator/separator.js';
import { Shortcut, type ShortcutProps } from '../shortcut/shortcut.js';
import { MenuSizeContext } from './menu-context.js';

/** Emphasis of a menu item: `danger` marks a destructive action. */
export type MenuItemTone = Extract<Tone, 'neutral' | 'danger'>;

/** The state a menu item hands to custom content (`children` as a function). */
export interface MenuItemRenderState {
  isHovered: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isPressed: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  /** The selection of the menu or section the item belongs to. */
  selectionMode: SelectionMode;
  /** The item opens a submenu. */
  hasSubmenu: boolean;
  /** Its submenu is open. */
  isOpen: boolean;
}

export interface MenuItemProps extends Omit<BaseProps, 'id'>, PressEventProps {
  /** Identifies the item in `onAction`, selections and `disabledKeys`. */
  id?: Key | undefined;
  /** Makes the item a link to this URL, navigated through the provider's `navigate` when set. */
  href?: string | undefined;
  /** The label, or a render function for custom content that replaces the default layout. */
  children?: ReactNode | ((state: MenuItemRenderState) => ReactNode);
  /** The text used for type-to-select. Defaults to the label when it is a string. */
  textValue?: string | undefined;
  /** Names the item when its content does not. */
  'aria-label'?: string | undefined;
  /** Called when the item is activated. */
  onAction?: (() => void) | undefined;
  /** Whether activating the item closes the menu. Defaults to the menu's setting. */
  shouldCloseOnSelect?: boolean | undefined;
  /** Drawn before the label. */
  icon?: IconSource;
  /** Secondary text after the label. */
  description?: ReactNode;
  /** A keyboard chord shown after the label. */
  shortcut?: ShortcutProps['chord'] | undefined;
  /** Defaults to `neutral`. */
  tone?: MenuItemTone | undefined;
  /** Keeps the item visible but out of reach. */
  isDisabled?: boolean | undefined;
  /** Keeps a disabled item in keyboard navigation, with `aria-disabled="true"`, refusing activation. */
  focusableWhenDisabled?: boolean | undefined;
  /** Draws a busy indicator instead of the icon and refuses activation. */
  isPending?: boolean | undefined;
  /**
   * Makes the item a check item of its own (`menuitemcheckbox`), checked while true, in a menu or
   * section without selection. Activating it calls `onAction`, for the caller to flip it.
   */
  isSelected?: boolean | undefined;
}

export interface MenuSectionProps
  extends Omit<BaseProps, 'id'>, Omit<SelectionProps, 'disabledKeys'> {
  /** Identifies the section among the menu's entries. */
  id?: Key | undefined;
  /** A heading drawn above the section's items, which also names the group. */
  title?: ReactNode;
  /** Names the group when it has no `title`. */
  'aria-label'?: string | undefined;
  /** Whether activating one of its items closes the menu. Defaults to the menu's setting. */
  shouldCloseOnSelect?: boolean | undefined;
  children?: ReactNode;
}

export type MenuSeparatorProps = Omit<BaseProps, 'id'>;

const itemHooks = createHooks('menu-item', [
  'check',
  'icon',
  'spinner',
  'label',
  'description',
  'shortcut',
  'submenu-indicator',
]);
const sectionHooks = createHooks('menu-section', ['header']);
const separatorHooks = createHooks('menu-separator');

interface MenuItemContentProps extends Pick<MenuItemProps, 'icon' | 'description' | 'shortcut'> {
  state: MenuItemRenderState;
  /** Draws the check slot: the item belongs to a selection or is a check item of its own. */
  hasCheck: boolean;
  isPending: boolean;
  children: ReactNode;
}

type ItemDomProps = ComponentPropsWithRef<'div'> | ComponentPropsWithRef<'a'>;

/** What the item states itself, over the building block's state. */
interface OwnItemState {
  /** A focusable disabled item, which is enabled for the building block. */
  focusableDisabled: boolean;
  /** A check item's own state, which applies only outside a selection. */
  isSelected: boolean | undefined;
}

/** A check item's own state: a selection, where there is one, owns the check instead. */
function toOwnCheck(isSelected: boolean | undefined, selectionMode: SelectionMode) {
  return selectionMode === 'none' ? isSelected : undefined;
}

/**
 * The building block's item state, narrowed to the states the library publishes, with the
 * disabled and checked states the item holds itself.
 */
function toRenderState(state: MenuItemRenderState, own: OwnItemState): MenuItemRenderState {
  const { isHovered, isFocused, isFocusVisible, isPressed } = state;
  const { selectionMode, hasSubmenu, isOpen } = state;
  return {
    isHovered,
    isFocused,
    isFocusVisible,
    isPressed,
    isSelected: toOwnCheck(own.isSelected, selectionMode) ?? state.isSelected,
    isDisabled: own.focusableDisabled || state.isDisabled,
    selectionMode,
    hasSubmenu,
    isOpen,
  };
}

/**
 * Draws the row itself where the building block's row will not do: a check item of its own takes
 * `menuitemcheckbox`, `aria-checked` and `data-selected`, since React Aria knows check items only
 * inside a selection; a focusable disabled item drops its activation handlers. Neither is a link.
 */
function createRowRender(own: OwnItemState) {
  if (own.isSelected === undefined && !own.focusableDisabled) return undefined;
  return (domProps: ItemDomProps, state: { selectionMode: SelectionMode }) => {
    const checked = toOwnCheck(own.isSelected, state.selectionMode);
    const row =
      checked === undefined
        ? domProps
        : {
            ...domProps,
            role: 'menuitemcheckbox',
            'aria-checked': checked,
            'data-selected': checked || undefined,
          };
    if (own.focusableDisabled) return renderFocusableDisabled(row);
    return <div {...(row as ComponentPropsWithRef<'div'>)} />;
  };
}

/**
 * Draws a focusable disabled item. The building block keeps it enabled so arrow keys, Home, End,
 * type-to-select and hover still reach it (React Aria skips disabled items), so the row states
 * `aria-disabled` itself and drops the handlers that would press, select or activate it. Enter and
 * Space are refused without stopping them, so a search field's simulated key reports them cancelled.
 */
function renderFocusableDisabled(domProps: ItemDomProps) {
  // Without `href` the building block draws a `<div>`.
  const {
    onPointerDown: _onPointerDown,
    onPointerUp: _onPointerUp,
    onMouseDown: _onMouseDown,
    onClick: _onClick,
    onKeyDown,
    ...props
  } = domProps as ComponentPropsWithRef<'div'>;
  return (
    <div
      {...props}
      aria-disabled="true"
      data-disabled="true"
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') event.preventDefault();
        else onKeyDown?.(event);
      }}
    />
  );
}

/**
 * The default row layout. The row is named by its text, so each part sits in plain elements
 * separated by spaces and its accessible name holds everything it shows.
 */
function MenuItemContent({
  state,
  hasCheck,
  icon,
  description,
  shortcut,
  isPending,
  children,
}: MenuItemContentProps) {
  const size = useContext(MenuSizeContext);
  const { direction } = useLocale();
  const iconBox = icon ? (
    <Icon {...toIconProps(icon)} size={size} className={itemHooks.slotClass('icon')} />
  ) : null;
  return (
    <>
      {!hasCheck ? null : (
        <span {...itemHooks.slot('check')} aria-hidden="true">
          {state.isSelected ? <Glyph name="check" /> : null}
        </span>
      )}
      {isPending ? <span {...itemHooks.slot('spinner')} aria-hidden="true" /> : iconBox}
      <span {...itemHooks.slot('label')}>{children}</span>
      {description ? (
        <>
          {' '}
          <span {...itemHooks.slot('description')}>{description}</span>
        </>
      ) : null}
      {shortcut ? (
        // The chord is part of the row's text, so it must not also become its description.
        <KeyboardContext.Provider value={null}>
          {' '}
          <Shortcut chord={shortcut} className={itemHooks.slotClass('shortcut')} />
        </KeyboardContext.Provider>
      ) : null}
      {state.hasSubmenu ? (
        <Glyph
          name={direction === 'rtl' ? 'chevron-left' : 'chevron-right'}
          className={itemHooks.slotClass('submenu-indicator')}
        />
      ) : null}
    </>
  );
}

/** One menu row: selection check, icon, label, description, shortcut and submenu arrow. */
export function MenuItem({
  id,
  children,
  icon,
  description,
  shortcut,
  tone = 'neutral',
  isPending = false,
  isDisabled = false,
  focusableWhenDisabled = false,
  isSelected,
  textValue,
  className,
  href,
  ...rest
}: MenuItemProps) {
  const own = { focusableDisabled: isDisabled && focusableWhenDisabled && !isPending, isSelected };
  const render = createRowRender(own);
  return (
    <AriaMenuItem
      {...rest}
      {...(render ? { render } : { href })}
      id={toCollectionItemKey(id)}
      {...itemHooks.root({ className, props: rest, data: { tone, pending: isPending } })}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      isDisabled={isPending || (isDisabled && !own.focusableDisabled) || undefined}
    >
      {(ariaState) => {
        const state = toRenderState(ariaState, own);
        if (typeof children === 'function') return children(state);
        const isCheckItem = toOwnCheck(isSelected, state.selectionMode) !== undefined;
        return (
          <MenuItemContent
            state={state}
            hasCheck={isCheckItem || state.selectionMode !== 'none'}
            icon={icon}
            description={description}
            shortcut={shortcut}
            isPending={isPending}
          >
            {children}
          </MenuItemContent>
        );
      }}
    </AriaMenuItem>
  );
}

/** A group of menu items with an optional heading and its own selection mode. */
export function MenuSection({
  id,
  title,
  children,
  className,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  ...rest
}: MenuSectionProps) {
  return (
    <AriaMenuSection
      {...rest}
      id={toCollectionItemKey(id)}
      {...sectionHooks.root({ className, props: rest })}
      {...toCollectionSelectionProps({ selectedKeys, defaultSelectedKeys, onSelectionChange })}
    >
      {title ? <Header className={sectionHooks.slotClass('header')}>{title}</Header> : null}
      {keyCollectionChildren(children)}
    </AriaMenuSection>
  );
}

/** A rule between menu items or sections: a `Separator` with the menu's hook. */
export function MenuSeparator({ className, ...rest }: MenuSeparatorProps) {
  return <Separator {...rest} className={mergeClassNames(separatorHooks.className, className)} />;
}
