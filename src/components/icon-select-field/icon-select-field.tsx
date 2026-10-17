import { createHooks } from '../../core/hooks.js';
import type { IconSource } from '../icon/icon.js';
import {
  SelectField,
  type SelectFieldOption,
  type SelectFieldProps,
} from '../select-field/select-field.js';

/** A choice of an icon select field: every option leads with its icon. */
export interface IconSelectFieldOption extends SelectFieldOption {
  icon: IconSource;
}

export interface IconSelectFieldProps extends Omit<
  SelectFieldProps<'single'>,
  'options' | 'selectionMode' | 'filterable'
> {
  options: readonly IconSelectFieldOption[];
  /** Draws a filter input in the open list. Off by default: icon lists are short. */
  filterable?: boolean | undefined;
}

const hooks = createHooks('icon-select-field');

/**
 * A single select over a short list of icon-led options, such as a choice of symbol. The chosen
 * option's icon shows in the trigger; `emptyLabel` keeps a no-icon choice in the list.
 */
export function IconSelectField({ className, filterable = false, ...props }: IconSelectFieldProps) {
  return (
    <SelectField
      {...props}
      className={hooks.root({ className }).className}
      selectionMode="single"
      filterable={filterable}
    />
  );
}
