'use client';

import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  Disclosure,
  DisclosureGroupStateContext,
  DisclosurePanel,
  Heading,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Badge } from '../badge/badge.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import {
  PropertyScopeContext,
  usePropertyScopeLevel,
  useReportPropertyTally,
} from '../property-scope/property-scope.js';
import type { HeadingLevel } from '../section-header/section-header.js';
import { TextMatch } from '../text-match/text-match.js';
import {
  OverrideMark,
  useSectionExpansion,
  type PropertyExpansionProps,
} from './property-disclosure.js';

export interface PropertySectionProps extends Omit<BaseProps, 'id'>, PropertyExpansionProps {
  /** The section's key among the panel's `expandedKeys`. */
  id?: Key | undefined;
  /** Disables the trigger. */
  isDisabled?: boolean | undefined;
  /** Keeps the section mounted, with its rows' state, while removing it from layout and navigation. */
  hidden?: boolean | undefined;
  /** The section's title, in its trigger. A query matches it for every row inside. */
  title: string;
  /** Supporting text at the top of the open section. */
  description?: ReactNode;
  /** Passive text after the count, inside the trigger. */
  meta?: ReactNode;
  /** Buttons after the trigger; pressing them does not toggle the section. */
  actions?: ReactNode;
  /** The count to show, zero included. Defaults to the number of properties inside, when any. */
  count?: number | undefined;
  /** The level of the heading around the trigger. Defaults to 3. */
  headingLevel?: HeadingLevel | undefined;
  /** Remembers whether the section is open through the provider storage under this key, unless the panel opens its sections. */
  persistKey?: string | undefined;
  /** The section's groups, cards and rows. */
  children?: ReactNode;
}

const hooks = createHooks('property-section', [
  'header',
  'heading',
  'trigger',
  'chevron',
  'title',
  'override',
  'count',
  'meta',
  'actions',
  'content',
  'description',
]);

/**
 * A collapsible category of a property panel (React Aria `Disclosure`): a heading whose trigger
 * shows the title, an override mark and the count, trailing actions, and the content, which stays
 * mounted while collapsed. A query opens it while it holds a match and hides it otherwise.
 */
export function PropertySection({
  id,
  title,
  description,
  meta,
  actions,
  count,
  headingLevel = 3,
  persistKey,
  isExpanded,
  defaultExpanded = true,
  onExpandedChange,
  hidden = false,
  children,
  className,
  ...rest
}: PropertySectionProps) {
  const level = usePropertyScopeLevel(title);
  const { total, isFiltering, hasNoMatch } = level;
  useReportPropertyTally(level.parent, {
    ...total,
    matches: hidden ? 0 : total.matches,
    isPending: !hidden && total.isPending,
  });
  const expansion = useSectionExpansion({
    id,
    isFiltering,
    isExpandedWhileFiltering: true,
    isExpanded,
    defaultExpanded,
    onExpandedChange,
    persistKey,
  });
  const glyph = useExpandGlyph(expansion.isExpanded);
  const shownCount = count ?? (total.count > 0 ? total.count : undefined);

  return (
    // The section follows the panel's expansion itself, so a query can still open it.
    <DisclosureGroupStateContext value={null}>
      <Disclosure
        {...rest}
        {...expansion}
        {...hooks.root({ className, data: { overridden: total.isOverridden } })}
        hidden={hidden || hasNoMatch}
      >
        <div {...hooks.slot('header')}>
          <Heading level={headingLevel} className={hooks.slotClass('heading')}>
            {/* Spaces between the parts keep the trigger's accessible name readable. */}
            <AriaButton slot="trigger" className={hooks.slotClass('trigger')}>
              <Glyph icon={glyph} className={hooks.slotClass('chevron')} />
              <span {...hooks.slot('title')}>
                <TextMatch>{title}</TextMatch>
              </span>{' '}
              {total.isOverridden ? <OverrideMark className={hooks.slotClass('override')} /> : null}{' '}
              {shownCount === undefined ? null : (
                <Badge count={shownCount} size="sm" className={hooks.slotClass('count')} />
              )}{' '}
              {isEmptyNode(meta) ? null : <span {...hooks.slot('meta')}>{meta}</span>}
            </AriaButton>
          </Heading>
          {isEmptyNode(actions) ? null : <div {...hooks.slot('actions')}>{actions}</div>}
        </div>
        <DisclosurePanel className={hooks.slotClass('content')}>
          {isEmptyNode(description) ? null : (
            <div {...hooks.slot('description')}>{description}</div>
          )}
          <PropertyScopeContext value={level.value}>{children}</PropertyScopeContext>
        </DisclosurePanel>
      </Disclosure>
    </DisclosureGroupStateContext>
  );
}
