import { useMemo, type ReactNode, type Ref } from 'react';
import { FocusScope } from 'react-aria';
import {
  Disclosure as AriaDisclosure,
  DisclosureGroup as AriaDisclosureGroup,
  type DisclosureGroupProps as AriaDisclosureGroupProps,
  type DisclosureProps as AriaDisclosureProps,
} from 'react-aria-components';
import type { BaseProps } from '../../core/props.js';
import { useHeadingLevel, type HeadingLevel } from '../section-header/section-header.js';
import {
  DisclosurePartsContext,
  disclosureGroupHooks as groupHooks,
  disclosureHooks as hooks,
  type DisclosureIndicatorPosition,
} from './disclosure-hooks.js';
import { DisclosurePanel, DisclosureTitle } from './disclosure-parts.js';

export type { DisclosureIndicatorPosition } from './disclosure-hooks.js';

export interface DisclosureProps
  extends Omit<AriaDisclosureProps, 'className' | 'style' | 'children'>, Omit<BaseProps, 'id'> {
  /**
   * The title the disclosure draws in its trigger; `children` then fill its panel. Without it,
   * `children` compose the parts: a `DisclosureTitle` (or a `DisclosureHeader` around one) and a
   * `DisclosurePanel`.
   */
  title?: ReactNode;
  /** The title's heading level. Defaults to one below the enclosing section's, else 3. */
  headingLevel?: HeadingLevel | undefined;
  /** Where the trigger's indicator glyph sits. Defaults to `start`. */
  indicatorPosition?: DisclosureIndicatorPosition | undefined;
  /** The panel's content with `title`, else the parts. */
  children?: ReactNode;
  /** The root element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface DisclosureGroupProps
  extends Omit<AriaDisclosureGroupProps, 'className' | 'style' | 'children'>, BaseProps {
  /** The group's disclosures, each with an `id` naming it in the expanded keys. */
  children?: ReactNode;
  /** The root element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

/**
 * A collapsible section (React Aria `Disclosure`): a heading whose trigger toggles a panel. With
 * `title` it draws its own title and panel; without it, the caller composes the parts. Inside a
 * `DisclosureGroup` its `id` is its key among the group's expanded keys.
 */
export function Disclosure({
  title,
  headingLevel,
  indicatorPosition = 'start',
  children,
  className,
  ...rest
}: DisclosureProps) {
  const level = useHeadingLevel(headingLevel);
  const parts = useMemo(() => ({ level, indicatorPosition }), [level, indicatorPosition]);
  return (
    <AriaDisclosure {...rest} {...hooks.root({ className, data: { indicatorPosition } })}>
      <DisclosurePartsContext value={parts}>
        {title == null ? (
          children
        ) : (
          <>
            <DisclosureTitle>{title}</DisclosureTitle>
            <DisclosurePanel>{children}</DisclosurePanel>
          </>
        )}
      </DisclosurePartsContext>
    </AriaDisclosure>
  );
}

/**
 * Disclosures that expand together (React Aria `DisclosureGroup`), one at a time as an accordion
 * unless `allowsMultipleExpanded`. Arrow keys, Home and End move focus between their triggers.
 */
export function DisclosureGroup({ className, children, ...rest }: DisclosureGroupProps) {
  return (
    <AriaDisclosureGroup {...rest} {...groupHooks.root({ className })}>
      <FocusScope>{children}</FocusScope>
    </AriaDisclosureGroup>
  );
}

export { DisclosureHeader, DisclosurePanel, DisclosureTitle } from './disclosure-parts.js';
export type {
  DisclosureHeaderProps,
  DisclosurePanelProps,
  DisclosureTitleProps,
} from './disclosure-parts.js';
