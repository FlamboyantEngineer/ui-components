'use client';

import { createContext, type ReactNode, useContext, useId, useLayoutEffect } from 'react';
import type { BaseProps, RefProps } from '../../core/props.js';
import { Heading } from '../../primitives/index.js';
import { popoverHooks as hooks } from './popover-hooks.js';

export interface PopoverHeaderProps extends BaseProps, RefProps<HTMLDivElement> {
  children?: ReactNode;
}

export interface PopoverTitleProps extends BaseProps, RefProps<HTMLHeadingElement> {
  children?: ReactNode;
}

export interface PopoverDescriptionProps extends BaseProps, RefProps<HTMLParagraphElement> {
  children?: ReactNode;
}

export const PopoverDescriptionContext = createContext<((id: string | undefined) => void) | null>(
  null,
);

/** Groups the popover's title, description and header actions. */
export function PopoverHeader({ className, ...props }: PopoverHeaderProps) {
  return <div {...props} {...hooks.slot('header', undefined, className)} />;
}

/** Names its popover and renders as a level-2 heading. */
export function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return <Heading {...props} {...hooks.slot('title', undefined, className)} slot="title" />;
}

/** Describes the popover to assistive technology. */
export function PopoverDescription({ className, id, ...props }: PopoverDescriptionProps) {
  const generatedId = useId();
  const descriptionId = id ?? generatedId;
  const setDescriptionId = useContext(PopoverDescriptionContext);
  useLayoutEffect(() => {
    setDescriptionId?.(descriptionId);
    return () => setDescriptionId?.(undefined);
  }, [descriptionId, setDescriptionId]);
  return <p {...props} {...hooks.slot('description', undefined, className)} id={descriptionId} />;
}
