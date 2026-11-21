'use client';

import type { MouseEvent } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps, RefProps } from '../../core/props.js';
import { Group } from '../../primitives/index.js';
import { isElement } from '../../utils/is-element.js';
import { Button, type ButtonProps } from '../button/button.js';
import { Input, type InputProps } from '../input/input.js';
import { Textarea, type TextareaProps } from '../textarea/textarea.js';

export interface InputGroupProps
  extends BaseProps, RefProps<HTMLDivElement>, Omit<ContainerProps<'div'>, 'ref' | 'role'> {
  /** Accessible grouping role. Defaults to `group`. */
  role?: 'group' | 'region' | 'presentation' | undefined;
}

export type InputGroupAddonAlign = 'inline-start' | 'inline-end' | 'block-start' | 'block-end';

export interface InputGroupAddonProps extends InputGroupProps {
  /** Placement along the group’s edge. Defaults to inline-start. */
  align?: InputGroupAddonAlign | undefined;
}

export type InputGroupButtonSize = 'xs' | 'sm' | 'icon-xs' | 'icon-sm';

export interface InputGroupButtonProps extends Omit<ButtonProps, 'size'> {
  /** Compact size, including two square variants. Defaults to xs. */
  size?: InputGroupButtonSize | undefined;
}

export interface InputGroupTextProps
  extends BaseProps, RefProps<HTMLSpanElement>, Omit<ContainerProps<'span'>, 'ref'> {}

const hooks = createHooks('input-group', ['addon', 'control', 'button', 'text'], {
  root: 'input-group',
  addon: 'input-group-addon',
  control: 'input-group-control',
  button: 'input-group-button',
  text: 'input-group-text',
});

const interactiveAddonChild =
  'a[href], button, input, textarea, select, label, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [tabindex]';

/** An editable control and its adjoining text or actions. Name the control itself. */
export function InputGroup({ className, ...props }: InputGroupProps) {
  return <Group {...props} {...hooks.root({ className, props })} />;
}

/** Keep the addon's controls independent and focus only a control in this group. */
function focusGroupControl(event: MouseEvent<HTMLDivElement>) {
  if (event.defaultPrevented || event.button !== 0) return;
  const target = event.target;
  const group = event.currentTarget.closest(`.${hooks.className}`);
  if (!isElement(target) || !group || !event.currentTarget.contains(target)) return;
  const interactive = target.closest(interactiveAddonChild);
  if (interactive && event.currentTarget.contains(interactive)) return;
  const control = group.querySelector<HTMLElement>(
    `:scope > .${hooks.slotClass('control')}:not(:disabled):not([type="hidden"])`,
  );
  control?.focus();
}

/** Places content along one edge. Clicking its plain content moves focus to the group control. */
export function InputGroupAddon({
  align = 'inline-start',
  className,
  onClick,
  ...props
}: InputGroupAddonProps) {
  return (
    <div
      {...props}
      {...hooks.slot('addon', { align }, className)}
      onClick={(event) => {
        onClick?.(event);
        focusGroupControl(event);
      }}
    />
  );
}

/** A compact button with the library's normal Button behavior. */
export function InputGroupButton({
  className,
  type = 'button',
  variant = 'ghost',
  size = 'xs',
  ...props
}: InputGroupButtonProps) {
  const buttonSize = size === 'sm' || size === 'icon-sm' ? 'sm' : 'xs';
  return (
    <Button
      {...props}
      {...hooks.slot('button', { groupSize: size }, className)}
      type={type}
      variant={variant}
      size={buttonSize}
    />
  );
}

/** Static text, such as a prefix or suffix. */
export function InputGroupText({ className, ...props }: InputGroupTextProps) {
  return <span {...props} {...hooks.slot('text', undefined, className)} />;
}

/** The group's single-line control. */
export function InputGroupInput({ className, ...props }: InputProps) {
  return <Input {...props} {...hooks.slot('control', undefined, className)} />;
}

/** The group's multiline control. */
export function InputGroupTextarea({ className, ...props }: TextareaProps) {
  return <Textarea {...props} {...hooks.slot('control', undefined, className)} />;
}
