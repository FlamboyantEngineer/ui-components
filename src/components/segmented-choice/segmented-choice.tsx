'use client';

import type { Ref } from 'react';
import { SelectionIndicator, ToggleButton, ToggleButtonGroup } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Orientation, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { formatCount, normalizeCount } from '../../utils/count.js';
import type { ElementRender } from '../../utils/render-element.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useNativeReset } from '../../utils/use-native-reset.js';
import { Icon, type IconSource } from '../icon/icon.js';
import { hasIcon, toIconProps } from '../icon/icon.js';
import { Tooltip } from '../tooltip/tooltip.js';
import {
  useChoiceSelection,
  type SegmentedChoiceSelectionMode,
  type SegmentedChoiceValue,
} from './choice-selection.js';
import type { PendingChangeHandler } from './pending-change.js';

export type { SegmentedChoiceSelectionMode, SegmentedChoiceValue } from './choice-selection.js';

export type SegmentedChoiceSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

/** `equal` divides the available width evenly; `content` sizes each segment to its label. */
export type SegmentedChoiceSizing = 'equal' | 'content';

export interface SegmentedChoiceOption {
  value: string;
  /** The segment's text and accessible name. */
  label: string;
  /** A decorative icon before the label, or the whole segment with `iconOnly`. */
  icon?: IconSource;
  /** A count after the label, also read in the segment's name. Zero, negative and non-finite values show nothing. */
  count?: number | null | undefined;
  isDisabled?: boolean | undefined;
}

/** The states a segmented choice passes to `render` with its root's props. */
export interface SegmentedChoiceRenderState {
  /** How the segments are laid out. */
  orientation: Orientation;
  /** The whole group is disabled. */
  isDisabled: boolean;
}

export interface SegmentedChoiceProps<M extends SegmentedChoiceSelectionMode = 'single'>
  extends BaseProps, AriaLabellingProps {
  /** The group element. */
  ref?: Ref<HTMLDivElement> | undefined;
  /** The segments, in order. */
  options: readonly SegmentedChoiceOption[];
  /** `single` (the default) picks one value; `multiple` presses any number of segments. */
  selectionMode?: M | undefined;
  /** The value in effect (controlled): one value or `null`, or a list with `multiple`. */
  value?: SegmentedChoiceValue<M> | undefined;
  /** The initial value when uncontrolled. */
  defaultValue?: SegmentedChoiceValue<M> | undefined;
  /**
   * Receives the new value: the picked value or `null`, or the pressed values in option order. A
   * returned promise keeps the choice pending until it settles; a rejection puts the value back.
   */
  onChange?: PendingChangeHandler<SegmentedChoiceValue<M>> | undefined;
  /** Single selection: the value comes from elsewhere; picking its segment again commits it. */
  isInherited?: boolean | undefined;
  /** Single selection: picking the selected segment of an explicit value clears it to `null`. */
  isClearable?: boolean | undefined;
  /** Segments stay focusable but picking does nothing. */
  isReadOnly?: boolean | undefined;
  /** Marks the group invalid. */
  isInvalid?: boolean | undefined;
  /** Disables every segment. */
  isDisabled?: boolean | undefined;
  /** Lays the segments out in a row or a column. Defaults to `horizontal`. */
  orientation?: Orientation | undefined;
  /** Segment block size. Defaults to `md`. */
  size?: SegmentedChoiceSize | undefined;
  /** How segments share the width. Defaults to `equal`. */
  sizing?: SegmentedChoiceSizing | undefined;
  /** Each segment shows only its icon, named by its label, which its tooltip shows. */
  iconOnly?: boolean | undefined;
  /** Option counts above this show as `<max>+`. Defaults to 99. */
  countMax?: number | undefined;
  /** Submits the value with a form under this name, one hidden input per selected value. */
  name?: string | undefined;
  /** Replaces the root `<div>` with the caller's own, given its props and the group's state. */
  render?: ElementRender<'div', SegmentedChoiceRenderState> | undefined;
}

interface SegmentProps {
  option: SegmentedChoiceOption;
  size: SegmentedChoiceSize;
  iconOnly: boolean;
  countMax: number;
}

interface GroupState {
  /** The group is a `radiogroup`, the one group role that allows `aria-readonly`. */
  isSingle: boolean;
  isReadOnly: boolean;
  isInvalid: boolean;
  isPending: boolean;
}

const hooks = createHooks('segmented-choice', ['segment', 'indicator', 'icon', 'label', 'count']);

/**
 * `aria-readonly`, `aria-invalid` and `aria-busy` on the group, which the building block does not
 * set. A multiple-selection `toolbar` or `group` allows no `aria-readonly`, so only a `radiogroup`
 * states it.
 */
