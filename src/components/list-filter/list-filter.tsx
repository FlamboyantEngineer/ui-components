'use client';

import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ControlSize, RefProps } from '../../core/props.js';
import { ActionRow, type ActionRowAction } from '../action-row/action-row.js';
import type { IconSource } from '../icon/icon.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { useFilterChange } from './use-filter-change.js';

export interface ListFilterOption<V extends string = string> {
  /** The typed filter value. */
  value: V;
  /** The visible text and accessible name. */
  label: string;
  /** A decorative icon before the label, which stands for the option when the row is narrow. */
  icon?: IconSource;
  /** Optional count, including zero when `showZero` is set. */
  count?: number | null | undefined;
  /** This option's count cap, overriding the row's `countMax`. */
  countMax?: number | undefined;
  /** Refuses this option. */
  isDisabled?: boolean | undefined;
}

export interface ListFilterProps<V extends string = string>
  extends BaseProps, RefProps<HTMLDivElement>, AriaLabellingProps {
  /** The mutually exclusive filters, in display order. */
  options: readonly ListFilterOption<V>[];
  /** The controlled filter value. */
  value: V;
  /** Applies a filter. A promise previews it pending; rejection restores the latest controlled value. Observe the signal before committing asynchronous host state. */
  onChange?: ((value: V, signal: AbortSignal) => void | Promise<unknown>) | undefined;
  /** Reports a current change's failure; the host supplies the feedback text. */
  onError?: ((error: unknown) => void) | undefined;
  /** Native library icon actions and menus after the filters, with independent focus and pending state. */
  actions?: readonly ActionRowAction[] | undefined;
  /** Control size. Defaults to `sm`. */
  size?: ControlSize | undefined;
  /** Show zero counts. Defaults to `true`. */
  showZero?: boolean | undefined;
  /** Default count cap. Defaults to 99. */
  countMax?: number | undefined;
  /** Refuses all filters; actions keep their own disabled state. */
  isDisabled?: boolean | undefined;
  /**
   * The filters show only their icons, named by their labels: `auto`, the default, while the labels
   * do not fit the row and every option has an icon; `true` always; `false` never.
   */
  iconOnly?: boolean | 'auto' | undefined;
}

const hooks = createHooks('list-filter', ['row', 'filters']);
const noActions: readonly ActionRowAction[] = Object.freeze([]);

/** A single row of counted list filters and trailing actions, with a sliding selection indicator. */
export function ListFilter<V extends string = string>({
  options,
  value,
  onChange,
  onError,
  actions = noActions,
  size = 'sm',
  showZero = true,
  countMax = 99,
  isDisabled,
  iconOnly = 'auto',
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-details': ariaDetails,
  ...rest
}: ListFilterProps<V>) {
  const change = useFilterChange({ value, options, onChange, onError });
  return (
    <div {...rest} {...hooks.root({ className, props: rest, data: { size } })}>
      <ActionRow
        className={hooks.slotClass('row')}
        actions={actions}
        overflow="menu"
        size={size}
        lead={
          <SegmentedChoice
            className={hooks.slotClass('filters')}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            aria-details={ariaDetails}
            options={options}
            value={value}
            onChange={change}
            sizing="content"
            size={size}
            showZero={showZero}
            countMax={countMax}
            countVariant="subtle"
            isDisabled={isDisabled}
            iconOnly={iconOnly}
          />
        }
      />
    </div>
  );
}
