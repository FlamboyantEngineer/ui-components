import {
  ToggleButton,
  ToggleButtonGroup,
  type Key,
  type ToggleButtonGroupProps as AriaToggleButtonGroupProps,
} from 'react-aria-components';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';

export type SegmentedChoiceSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `equal` divides the available width evenly; `content` sizes each segment to its label. */
export type SegmentedChoiceSizing = 'equal' | 'content';

export interface SegmentedChoiceOption {
  value: string;
  /** The segment's text and accessible name. */
  label: string;
  /** A decorative icon before the label. */
  icon?: IconSource;
  isDisabled?: boolean | undefined;
}

export interface SegmentedChoiceProps
  extends
    Omit<
      AriaToggleButtonGroupProps,
      | 'className'
      | 'style'
      | 'render'
      | 'children'
      | 'selectionMode'
      | 'disallowEmptySelection'
      | 'selectedKeys'
      | 'defaultSelectedKeys'
      | 'onSelectionChange'
    >,
    Pick<NativeProps<'div'>, 'ref'>,
    BaseProps {
  options: readonly SegmentedChoiceOption[];
  /** The value in effect (controlled). `null` selects nothing. */
  value?: string | null | undefined;
  /** The initial value when uncontrolled. */
  defaultValue?: string | null | undefined;
  /** Receives the picked value, or `null` when the choice is cleared. */
  onChange?: ((value: string | null) => void) | undefined;
  /** The value in effect comes from elsewhere; picking its segment again commits it as explicit. */
  isInherited?: boolean | undefined;
  /** Picking the selected segment of an explicit value again clears the choice to `null`. */
  isClearable?: boolean | undefined;
  /** Segments stay focusable but picking does nothing. */
  isReadOnly?: boolean | undefined;
  /** Marks the group invalid. */
  isInvalid?: boolean | undefined;
  /** Segment block size. Defaults to `md`. */
  size?: SegmentedChoiceSize | undefined;
  /** How segments share the width. Defaults to `equal`. */
  sizing?: SegmentedChoiceSizing | undefined;
}

type SelectionOptions = Pick<
  SegmentedChoiceProps,
  'value' | 'defaultValue' | 'onChange' | 'isInherited' | 'isClearable' | 'isReadOnly'
>;

const hooks = createHooks('segmented-choice', ['segment', 'icon', 'label']);

/** The group's selected keys and selection handler, with the rules for picking the selected segment again. */
function useChoiceSelection({
  value,
  defaultValue = null,
  onChange,
  isInherited,
  isClearable,
  isReadOnly,
}: SelectionOptions) {
  const [current, commit] = useControllableState(value, defaultValue, onChange);

  // React Aria reports an empty selection when the selected segment is picked again.
  const onSelectionChange = (keys: Set<Key>) => {
    const [picked] = keys;
    if (isReadOnly) return;
    if (picked !== undefined) commit(String(picked));
    else if (current !== null && isInherited) commit(current);
    else if (current !== null && isClearable) commit(null);
  };

  return { selectedKeys: current === null ? [] : [current], onSelectionChange };
}

/** `aria-readonly` and `aria-invalid` on the group, which React Aria does not set itself. */
function renderGroupState(
  isReadOnly: boolean,
  isInvalid: boolean,
): Pick<AriaToggleButtonGroupProps, 'render'> {
  if (!isReadOnly && !isInvalid) return {};
  return {
    render: (props) => (
      <div
        {...props}
        aria-readonly={isReadOnly || undefined}
        aria-invalid={isInvalid || undefined}
      />
    ),
  };
}

function Segment({ option, size }: { option: SegmentedChoiceOption; size: SegmentedChoiceSize }) {
  return (
    <ToggleButton
      id={option.value}
      isDisabled={option.isDisabled}
      {...hooks.slot('segment', { value: option.value })}
    >
      {option.icon ? (
        <Icon {...toIconProps(option.icon)} size={size} className={hooks.slotClass('icon')} />
      ) : null}
      <span {...hooks.slot('label', { label: option.label })}>{option.label}</span>
    </ToggleButton>
  );
}

/** One of a few mutually exclusive values, drawn as a run of segments. */
export function SegmentedChoice({
  options,
  value,
  defaultValue,
  onChange,
  isInherited = false,
  isClearable = false,
  isReadOnly = false,
  isInvalid = false,
  size = 'md',
  sizing = 'equal',
  className,
  ...rest
}: SegmentedChoiceProps) {
  const selection = useChoiceSelection({
    value,
    defaultValue,
    onChange,
    isInherited,
    isClearable,
    isReadOnly,
  });

  return (
    <ToggleButtonGroup
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: { size, sizing, inherited: isInherited, readonly: isReadOnly, invalid: isInvalid },
      })}
      {...selection}
      selectionMode="single"
      {...renderGroupState(isReadOnly, isInvalid)}
    >
      {options.map((option) => (
        <Segment key={option.value} option={option} size={size} />
      ))}
    </ToggleButtonGroup>
  );
}
