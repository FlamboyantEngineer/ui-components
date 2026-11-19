'use client';

import { ChoiceGroup, type ChoiceGroupProps } from './choice-group.js';

export type RadioGroupProps = Omit<ChoiceGroupProps, 'selectionMode' | 'selectAllLabel'>;

/** A field with one choice among its radio items. */
export function RadioGroup(props: RadioGroupProps) {
  return <ChoiceGroup {...props} selectionMode="single" />;
}

export { Choice as RadioGroupItem, type ChoiceProps as RadioGroupItemProps } from './choice.js';
