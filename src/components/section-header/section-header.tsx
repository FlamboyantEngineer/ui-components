'use client';

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  Button as AriaButton,
  useDisclosure,
  useFocusRing,
  type DisclosureState,
} from '../../primitives/index.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import { containsFocus } from '../../utils/focus-target.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { mergeProps } from '../../utils/merge-props.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { Stack, type LayoutContainmentProps, type LayoutSpace } from '../layout/layout.js';
import {
  HeadingLevelContext,
  useHeadingLevel,
  type HeadingLevel,
} from '../../core/heading-level.js';

export { HeadingLevelContext, useHeadingLevel } from '../../core/heading-level.js';
export type { HeadingLevel } from '../../core/heading-level.js';

export interface SectionHeaderProps extends BaseProps {
  /** The heading text. */
  title: ReactNode;
  /** Supporting text under the title. Omitted when it renders nothing. */
  description?: ReactNode;
  /** Trailing actions or status, after the text. */
  actions?: ReactNode;
  /** The heading element's level. Defaults to one below the enclosing section's, else 3. */
  headingLevel?: HeadingLevel | undefined;
}

export interface SectionProps extends SectionHeaderProps, LayoutContainmentProps {
  /** The section's content, after its header. */
  children?: ReactNode;
  /** Gap between the header and the content. Defaults to `2xl`. */
  space?: LayoutSpace | undefined;
  /** The title toggles the content. Expanded by default. */
  collapsible?: boolean | undefined;
  /** Whether a collapsible section's content shows (controlled). */
  isExpanded?: boolean | undefined;
  /** Whether a collapsible section's content shows at first. Defaults to `true`. */
  defaultExpanded?: boolean | undefined;
  /** Receives each requested expanded state of a collapsible section. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}

type HeaderContentProps = Pick<SectionHeaderProps, 'title' | 'description' | 'actions'> & {
  headingLevel: HeadingLevel;
  headingId: string;
};

const headerHooks = createHooks('section-header', [
  'content',
  'title',
  'trigger',
  'chevron',
  'description',
  'actions',
]);
const sectionHooks = createHooks('section', ['panel']);

function HeaderContent({
  title,
  description,
  actions,
  headingLevel,
  headingId,
}: HeaderContentProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <>
      <div {...headerHooks.slot('content')}>
        <Heading {...headerHooks.slot('title')} id={headingId}>
          {title}
        </Heading>
        {isEmptyNode(description) ? null : (
          <div {...headerHooks.slot('description')}>{description}</div>
        )}
      </div>
      {isEmptyNode(actions) ? null : <div {...headerHooks.slot('actions')}>{actions}</div>}
    </>
  );
}

/** The trigger's chevron: toward the inline end while collapsed, down while expanded. */
function SectionChevron({ isExpanded }: { isExpanded: boolean }) {
  const glyph = useExpandGlyph(isExpanded);
  return <Glyph icon={glyph} className={headerHooks.slotClass('chevron')} />;
}

/**
 * A section title with optional supporting text and trailing actions, in a `<header>` that is not
 * a landmark: outside sectioning content a `<header>` would be the page's banner.
 */
export function SectionHeader({
  title,
  description,
  actions,
  headingLevel,
  className,
  ...rest
}: SectionHeaderProps) {
  const headingId = useId();
  const level = useHeadingLevel(headingLevel);
  return (
    <header role="none" {...rest} {...headerHooks.root({ className })}>
      <HeaderContent
        title={title}
        description={description}
        actions={actions}
        headingLevel={level}
        headingId={headingId}
      />
    </header>
  );
}

type SectionDisclosureOptions = Pick<
  SectionProps,
  'collapsible' | 'isExpanded' | 'defaultExpanded' | 'onExpandedChange'
>;

/**
 * The expanded state of a section and the props of its trigger and panel. A section that is not
 * collapsible is always expanded and its panel takes no disclosure props, but it keeps the same
 * elements, so turning `collapsible` on or off never remounts the content.
 */
function useSectionDisclosure({
  collapsible = false,
  isExpanded,
  defaultExpanded = true,
  onExpandedChange,
}: SectionDisclosureOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const noPanel = useRef<HTMLDivElement>(null);
  const [ownExpanded, setOwnExpanded] = useState(defaultExpanded);
  const expanded = !collapsible || (isExpanded ?? ownExpanded);
  const setExpanded = (next: boolean) => {
    if (isExpanded === undefined) setOwnExpanded(next);
    onExpandedChange?.(next);
  };
  const state: DisclosureState = {
    isExpanded: expanded,
    setExpanded,
    expand: () => setExpanded(true),
    collapse: () => setExpanded(false),
    toggle: () => setExpanded(!expanded),
  };
  const disclosure = useDisclosure(
    { isExpanded: expanded },
    state,
    collapsible ? panelRef : noPanel,
  );
  const focusWithin = useFocusRing({ within: true });
  // Content that stops showing takes keyboard focus with it: the trigger receives it.
  useLayoutEffect(() => {
    if (expanded || !containsFocus(panelRef.current)) return;
    triggerRef.current?.focus();
  }, [expanded]);
  const panelProps = collapsible
    ? mergeProps(disclosure.panelProps, focusWithin.focusProps, {
        'data-focus-visible-within': focusWithin.isFocusVisible || undefined,
      })
    : {};
  return {
    collapsible,
    expanded,
    panelRef,
    triggerRef,
    buttonProps: disclosure.buttonProps,
    panelProps,
    isFocusVisibleWithin: collapsible && focusWithin.isFocusVisible,
  };
}

/**
 * A `<section>` region named by its header's title, followed by its content in a `Stack`. The
 * description and actions stay out of the region's name. Sections nested in its content take the
 * next heading level, and a `collapsible` section's title toggles its content. The content keeps
 * the same elements whether the section is collapsible or not, so changing it keeps its state.
 */
export function Section({
  title,
  description,
  actions,
  headingLevel,
  children,
  space = '2xl',
  className,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  collapsible,
  ...rest
}: SectionProps) {
  const headingId = useId();
  const level = useHeadingLevel(headingLevel);
  const {
    collapsible: isCollapsible,
    expanded,
    buttonProps,
    triggerRef,
    panelProps,
    panelRef,
    isFocusVisibleWithin,
  } = useSectionDisclosure({ collapsible, isExpanded, defaultExpanded, onExpandedChange });
  const heading = isCollapsible ? (
    <AriaButton {...buttonProps} ref={triggerRef} className={headerHooks.slotClass('trigger')}>
      <SectionChevron isExpanded={expanded} />
      {title}
    </AriaButton>
  ) : (
    title
  );
  return (
    <Stack
      as="section"
      {...rest}
      className={mergeClassNames(sectionHooks.className, className)}
      data-collapsible={isCollapsible || undefined}
      data-expanded={(isCollapsible && expanded) || undefined}
      data-focus-visible-within={isFocusVisibleWithin || undefined}
      space={space}
      aria-labelledby={headingId}
    >
      <header {...headerHooks.root()}>
        <HeaderContent
          title={heading}
          description={description}
          actions={actions}
          headingLevel={level}
          headingId={headingId}
        />
      </header>
      <div {...panelProps} ref={panelRef} className={sectionHooks.slotClass('panel')}>
        <HeadingLevelContext value={level}>
          <Stack space={space}>{children}</Stack>
        </HeadingLevelContext>
      </div>
    </Stack>
  );
}
