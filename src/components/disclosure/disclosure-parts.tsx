'use client';

// The parts a disclosure is composed of: a header, the title that toggles it, and its panel.
import { type ReactNode, type Ref, useContext } from 'react';
import type { AriaLabellingProps, PressEventProps } from '../../core/events.js';
import { ChevronDownGlyph, ChevronUpGlyph, type GlyphComponent } from '../../core/glyphs.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import {
  Button as AriaButton,
  DisclosureGroupStateContext,
  DisclosurePanel as AriaDisclosurePanel,
  DisclosureStateContext,
  Heading,
  type KeyboardEvent,
  useFocusManager,
} from '../../primitives/index.js';
import { isFreeEditKey } from '../../utils/is-free-edit-key.js';
import type { ElementRender } from '../../utils/render-element.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { HeadingLevelContext } from '../section-header/section-header.js';
import {
  disclosureGroupHooks,
  disclosureHooks as hooks,
  type DisclosureIndicatorPosition,
  DisclosurePartsContext,
} from './disclosure-hooks.js';

export interface DisclosureHeaderProps extends RefProps<HTMLDivElement>, BaseProps {
  /** A `DisclosureTitle` and the controls beside it, which do not toggle the disclosure. */
  children?: ReactNode;
}

export interface CollapsibleTriggerProps
  extends
    BaseProps,
    RefProps<HTMLButtonElement>,
    AriaLabellingProps,
    Pick<PressEventProps, 'onPress'> {
  /** The button's visible label and any decorative indicator. */
  children?: ReactNode;
}

export type AccordionTriggerProps = CollapsibleTriggerProps;

export interface DisclosureTitleProps extends RefProps<HTMLHeadingElement>, BaseProps {
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

export interface DisclosurePanelProps extends RefProps<HTMLDivElement>, BaseProps {
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
    if (!group || !focusManager || !move || !isFreeEditKey(event.nativeEvent)) {
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

/** A button that shows and hides the content without introducing a heading. */
export function CollapsibleTrigger(props: CollapsibleTriggerProps) {
  return <DisclosureTrigger {...props} hasIndicator={false} />;
}

/** An accordion's heading and its trigger, whose ref and attributes go to the button. */
export function AccordionTrigger(props: AccordionTriggerProps) {
  return (
    <DisclosureHeading>
      <DisclosureTrigger {...props} hasIndicator />
    </DisclosureHeading>
  );
}

function DisclosureHeading({ className, ...rest }: Omit<DisclosureTitleProps, 'triggerRef'>) {
  const { level } = useContext(DisclosurePartsContext);
  return (
    <Heading
      {...rest}
      level={level}
      className={mergeClassNames(hooks.slotClass('heading'), className)}
    />
  );
}

/** The disclosure's heading with optional access to its heading and trigger elements separately. */
export function DisclosureTitle({ children, triggerRef, ...rest }: DisclosureTitleProps) {
  return (
    <DisclosureHeading {...rest}>
      <DisclosureTrigger ref={triggerRef} hasIndicator>
        {children}
      </DisclosureTrigger>
    </DisclosureHeading>
  );
}

function DisclosureTrigger({
  className,
  children,
  hasIndicator,
  ...rest
}: CollapsibleTriggerProps & { hasIndicator: boolean }) {
  const { indicatorPosition } = useContext(DisclosurePartsContext);
  const isExpanded = useContext(DisclosureStateContext)?.isExpanded ?? false;
  const glyph = useIndicatorGlyph(indicatorPosition, isExpanded);
  const onKeyDown = useGroupNavigation();
  const indicator = hasIndicator ? (
    <Glyph icon={glyph} className={hooks.slotClass('indicator')} />
  ) : null;
  return (
    <AriaButton
      {...rest}
      {...hooks.slot(
        'trigger',
        { indicatorPosition: hasIndicator ? indicatorPosition : undefined },
        className,
      )}
      slot="trigger"
      onKeyDown={onKeyDown}
    >
      {indicatorPosition === 'start' ? indicator : null}
      <span {...hooks.slot('title')}>{children}</span>
      {indicatorPosition === 'end' ? indicator : null}
    </AriaButton>
  );
}

/**
 * Scopes a disclosure panel's content out of its disclosure: a disclosure inside keeps its own
 * state instead of joining the enclosing group, and an expand toggle inside owns its state instead
 * of showing and toggling the enclosing disclosure.
 */
export function DisclosureContentScope({ children }: { children: ReactNode }) {
  return (
    <DisclosureGroupStateContext value={null}>
      <DisclosureStateContext value={null}>{children}</DisclosureStateContext>
    </DisclosureGroupStateContext>
  );
}

/**
 * The content a disclosure shows and hides. It stays mounted while collapsed, headings inside take
 * the levels below the disclosure's title, and the disclosures and expand toggles inside are its
 * content's own (`DisclosureContentScope`).
 */
export function DisclosurePanel({ className, children, ...rest }: DisclosurePanelProps) {
  const { level, hasHeading } = useContext(DisclosurePartsContext);
  const parentLevel = useContext(HeadingLevelContext);
  return (
    <AriaDisclosurePanel {...rest} className={mergeClassNames(hooks.slotClass('panel'), className)}>
      <HeadingLevelContext value={hasHeading ? level : parentLevel}>
        <DisclosureContentScope>{children}</DisclosureContentScope>
      </HeadingLevelContext>
    </AriaDisclosurePanel>
  );
}
