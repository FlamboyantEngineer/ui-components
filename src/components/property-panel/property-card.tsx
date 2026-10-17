import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  Disclosure,
  DisclosureGroupStateContext,
  DisclosurePanel,
  type DisclosureProps,
} from 'react-aria-components';
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
import { OverrideMark, useScopedExpansion } from './property-disclosure.js';

export interface PropertyCardProps
  extends
    Omit<DisclosureProps, 'className' | 'style' | 'children' | 'render' | 'id'>,
    Omit<BaseProps, 'id'> {
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
  hidden = false,
  children,
  className,
  ...rest
}: PropertyCardProps) {
  const level = usePropertyScopeLevel(name);
  const { parent, total, isFiltering } = level;
  const isMatch = matchesPropertyScope(parent, [name]) || total.matches > 0;
  const overridden = isOverridden || total.isOverridden;
  useReportPropertyTally(parent, {
    count: 1,
    matches: isMatch && !hidden ? 1 : 0,
    isOverridden: overridden,
  });
  const expansion = useScopedExpansion({
    isFiltering,
    isExpandedWhileFiltering: isMatch,
    isExpanded,
    defaultExpanded,
    onExpandedChange,
  });
  const glyph = useExpandGlyph(expansion.isExpanded);

  return (
    // A card keeps its own state inside a panel that opens and closes its sections.
    <DisclosureGroupStateContext value={null}>
      <Disclosure
        {...rest}
        {...expansion}
        {...hooks.root({ className, data: { overridden } })}
        hidden={hidden || !isMatch}
      >
        <div {...hooks.slot('header')}>
          {/* Spaces between the parts keep the trigger's accessible name readable. */}
          <AriaButton slot="trigger" className={hooks.slotClass('trigger')}>
            <Glyph name={glyph} className={hooks.slotClass('chevron')} />
            <span {...hooks.slot('name')}>
              <TextMatch>{name}</TextMatch>
            </span>{' '}
            {isEmptyNode(summary) ? null : <span {...hooks.slot('summary')}>{summary}</span>}{' '}
            {overridden ? <OverrideMark className={hooks.slotClass('override')} /> : null}
          </AriaButton>
          {isEmptyNode(actions) ? null : <div {...hooks.slot('actions')}>{actions}</div>}
        </div>
        <DisclosurePanel className={hooks.slotClass('body')}>
          <PropertyScopeContext value={level.value}>{children}</PropertyScopeContext>
        </DisclosurePanel>
      </Disclosure>
    </DisclosureGroupStateContext>
  );
}