function renderGroupState(
  { isSingle, isReadOnly, isInvalid, isPending }: GroupState,
  render: SegmentedChoiceProps['render'],
): Pick<SegmentedChoiceProps, 'render'> {
  const statesReadOnly = isSingle && isReadOnly;
  if (!statesReadOnly && !isInvalid && !isPending) return render ? { render } : {};
  return {
    render: (props, state) => {
      const merged = {
        ...props,
        'aria-readonly': statesReadOnly || undefined,
        'aria-invalid': isInvalid || undefined,
        'aria-busy': isPending || undefined,
      };
      return render ? render(merged, state) : <div {...merged} />;
    },
  };
}

/** The shown text of a positive count, or `null` when the option shows none. */
function formatOptionCount(count: number | null | undefined, max: number): string | null {
  const value = normalizeCount(count);
  return value === undefined || value === 0 ? null : formatCount(value, { max });
}

function Segment({ option, size, iconOnly, countMax }: SegmentProps) {
  const strings = useUiStrings();
  const showsIconOnly = iconOnly && hasIcon(option.icon);
  const count = formatOptionCount(option.count, countMax);
  const name = count === null ? option.label : strings.labelWithCount(option.label, count);
  const segment = (
    <ToggleButton
      id={option.value}
      isDisabled={option.isDisabled}
      aria-label={showsIconOnly || count !== null ? name : undefined}
      {...hooks.slot('segment', { value: option.value })}
    >
      <SelectionIndicator className={hooks.slotClass('indicator')} />
      {hasIcon(option.icon) ? (
        <Icon
          {...toIconProps(option.icon)}
          size={size === 'xs' ? 'sm' : size}
          className={hooks.slotClass('icon')}
        />
      ) : null}
      {showsIconOnly ? null : (
        <span {...hooks.slot('label', { label: option.label })}>{option.label}</span>
      )}
      {count === null ? null : (
        <span {...hooks.slot('count')} aria-hidden="true">
          {count}
        </span>
      )}
    </ToggleButton>
  );
  // Every segment sits in a tooltip, enabled only while it shows its icon alone, so a change of
  // `iconOnly` keeps the segment element and its focus. That tooltip repeats the segment's name, so
  // it adds no description.
  return (
    <Tooltip
      content={option.label}
      relationship={showsIconOnly ? 'label' : 'description'}
      isDisabled={!showsIconOnly}
    >
      {segment}
    </Tooltip>
  );
}

/** Hidden inputs that submit the selected values with a form. */
function ChoiceInputs({ name, values, isDisabled }: ChoiceInputsProps) {
  return values.map((value) => (
    <input key={value} type="hidden" name={name} value={value} disabled={isDisabled} />
  ));
}

interface ChoiceInputsProps {
  name: string;
  values: readonly string[];
  isDisabled: boolean | undefined;
}

/**
 * One of a few mutually exclusive values, drawn as a run of segments, or with
 * `selectionMode="multiple"` a group of toggles that press independently. A selection indicator
 * slides between segments as the choice moves.
 */
export function SegmentedChoice<M extends SegmentedChoiceSelectionMode = 'single'>({
  options,
  selectionMode,
  value,
  defaultValue,
  onChange,
  isInherited = false,
  isClearable = false,
  isReadOnly = false,
  isInvalid = false,
  size = 'md',
  sizing = 'equal',
  iconOnly = false,
  countMax = 99,
  name,
  render,
  className,
  ref,
  ...rest
}: SegmentedChoiceProps<M>) {
  const selection = useChoiceSelection<M>({
    options,
    selectionMode,
    value,
    defaultValue,
    onChange,
    isInherited,
    isClearable,
    isReadOnly,
  });
  const [group, setGroup] = useForwardedRef(ref);
  useNativeReset(group, selection.reset);

  return (
    <ToggleButtonGroup
      {...rest}
      ref={setGroup}
      {...hooks.root({
        className,
        props: rest,
        data: {
          size,
          sizing,
          selectionMode: selection.selectionMode,
          iconOnly,
          inherited: isInherited,
          readonly: isReadOnly,
          invalid: isInvalid,
          pending: selection.isPending,
        },
      })}
      selectedKeys={selection.selectedKeys}
      onSelectionChange={selection.onSelectionChange}
      selectionMode={selection.selectionMode}
      {...renderGroupState(
        {
          isSingle: selection.selectionMode === 'single',
          isReadOnly,
          isInvalid,
          isPending: selection.isPending,
        },
        render,
      )}
    >
      {options.map((option) => (
        <Segment
          key={option.value}
          option={option}
          size={size}
          iconOnly={iconOnly}
          countMax={countMax}
        />
      ))}
      {name ? (
        <ChoiceInputs name={name} values={selection.selectedKeys} isDisabled={rest.isDisabled} />
      ) : null}
    </ToggleButtonGroup>
  );
}
