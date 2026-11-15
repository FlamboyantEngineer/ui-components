'use client';

import { type ReactNode, useContext, useId, useMemo, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { ExpansionProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { DisclosureGroup, DisclosureGroupStateContext } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { FieldScopeContext, useFieldScope } from '../field/field.js';
import { SearchField } from '../search-field/search-field.js';
import { TextMatch } from '../text-match/text-match.js';
import {
  PropertyScopeContext,
  type PropertyScopeFilter,
  ScopeLevel,
  usePropertyScopeLevel,
  useReportPropertyTally,
} from './property-scope.js';

/** `responsive` stacks row labels over their controls in a narrow panel; `inline` keeps them beside. */
export type PropertyPanelLabelLayout = 'responsive' | 'inline';

/** `separate` frames each button; `segmented` frames the run once, with dividers. */
export type PropertyIconGroupVariant = 'separate' | 'segmented';

export interface PropertyPanelProps
  extends
    RefProps<HTMLElement>,
    BaseProps,
    Pick<NativeProps<'section'>, 'aria-label' | 'aria-labelledby'>,
    ExpansionProps {
  /** Lets several sections be open at once; `false` makes the panel an accordion. Defaults to `true`. */
  allowsMultipleExpanded?: boolean | undefined;
  /** Content above the body, such as a title or a search box. */
  header?: ReactNode;
  /** Draws a search input alongside the supplied header content. */
  searchable?: boolean | undefined;
  /** The query, controlled. */
  query?: string | undefined;
  /** The query to start from, uncontrolled. */
  defaultQuery?: string | undefined;
  /** Called as the query changes or clears. */
  onQueryChange?: ((query: string) => void) | undefined;
  /** Replaces the default term matching. */
  filter?: PropertyScopeFilter | undefined;
  /** Placeholder text in the built-in search input. */
  searchPlaceholder?: string | undefined;
  /** Where row labels sit. Defaults to `responsive`. */
  labelLayout?: PropertyPanelLabelLayout | undefined;
  /** Disables every field inside, which then refuses changes. */
  isDisabled?: boolean | undefined;
  /** Makes every field inside read-only. */
  isReadOnly?: boolean | undefined;
  /** The panel's sections, groups and rows. */
  children?: ReactNode;
}

export interface PropertyGroupProps extends RefProps<HTMLDivElement>, BaseProps {
  /** A heading over the rows, which also names the group. A query matches it for every row inside. */
  heading?: string | undefined;
  /** The group's rows and cards. */
  children?: ReactNode;
}

export interface PropertyIconGroupProps
  extends
    RefProps<HTMLDivElement>,
    BaseProps,
    Pick<NativeProps<'div'>, 'aria-label' | 'aria-labelledby'> {
  /** How the stylesheet frames the buttons. Defaults to `separate`. */
  variant?: PropertyIconGroupVariant | undefined;
  /** The icon buttons. */
  children?: ReactNode;
}

const panelHooks = createHooks('property-panel', ['header', 'search', 'body']);
const groupHooks = createHooks('property-group', ['heading']);
const iconGroupHooks = createHooks('property-icon-group');

/** Hands the panel's disclosure group state on to the sections only while the panel manages it. */
function ManagedSections({ isManaged, children }: { isManaged: boolean; children: ReactNode }) {
  const group = useContext(DisclosureGroupStateContext);
  return (
    <DisclosureGroupStateContext value={isManaged ? group : null}>
      {children}
    </DisclosureGroupStateContext>
  );
}

/**
 * The body: always React Aria's disclosure group, so the sections keep their place in the tree
 * whether or not the panel opens and closes them; while it does not, the sections keep their own
 * state. The group is always controlled: uncontrolled keys start from `defaultExpandedKeys` each
 * time the panel starts managing its sections.
 */
function PanelBody({
  expansion,
  children,
}: {
  expansion: Pick<
    PropertyPanelProps,
    'expandedKeys' | 'defaultExpandedKeys' | 'onExpandedChange' | 'allowsMultipleExpanded'
  >;
  children: ReactNode;
}) {
  const { expandedKeys, defaultExpandedKeys, onExpandedChange, allowsMultipleExpanded } = expansion;
  const isManaged =
    expandedKeys !== undefined ||
    defaultExpandedKeys !== undefined ||
    allowsMultipleExpanded !== undefined;
  const [own, setOwn] = useState(() => ({ isManaged, keys: new Set(defaultExpandedKeys) }));
  if (own.isManaged !== isManaged) setOwn({ isManaged, keys: new Set(defaultExpandedKeys) });
  return (
    <DisclosureGroup
      className={panelHooks.slotClass('body')}
      expandedKeys={expandedKeys ?? own.keys}
      onExpandedChange={(keys) => {
        if (expandedKeys === undefined) setOwn({ isManaged, keys });
        onExpandedChange?.(keys);
      }}
      allowsMultipleExpanded={allowsMultipleExpanded ?? true}
    >
      <ManagedSections isManaged={isManaged}>{children}</ManagedSections>
    </DisclosureGroup>
  );
}

/**
 * A panel of labelled properties of one subject, as a `<section>` with an optional header. It can
 * open and close its sections as a group, and disable or lock every field inside.
 */
export function PropertyPanel({
  header,
  searchable = false,
  query: controlledQuery,
  defaultQuery,
  onQueryChange,
  filter,
  searchPlaceholder,
  labelLayout = 'responsive',
  isDisabled = false,
  isReadOnly = false,
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  allowsMultipleExpanded,
  children,
  className,
  ...rest
}: PropertyPanelProps) {
  const parent = useFieldScope();
  const strings = useUiStrings();
  const [query, setQuery] = useControllableState(
    controlledQuery,
    defaultQuery ?? '',
    onQueryChange,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };
  const hasScope =
    searchable ||
    controlledQuery !== undefined ||
    defaultQuery !== undefined ||
    filter !== undefined;
  const search = searchable ? (
    <SearchField
      className={panelHooks.slotClass('search')}
      label={rest['aria-label'] ? strings.filterLabel(rest['aria-label']) : strings.search}
      placeholder={searchPlaceholder}
      value={query}
      onChange={setQuery}
      inputRef={inputRef}
    />
  ) : null;
  const scope = useMemo(
    () => ({
      ...parent,
      isDisabled: parent.isDisabled || isDisabled,
      isReadOnly: parent.isReadOnly || isReadOnly,
    }),
    [parent, isDisabled, isReadOnly],
  );
  const expansion = { expandedKeys, defaultExpandedKeys, onExpandedChange, allowsMultipleExpanded };
  const data = { labelLayout, disabled: isDisabled, readonly: isReadOnly };
  return (
    <section {...rest} {...panelHooks.root({ className, data })}>
      {isEmptyNode(header) && !searchable ? null : (
        <div {...panelHooks.slot('header')}>
          {header}
          {search}
        </div>
      )}
      <FieldScopeContext value={scope}>
        <PanelBody expansion={expansion}>
          <ScopeLevel query={query} filter={filter} onClear={clearQuery} isInherited={!hasScope}>
            {children}
          </ScopeLevel>
        </PanelBody>
      </FieldScopeContext>
    </section>
  );
}

/** A run of rows under an optional heading. A query hides it while no row inside matches. */
export function PropertyGroup({ heading, children, className, id, ...rest }: PropertyGroupProps) {
  const level = usePropertyScopeLevel(heading);
  useReportPropertyTally(level.parent, level.total);
  const generatedId = useId();
  const headingId = `${id ?? generatedId}-heading`;
  const hasHeading = Boolean(heading);

  return (
    <div
      {...rest}
      {...groupHooks.root({ className })}
      id={id}
      role={hasHeading ? 'group' : undefined}
      aria-labelledby={hasHeading ? headingId : undefined}
      hidden={level.hasNoMatch}
    >
      {heading ? (
        <div {...groupHooks.slot('heading')} id={headingId}>
          <TextMatch>{heading}</TextMatch>
        </div>
      ) : null}
      <PropertyScopeContext value={level.value}>{children}</PropertyScopeContext>
    </div>
  );
}

/** A named group of related icon buttons inside one property row, such as text alignments. */
export function PropertyIconGroup({
  variant = 'separate',
  children,
  className,
  ...rest
}: PropertyIconGroupProps) {
  return (
    <div {...rest} {...iconGroupHooks.root({ className, data: { variant } })} role="group">
      {children}
    </div>
  );
}

export type { PropertyCardProps } from './property-card.js';
export { PropertyCard } from './property-card.js';
export type { PropertyInheritance, PropertyRowProps } from './property-row.js';
export { PropertyRow } from './property-row.js';
export type { PropertyScopeFilter, PropertyScopeProps } from './property-scope.js';
export { PropertyScope } from './property-scope.js';
export type { PropertySectionProps } from './property-section.js';
export { PropertySection } from './property-section.js';
export type { PropertyStripCellProps, PropertyStripProps } from './property-strip.js';
export { PropertyStrip, PropertyStripCell } from './property-strip.js';
