import { useContext, useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import {
  Button as AriaButton,
  Disclosure,
  DisclosurePanel,
  DisclosureStateContext,
} from '../../primitives/index.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { Stack, type LayoutContainmentProps, type LayoutSpace } from '../layout/layout.js';
import { HeadingLevelContext, useHeadingLevel, type HeadingLevel } from './heading-level.js';

export { HeadingLevelContext, useHeadingLevel } from './heading-level.js';
export type { HeadingLevel } from './heading-level.js';

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

/** The trigger's chevron, following the enclosing disclosure's state. */
function SectionChevron() {
  const state = useContext(DisclosureStateContext);
  const glyph = useExpandGlyph(state?.isExpanded ?? false);
  return <Glyph icon={glyph} className={headerHooks.slotClass('chevron')} />;
}

/**
 * A section whose title is a disclosure trigger: the section stays a `Stack` named by its heading,
 * and its content collapses in a disclosure panel.
 */
function CollapsibleSection({
  title,
  description,
  actions,
  headingLevel,
  children,
  space = '2xl',
  className,
  isExpanded,
  defaultExpanded = true,
  onExpandedChange,
  grow,
  fill,
  clip,
  collapsible: _collapsible,
  ...rest
}: SectionProps) {
  const headingId = useId();
  const level = useHeadingLevel(headingLevel);
  const trigger = (
    <AriaButton slot="trigger" className={headerHooks.slotClass('trigger')}>
      <SectionChevron />
      {title}
    </AriaButton>
  );
  return (
    <Disclosure
      isExpanded={isExpanded}
      defaultExpanded={defaultExpanded}
      onExpandedChange={onExpandedChange}
      // React Aria keeps `id` and naming props off its element; the section takes them here.
      render={(domProps) => (
        <Stack
          as="section"
          {...(domProps as ComponentPropsWithRef<'section'>)}
          {...rest}
          className={mergeClassNames(sectionHooks.className, className)}
          data-collapsible="true"
          space={space}
          grow={grow}
          fill={fill}
          clip={clip}
          aria-labelledby={headingId}
        />
      )}
    >
      <header {...headerHooks.root()}>
        <HeaderContent
          title={trigger}
          description={description}
          actions={actions}
          headingLevel={level}
          headingId={headingId}
        />
      </header>
      <DisclosurePanel className={sectionHooks.slotClass('panel')}>
        <HeadingLevelContext value={level}>
          <Stack space={space}>{children}</Stack>
        </HeadingLevelContext>
      </DisclosurePanel>
    </Disclosure>
  );
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

/** A section whose content always shows. */
function PlainSection({
  title,
  description,
  actions,
  headingLevel,
  children,
  space = '2xl',
  className,
  isExpanded: _isExpanded,
  defaultExpanded: _defaultExpanded,
  onExpandedChange: _onExpandedChange,
  collapsible: _collapsible,
  ...rest
}: SectionProps) {
  const headingId = useId();
  const level = useHeadingLevel(headingLevel);
  return (
    <Stack
      as="section"
      {...rest}
      className={mergeClassNames(sectionHooks.className, className)}
      space={space}
      aria-labelledby={headingId}
    >
      <header {...headerHooks.root()}>
        <HeaderContent
          title={title}
          description={description}
          actions={actions}
          headingLevel={level}
          headingId={headingId}
        />
      </header>
      <HeadingLevelContext value={level}>{children}</HeadingLevelContext>
    </Stack>
  );
}

/**
 * A `<section>` region named by its header's title, followed by its content in a `Stack`. The
 * description and actions stay out of the region's name. Sections nested in its content take the
 * next heading level, and a `collapsible` section's title toggles its content.
 */
export function Section(props: SectionProps) {
  return props.collapsible ? <CollapsibleSection {...props} /> : <PlainSection {...props} />;
}
