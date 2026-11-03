'use client';

import { AdjustmentsGlyph } from '../../core/glyphs.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import {
  createDisplayOptionsValue,
  type DisplayOptionsDensity,
  type DisplayOptionsProperty,
  type DisplayOptionsValue,
} from './display-options-model.js';
import {
  DensitySection,
  displayOptionsHooks as hooks,
  GroupBySection,
  PropertiesSection,
  SortSection,
} from './display-options-sections.js';

export type {
  DisplayOptionsDensity,
  DisplayOptionsProperty,
  DisplayOptionsValue,
} from './display-options-model.js';

export interface DisplayOptionsProps extends RefProps<HTMLSpanElement>, BaseProps {
  /** The properties the collection has, in their declared order. */
  properties: readonly DisplayOptionsProperty[];
  /** How the collection shows its rows, controlled. */
  value?: DisplayOptionsValue | undefined;
  /** How it shows them at first, uncontrolled. Defaults to every property, ungrouped, unsorted. */
  defaultValue?: DisplayOptionsValue | undefined;
  /** Called with the new value after each change. */
  onChange?: ((value: DisplayOptionsValue) => void) | undefined;
  /** The row spacings offered, in order; without them the popover offers no density. */
  densities?: readonly DisplayOptionsDensity[] | undefined;
  /** The button's text. Defaults to the provider's `display` string. */
  label?: string | undefined;
  /** Disables the button. */
  isDisabled?: boolean | undefined;
}

/**
 * A button that opens a popover of how a collection shows its rows: the property they are grouped
 * by, the property and direction they are sorted by, the properties shown and their order, and the
 * row spacing. The value is plain data the caller applies to a table, a board or a timeline.
 */
export function DisplayOptions({
  ref,
  properties,
  value: valueProp,
  defaultValue,
  onChange: onChangeProp,
  densities,
  label,
  isDisabled = false,
  className,
  id,
  ...rest
}: DisplayOptionsProps) {
  const strings = useUiStrings();
  const [value, onChange] = useControllableState(
    valueProp,
    defaultValue ?? createDisplayOptionsValue(properties),
    onChangeProp,
  );
  const section = { properties, value, onChange };
  return (
    <span
      ref={ref}
      id={id}
      {...hooks.root({ className, props: rest, data: { disabled: isDisabled } })}
    >
      <PopoverTrigger>
        <Button
          className={hooks.slotClass('trigger')}
          startIcon={AdjustmentsGlyph}
          isDisabled={isDisabled}
        >
          {label ?? strings.display}
        </Button>
        <Popover
          className={hooks.slotClass('popover')}
          title={strings.displayOptions}
          placement="bottom end"
        >
          <GroupBySection {...section} />
          <SortSection {...section} />
          <PropertiesSection {...section} />
          {densities && densities.length > 0 ? (
            <DensitySection densities={densities} value={value} onChange={onChange} />
          ) : null}
        </Popover>
      </PopoverTrigger>
    </span>
  );
}
