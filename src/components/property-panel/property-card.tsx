'use client';

import { DisclosureContentScope } from '../disclosure/disclosure.js';
import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  Disclosure,
  DisclosureGroupStateContext,
  DisclosurePanel,
} from '../../primitives/index.js';
import { FieldScopeContext, useRevealScope } from '../field/field.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import {
  PropertyScopeContext,
  matchesPropertyScope,
  usePropertyScopeLevel,
  useReportPropertyTally,
} from '../property-scope/property-scope.js';
import { TextMatch } from '../text-match/text-match.js';
import {
  OverrideMark,
  useScopedExpansion,
  type PropertyExpansionProps,
} from './property-disclosure.js';

export interface PropertyCardProps extends Omit<BaseProps, 'id'>, PropertyExpansionProps {
  /** The card's name, in its trigger. A query matches it for every row inside. */
  name: string;
  /** A short summary of the values inside, after the name. */
  summary?: ReactNode;
  /** Whether a value inside overrides an inherited one; the rows inside also report it. */
  isOverridden?: boolean | undefined;
  /** Buttons after the trigger; pressing them does not toggle the card. */
  actions?: ReactNode;
  /** The card's rows. */
  children?: ReactNode;
}

const hooks = createHooks('property-card', [
  'header',
  'trigger',
  'chevron',
  'name',
  'summary',
  'override',
  'actions',
  'body',
]);

/**
 * A collapsible group of related properties inside a section (React Aria `Disclosure`), counted as
 * one property of its section. A query keeps it while its name or a row inside matches, and opens it.
 */
export function PropertyCard({
  name,
  summary,
  isOverridden = false,
  actions,
  isExpanded,
  defaultExpanded = false,
  onExpandedChange,
  children,
  className,
  ...rest
}: PropertyCardProps) {
  const level = usePropertyScopeLevel(name);
  const { parent, total, isFiltering } = level;
  // Until the rows inside have reported, the card stays shown rather than hide a match.
  const isMatch = matchesPropertyScope(parent, [name]) || total.matches > 0 || total.isPending;
  const overridden = isOverridden || total.isOverridden;
  useReportPropertyTally(parent, {
    count: 1,
    matches: isMatch ? 1 : 0,
    isOverridden: overridden,
    isPending: total.isPending,
  });
  const { expansion, reveal } = useScopedExpansion({
    isFiltering,
    isExpandedWhileFiltering: isMatch,
    isExpanded,
    defaultExpanded,
    onExpandedChange,
  });
  const fieldScope = useRevealScope(reveal);
  const glyph = useExpandGlyph(expansion.isExpanded);

  return (
    // A card keeps its own state inside a panel that opens and closes its sections.
    <DisclosureGroupStateContext value={null}>
      <Disclosure
        {...rest}
        {...expansion}
        {...hooks.root({ className, data: { overridden } })}
        hidden={!isMatch}
      >
        <div {...hooks.slot('header')}>
          {/* Spaces between the parts keep the trigger's accessible name readable. */}
          <AriaButton slot="trigger" className={hooks.slotClass('trigger')}>
            <Glyph icon={glyph} className={hooks.slotClass('chevron')} />
            <span {...hooks.slot('name')}>
              <TextMatch>{name}</TextMatch>
            </span>{' '}
            {isEmptyNode(summary) ? null : <span {...hooks.slot('summary')}>{summary}</span>}{' '}
            {overridden ? <OverrideMark className={hooks.slotClass('override')} /> : null}
          </AriaButton>
          {isEmptyNode(actions) ? null : <div {...hooks.slot('actions')}>{actions}</div>}
        </div>
        <DisclosurePanel className={hooks.slotClass('body')}>
          <DisclosureContentScope>
            <FieldScopeContext value={fieldScope}>
              <PropertyScopeContext value={level.value}>{children}</PropertyScopeContext>
            </FieldScopeContext>
          </DisclosureContentScope>
        </DisclosurePanel>
      </Disclosure>
    </DisclosureGroupStateContext>
  );
}
