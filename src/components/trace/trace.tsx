'use client';

import { useContext } from 'react';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import { DisclosureStateContext } from '../../primitives/index.js';
import {
  Collapsible,
  CollapsibleContent,
  type CollapsibleContentProps,
  type CollapsibleProps,
  CollapsibleTrigger,
  type CollapsibleTriggerProps,
} from '../disclosure/disclosure.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';

/** A line's progress: `running` while it goes on, `pending` before it starts, `error` once it failed. */
export type TraceLineStatus = 'running' | 'pending' | 'error';

export interface TraceProps extends ContainerProps<'div'>, BaseProps {}

export interface TraceLineProps extends ContainerProps<'span'>, BaseProps {
  /** The line's progress; a line without one is done. */
  status?: TraceLineStatus | undefined;
}

export interface TraceIconProps extends ContainerProps<'span'>, BaseProps {}

export interface TraceTitleProps extends ContainerProps<'span'>, BaseProps {}

export interface TraceDescriptionProps extends ContainerProps<'span'>, BaseProps {}

export type TraceCollapsibleProps = Omit<CollapsibleProps, 'render'>;

export type TraceCollapsibleTriggerProps = CollapsibleTriggerProps;

export type TraceCollapsibleContentProps = CollapsibleContentProps;

const hooks = createHooks('trace', [
  'line',
  'icon',
  'title',
  'description',
  'collapsible',
  'collapsible-trigger',
  'collapsible-indicator',
  'collapsible-content',
]);

/** The record of what an agent did, one line per step, in order. */
export function Trace({ className, ...props }: TraceProps) {
  return <div {...props} {...hooks.root({ className })} />;
}

/** One step: an icon, a title and a description, such as "Ran tests · 2s". */
export function TraceLine({ status, className, ...props }: TraceLineProps) {
  return <span {...props} {...hooks.slot('line', { status }, className)} />;
}

/** A decorative glyph or spinner before a line's title. */
export function TraceIcon({ className, ...props }: TraceIconProps) {
  return <span aria-hidden="true" {...props} {...hooks.slot('icon', undefined, className)} />;
}

/** What the step did. */
export function TraceTitle({ className, ...props }: TraceTitleProps) {
  return <span {...props} {...hooks.slot('title', undefined, className)} />;
}

/** A detail after the title, such as its duration or target. */
export function TraceDescription({ className, ...props }: TraceDescriptionProps) {
  return <span {...props} {...hooks.slot('description', undefined, className)} />;
}

/** A step whose details show and hide, such as the agent's reasoning or a command's output. */
export function TraceCollapsible({ className, ...props }: TraceCollapsibleProps) {
  return (
    <Collapsible
      {...props}
      className={mergeClassNames(hooks.slotClass('collapsible'), className)}
    />
  );
}

/** The button that shows and hides a step's details: its line, then a chevron that turns open. */
export function TraceCollapsibleTrigger({
  className,
  children,
  ...props
}: TraceCollapsibleTriggerProps) {
  const isExpanded = useContext(DisclosureStateContext)?.isExpanded ?? false;
  const indicator = useExpandGlyph(isExpanded);
  return (
    <CollapsibleTrigger
      {...props}
      className={mergeClassNames(hooks.slotClass('collapsible-trigger'), className)}
    >
      {children}
      <Glyph icon={indicator} className={hooks.slotClass('collapsible-indicator')} />
    </CollapsibleTrigger>
  );
}

/** A step's details, which stay mounted while hidden. */
export function TraceCollapsibleContent({ className, ...props }: TraceCollapsibleContentProps) {
  return (
    <CollapsibleContent
      {...props}
      className={mergeClassNames(hooks.slotClass('collapsible-content'), className)}
    />
  );
}
