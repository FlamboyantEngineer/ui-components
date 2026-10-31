'use client';

import { ChevronDownGlyph, ChevronUpGlyph, type GlyphComponent } from '../../core/glyphs.js';
// The parts a disclosure is composed of: a header, the title that toggles it, and its panel.

import { useContext, type ReactNode, type Ref } from 'react';
import {
  useFocusManager,
  Button as AriaButton,
  DisclosureGroupStateContext,
  DisclosurePanel as AriaDisclosurePanel,
  DisclosureStateContext,
  Heading,
  type KeyboardEvent,
} from '../../primitives/index.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import type { ElementRender } from '../../utils/render-element.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { HeadingLevelContext } from '../section-header/section-header.js';
import {
  DisclosurePartsContext,
  disclosureGroupHooks,
  disclosureHooks as hooks,
  type DisclosureIndicatorPosition,
} from './disclosure-hooks.js';

export interface DisclosureHeaderProps extends BaseProps {
  /** A `DisclosureTitle` and the controls beside it, which do not toggle the disclosure. */
  children?: ReactNode;
}

export interface DisclosureTitleProps extends BaseProps {
  /** The title, inside the trigger. */
  children?: ReactNode;
  /** The trigger button, such as to move focus to it. */
  triggerRef?: Ref<HTMLButtonElement> | undefined;
}

/** The panel's role: `group` (the default), or `region` for a landmark-worthy section. */
export type DisclosurePanelRole = 'group' | 'region';

/** The state a disclosure panel passes to `render` with its element's props. */
export interface DisclosurePanelRenderState {
  /** Keyboard focus is inside the panel. */
  isFocusVisibleWithin: boolean;
}

export interface DisclosurePanelProps extends BaseProps {
  /** The panel's role. Defaults to `group`. */
  role?: DisclosurePanelRole | undefined;
  /** The content that the disclosure shows and hides. */
  children?: ReactNode;
  /** Replaces the panel's `<div>` with the caller's own, given its props and state. */
  render?: ElementRender<'div', DisclosurePanelRenderState> | undefined;
}

/** The keys that move focus between the triggers of a group, and where each one moves it. */
const groupKeys: Readonly<
  Record<string, 'focusNext' | 'focusPrevious' | 'focusFirst' | 'focusLast'>
> = {
  ArrowDown: 'focusNext',
  ArrowUp: 'focusPrevious',
  Home: 'focusFirst',
  End: 'focusLast',
};

/** While collapsed a start indicator points to the inline end and an end one down; open, they turn. */
function useIndicatorGlyph(
  position: DisclosureIndicatorPosition,
  isExpanded: boolean,
): GlyphComponent {
  const startGlyph = useExpandGlyph(isExpanded);
  if (position === 'start') return startGlyph;
  return isExpanded ? ChevronUpGlyph : ChevronDownGlyph;
}

/**
 * Arrow keys, Home and End on a trigger move focus between the triggers of its own group, skipping
 * disabled ones and those of groups nested in a panel. Outside a group the keys do nothing. Other
 * keys keep propagating, which React Aria stops by default once a key handler is set.
 */
function useGroupNavigation() {
  const group = useContext(DisclosureGroupStateContext);
  const focusManager = useFocusManager();
  return (event: KeyboardEvent) => {
    const move = groupKeys[event.key];
    if (!group || !focusManager || !move) {
      event.continuePropagation();
      return;
    }
    const ownGroup = (event.target as Element).closest(`.${disclosureGroupHooks.className}`);
    event.preventDefault();
    focusManager[move]({
      wrap: true,
      accept: (node) =>
        node.classList.contains(hooks.slotClass('trigger')) &&
        node.closest(`.${disclosureGroupHooks.className}`) === ownGroup,
    });
  };
}

/** The row that holds a `DisclosureTitle` and controls beside it, such as actions. */
export function DisclosureHeader({ className, children, ...rest }: DisclosureHeaderProps) {
  return (
    <div {...rest} className={mergeClassNames(hooks.slotClass('header'), className)}>
      {children}
    </div>
  );
}

/**
 * The disclosure's heading, at its level, holding the trigger: a button that toggles the panel and
 * shows the indicator glyph before or after the title.
 */
export function DisclosureTitle({
  className,
  children,
  triggerRef,
  ...rest
}: DisclosureTitleProps) {
  const { level, indicatorPosition } = useContext(DisclosurePartsContext);
  const isExpanded = useContext(DisclosureStateContext)?.isExpanded ?? false;
  const glyph = useIndicatorGlyph(indicatorPosition, isExpanded);
  const onKeyDown = useGroupNavigation();
  const indicator = <Glyph icon={glyph} className={hooks.slotClass('indicator')} />;
  return (
    <Heading
      {...rest}
      level={level}
      className={mergeClassNames(hooks.slotClass('heading'), className)}
    >
      <AriaButton
        {...hooks.slot('trigger', { indicatorPosition })}
        slot="trigger"
        ref={triggerRef}
        onKeyDown={onKeyDown}
      >
        {indicatorPosition === 'start' ? indicator : null}
        <span {...hooks.slot('title')}>{children}</span>
        {indicatorPosition === 'end' ? indicator : null}
      </AriaButton>
    </Heading>
  );
}

/**
 * The content a disclosure shows and hides. It stays mounted while
 * collapsed, and headings inside take the levels below the disclosure's title.
 */
export function DisclosurePanel({ className, children, ...rest }: DisclosurePanelProps) {
  const { level } = useContext(DisclosurePartsContext);
  return (
    <AriaDisclosurePanel {...rest} className={mergeClassNames(hooks.slotClass('panel'), className)}>
      <HeadingLevelContext value={level}>{children}</HeadingLevelContext>
    </AriaDisclosurePanel>
  );
}
