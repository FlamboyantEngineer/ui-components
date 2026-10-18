import { useContext, type ReactNode } from 'react';
import {
  Header,
  KeyboardContext,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  useLocale,
  type MenuItemProps as AriaMenuItemProps,
  type MenuItemRenderProps,
  type MenuSectionProps as AriaMenuSectionProps,
} from '../../primitives/index.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Tone } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { Separator } from '../separator/separator.js';
import { Shortcut, type ShortcutProps } from '../shortcut/shortcut.js';
import { MenuSizeContext } from './menu-context.js';

/** Emphasis of a menu item: `danger` marks a destructive action. */
export type MenuItemTone = Extract<Tone, 'neutral' | 'danger'>;

export interface MenuItemProps
  extends
    Omit<AriaMenuItemProps<object>, 'className' | 'style' | 'children' | 'render'>,
    Omit<BaseProps, 'id'> {
  /** The label, or a render function for custom content that replaces the default layout. */
  children?: ReactNode | ((state: MenuItemRenderProps) => ReactNode);
  /** Drawn before the label. */
  icon?: IconSource;
  /** Secondary text after the label. */
  description?: ReactNode;
  /** A keyboard chord shown after the label. */
  shortcut?: ShortcutProps['chord'] | undefined;
  /** Defaults to `neutral`. */
  tone?: MenuItemTone | undefined;
  /** Draws a busy indicator instead of the icon and refuses activation. */
  isPending?: boolean | undefined;
}

export interface MenuSectionProps
  extends
    Omit<
      AriaMenuSectionProps<object>,
      'className' | 'style' | 'children' | 'items' | 'dependencies' | 'render'
    >,
    Omit<BaseProps, 'id'> {
  /** A heading drawn above the section's items, which also names the group. */
  title?: ReactNode;
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
  state: MenuItemRenderProps;
  isPending: boolean;
  children: ReactNode;
}

/**
 * The default row layout. The row is named by its text, so each part sits in plain elements
 * separated by spaces and its accessible name holds everything it shows.
 */
function MenuItemContent({
  state,
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
      {state.selectionMode === 'none' ? null : (
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
  children,
  icon,
  description,
  shortcut,
  tone = 'neutral',
  isPending = false,
  isDisabled,
  textValue,
  className,
  ...rest
}: MenuItemProps) {
  return (
    <AriaMenuItem
      {...rest}
      {...itemHooks.root({ className, props: rest, data: { tone, pending: isPending } })}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      isDisabled={isPending || isDisabled}
    >
      {(state) =>
        typeof children === 'function' ? (
          children(state)
        ) : (
          <MenuItemContent
            state={state}
            icon={icon}
            description={description}
            shortcut={shortcut}
            isPending={isPending}
          >
            {children}
          </MenuItemContent>
        )
      }
    </AriaMenuItem>
  );
}

/** A group of menu items with an optional heading and its own selection mode. */
export function MenuSection({ title, children, className, ...rest }: MenuSectionProps) {
  return (
    <AriaMenuSection {...rest} {...sectionHooks.root({ className, props: rest })}>
      {title ? <Header className={sectionHooks.slotClass('header')}>{title}</Header> : null}
      {children}
    </AriaMenuSection>
  );
}

/** A rule between menu items or sections: a `Separator` with the menu's hook. */
export function MenuSeparator({ className, ...rest }: MenuSeparatorProps) {
  return <Separator {...rest} className={mergeClassNames(separatorHooks.className, className)} />;
}

export type { MenuItemRenderProps };
