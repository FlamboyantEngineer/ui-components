'use client';

import { ToggleButtonGroup } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Orientation, RefProps, ControlSize } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useNativeReset } from '../../utils/use-native-reset.js';
import type { IconSource } from '../icon/icon.js';
import type { BadgeCountVariant } from '../badge/badge.js';
import { Segment } from './segment.js';
import { segmentedChoiceHooks as hooks } from './segmented-choice-hooks.js';
import {
  useChoiceSelection,
  type SegmentedChoiceSelectionMode,
  type SegmentedChoiceValue,
} from './choice-selection.js';
import type { PendingChangeHandler } from './pending-change.js';
import { FieldFormValue, useScopedDisabled } from '../field/field.js';

export type { SegmentedChoiceSelectionMode, SegmentedChoiceValue } from './choice-selection.js';

/** `equal` divides the available width evenly; `content` sizes each segment to its label. */
export type SegmentedChoiceSizing = 'equal' | 'content';

export interface SegmentedChoiceOption {
  value: string;
  /** The segment's text and accessible name. */
  label: string;
  /** A decorative icon before the label, or the whole segment with `iconOnly`. */
  icon?: IconSource;
  /** A count after the label, also read in the segment's name. Zero is optional; negative and non-finite values show nothing. */
  count?: number | null | undefined;
  /** This option's cap, overriding `countMax`. */
  countMax?: number | undefined;
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
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
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
  size?: ControlSize | undefined;
  /** How segments share the width. Defaults to `equal`. */
  sizing?: SegmentedChoiceSizing | undefined;
  /** Each segment shows only its icon, named by its label, which its tooltip shows. */
  iconOnly?: boolean | undefined;
  /** Option counts above this show as `<max>+`. Defaults to 99. */
  countMax?: number | undefined;
  /** Show zero counts. Defaults to `false`. */
  showZero?: boolean | undefined;
  /** Count appearance. Defaults to `subtle`. */
  countVariant?: BadgeCountVariant | undefined;
  /** Submits the value with a form under this name, one hidden input per selected value. */
  name?: string | undefined;
  /** Replaces the root `<div>` with the caller's own, given its props and the group's state. */
  render?: ElementRender<'div', SegmentedChoiceRenderState> | undefined;
}

interface GroupState {
  /** The group is a `radiogroup`, the one group role that allows `aria-readonly`. */
  isSingle: boolean;
  isReadOnly: boolean;
  isInvalid: boolean;
  isPending: boolean;
}

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
  showZero = false,
  countVariant,
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
  const isDisabled = useScopedDisabled(rest.isDisabled);

  return (
    <ToggleButtonGroup
      {...rest}
      isDisabled={isDisabled}
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
          {...{ size, iconOnly, countMax, showZero, countVariant }}
        />
      ))}
      <FieldFormValue name={name} value={selection.selectedKeys} isDisabled={isDisabled} />
    </ToggleButtonGroup>
  );
}
