'use client';

import { createContext, type ReactNode, useContext, useId, useLayoutEffect } from 'react';
import { dialogTitleLevel, HeadingLevelContext } from '../../core/heading-level.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { Heading } from '../../primitives/index.js';
import { Button, type ButtonProps } from '../button/button.js';
import { dialogHooks as hooks } from './dialog-hooks.js';

export interface DialogPartProps<E extends HTMLElement> extends BaseProps, RefProps<E> {
  children?: ReactNode;
}

export type DialogCloseProps = Omit<ButtonProps, 'href' | 'onPress'>;

interface DialogPartState {
  close: () => void;
  isDismissDisabled: boolean;
  setDescriptionId: (id: string | undefined) => void;
}

export const DialogPartContext = createContext<DialogPartState | null>(null);

/** Groups the dialog's title, description and optional header actions. */
export function DialogHeader({ className, children, ...props }: DialogPartProps<HTMLDivElement>) {
  return (
    <div {...props} {...hooks.slot('header', undefined, className)}>
      {children}
    </div>
  );
}

/** Names the dialog. */
export function DialogTitle({
  className,
  children,
  ...props
}: DialogPartProps<HTMLHeadingElement>) {
  return (
    <Heading
      {...props}
      {...hooks.slot('title', undefined, className)}
      slot="title"
      level={dialogTitleLevel}
    >
      {children}
    </Heading>
  );
}

/** Describes the dialog to assistive technology. */
export function DialogDescription({
  className,
  id,
  children,
  ...props
}: DialogPartProps<HTMLParagraphElement>) {
  const generatedId = useId();
  const descriptionId = id ?? generatedId;
  const setDescriptionId = useContext(DialogPartContext)?.setDescriptionId;
  useLayoutEffect(() => {
    setDescriptionId?.(descriptionId);
    return () => setDescriptionId?.(undefined);
  }, [descriptionId, setDescriptionId]);
  return (
    <p {...props} {...hooks.slot('description', undefined, className)} id={descriptionId}>
      {children}
    </p>
  );
}

/** Holds scrollable content and gives its headings the level below the dialog title. */
export function DialogBody({ className, children, ...props }: DialogPartProps<HTMLDivElement>) {
  return (
    <div {...props} {...hooks.slot('body', undefined, className)}>
      <HeadingLevelContext value={dialogTitleLevel}>{children}</HeadingLevelContext>
    </div>
  );
}

/** Groups caller-provided actions and status content at the end of the dialog. */
export function DialogFooter({ className, children, ...props }: DialogPartProps<HTMLDivElement>) {
  return (
    <div {...props} {...hooks.slot('footer', undefined, className)}>
      {children}
    </div>
  );
}

/** A button that dismisses its dialog. */
export function DialogClose({ className, isDisabled, ...props }: DialogCloseProps) {
  const state = useContext(DialogPartContext);
  return (
    <Button
      {...props}
      {...hooks.slot('close', undefined, className)}
      isDisabled={isDisabled || state?.isDismissDisabled}
      onPress={state?.close}
    />
  );
}
