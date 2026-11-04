'use client';

import { type ReactNode, useMemo } from 'react';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import {
  Disclosure as AriaDisclosure,
  DisclosureGroup as AriaDisclosureGroup,
  FocusScope,
} from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { materializeIterator } from '../../utils/materialize-iterator.js';
import type { ElementRender } from '../../utils/render-element.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { type HeadingLevel, useHeadingLevel } from '../section-header/section-header.js';
import {
  disclosureGroupHooks as groupHooks,
  disclosureHooks as hooks,
  type DisclosureIndicatorPosition,
  DisclosurePartsContext,
} from './disclosure-hooks.js';
import { DisclosurePanel, DisclosureTitle } from './disclosure-parts.js';

export type { DisclosureIndicatorPosition } from './disclosure-hooks.js';

/** The states a disclosure passes to `render` with its root's props. */
export interface DisclosureRenderState {
  isExpanded: boolean;
  /** Keyboard focus is inside the disclosure. */
  isFocusVisibleWithin: boolean;
  isDisabled: boolean;
}

/** The state a disclosure group passes to `render` with its root's props. */
export interface DisclosureGroupRenderState {
  isDisabled: boolean;
}

export interface DisclosureProps extends Omit<BaseProps, 'id'>, RefProps<HTMLDivElement> {
  /** The disclosure's key among a `DisclosureGroup`'s expanded keys; it stays off the element. */
  id?: Key | undefined;
  /** Whether the panel shows (controlled). */
  isExpanded?: boolean | undefined;
  /** Whether the panel shows at first when uncontrolled. */
  defaultExpanded?: boolean | undefined;
  /** Receives each requested expanded state, also while controlled. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  /** Disables the trigger; the panel keeps its state. */
  isDisabled?: boolean | undefined;
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
  /** Replaces the root `<div>` with the caller's own, given its props and state. */
  render?: ElementRender<'div', DisclosureRenderState> | undefined;
}

export interface DisclosureGroupProps extends BaseProps, RefProps<HTMLDivElement> {
  /** The `id`s of the open disclosures (controlled). */
  expandedKeys?: Iterable<Key> | undefined;
  /** The `id`s of the disclosures open at first when uncontrolled. */
  defaultExpandedKeys?: Iterable<Key> | undefined;
  /** Receives the requested set of open `id`s after each toggle. */
  onExpandedChange?: ((keys: Set<Key>) => void) | undefined;
  /** Lets several disclosures stay open; by default opening one closes the other. */
  allowsMultipleExpanded?: boolean | undefined;
  /** Disables every disclosure in the group. */
  isDisabled?: boolean | undefined;
  /** The group's disclosures, each with an `id` naming it in the expanded keys. */
  children?: ReactNode;
  /** Replaces the root `<div>` with the caller's own, given its props and state. */
  render?: ElementRender<'div', DisclosureGroupRenderState> | undefined;
}

/**
 * React Aria replaces a falsy disclosure id with a generated one, so `0` and `''` would not match
 * the group's keys: ids and keys cross to it encoded.
 */
function toGroupKeys(keys: Iterable<Key> | undefined): Key[] | undefined {
  return keys === undefined ? undefined : Array.from(materializeIterator(keys), toCollectionKey);
}

/**
 * A collapsible section: a heading whose trigger toggles a panel. With
 * `title` it draws its own title and panel; without it, the caller composes the parts. Inside a
 * `DisclosureGroup` its `id` is its key among the group's expanded keys.
 */
export function Disclosure({
  id,
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
    <AriaDisclosure
      {...rest}
      id={id === undefined ? undefined : toCollectionKey(id)}
      {...hooks.root({ className, data: { indicatorPosition } })}
    >
      <DisclosurePartsContext value={parts}>
        {isEmptyNode(title) ? (
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
 * Disclosures that expand together, one at a time as an accordion
 * unless `allowsMultipleExpanded`. Arrow keys, Home and End move focus between their triggers.
 */
export function DisclosureGroup({
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  className,
  children,
  ...rest
}: DisclosureGroupProps) {
  const ariaExpandedKeys = useMemo(() => toGroupKeys(expandedKeys), [expandedKeys]);
  const ariaDefaultExpandedKeys = useMemo(
    () => toGroupKeys(defaultExpandedKeys),
    [defaultExpandedKeys],
  );
  return (
    <AriaDisclosureGroup
      {...rest}
      expandedKeys={ariaExpandedKeys}
      defaultExpandedKeys={ariaDefaultExpandedKeys}
      onExpandedChange={
        onExpandedChange &&
        ((keys: Set<Key>) => onExpandedChange(new Set(Array.from(keys, fromCollectionKey))))
      }
      {...groupHooks.root({ className })}
    >
      <FocusScope>{children}</FocusScope>
    </AriaDisclosureGroup>
  );
}

export type {
  DisclosureHeaderProps,
  DisclosurePanelProps,
  DisclosurePanelRenderState,
  DisclosurePanelRole,
  DisclosureTitleProps,
} from './disclosure-parts.js';
export {
  DisclosureContentScope,
  DisclosureHeader,
  DisclosurePanel,
  DisclosureTitle,
} from './disclosure-parts.js';
