import type { ReactElement } from 'react';
import {
  SelectionIndicator,
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps as AriaToggleButtonGroupProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { Tooltip } from '../tooltip/tooltip.js';
import {
  useChoiceSelection,
  type SegmentedChoiceSelectionMode,
  type SegmentedChoiceValue,
} from './choice-selection.js';

export type { SegmentedChoiceSelectionMode, SegmentedChoiceValue } from './choice-selection.js';

export type SegmentedChoiceSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `equal` divides the available width evenly; `content` sizes each segment to its label. */
export type SegmentedChoiceSizing = 'equal' | 'content';

export interface SegmentedChoiceOption {
  value: string;
  /** The segment's text and accessible name. */
  label: string;
  /** A decorative icon before the label, or the whole segment with `iconOnly`. */
  icon?: IconSource;
  isDisabled?: boolean | undefined;
}

export interface SegmentedChoiceProps<M extends SegmentedChoiceSelectionMode = 'single'>
  extends
    Omit<
      AriaToggleButtonGroupProps,
      | 'className'
      | 'style'
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
  /** `single` (the default) picks one value; `multiple` presses any number of segments. */
  selectionMode?: M | undefined;
  /** The value in effect (controlled): one value or `null`, or a list with `multiple`. */
  value?: SegmentedChoiceValue<M> | undefined;
  /** The initial value when uncontrolled. */
  defaultValue?: SegmentedChoiceValue<M> | undefined;
  /** Receives the new value: the picked value or `null`, or the pressed values in option order. */
  onChange?: ((value: SegmentedChoiceValue<M>) => void) | undefined;
  /** Single selection: the value comes from elsewhere; picking its segment again commits it. */
  isInherited?: boolean | undefined;
  /** Single selection: picking the selected segment of an explicit value clears it to `null`. */
  isClearable?: boolean | undefined;
  /** Segments stay focusable but picking does nothing. */
  isReadOnly?: boolean | undefined;
  /** Marks the group invalid. */
  isInvalid?: boolean | undefined;
  /** Segment block size. Defaults to `md`. */
  size?: SegmentedChoiceSize | undefined;
  /** How segments share the width. Defaults to `equal`. */
  sizing?: SegmentedChoiceSizing | undefined;
  /** Each segment shows only its icon, named by its label, which its tooltip shows. */
  iconOnly?: boolean | undefined;
  /** Submits the value with a form under this name, one hidden input per selected value. */
  name?: string | undefined;
}

interface SegmentProps {
  option: SegmentedChoiceOption;
  size: SegmentedChoiceSize;
  iconOnly: boolean;
}

const hooks = createHooks('segmented-choice', ['segment', 'indicator', 'icon', 'label']);

/** `aria-readonly` and `aria-invalid` on the group, which React Aria does not set itself. */
function renderGroupState(
  { isReadOnly, isInvalid }: { isReadOnly: boolean; isInvalid: boolean },
  render: AriaToggleButtonGroupProps['render'],
): Pick<AriaToggleButtonGroupProps, 'render'> {
  if (!isReadOnly && !isInvalid) return render ? { render } : {};
  return {
    render: (props, state) => {
      const merged = {
        ...props,
        'aria-readonly': isReadOnly || undefined,
        'aria-invalid': isInvalid || undefined,
      };
      return render ? render(merged, state) : <div {...merged} />;
    },
  };
}

// The tooltip of an icon-only segment repeats its name, so it adds no description.
function renderWithoutDescription(props: NativeProps<'button'>): ReactElement {
  return <button {...props} aria-describedby={undefined} />;
}

function Segment({ option, size, iconOnly }: SegmentProps) {
  const showsIconOnly = iconOnly && option.icon !== undefined;
  const segment = (
    <ToggleButton
      id={option.value}
      isDisabled={option.isDisabled}
      aria-label={showsIconOnly ? option.label : undefined}
      render={showsIconOnly ? renderWithoutDescription : undefined}
      {...hooks.slot('segment', { value: option.value })}
    >
      <SelectionIndicator className={hooks.slotClass('indicator')} />
      {option.icon ? (
        <Icon {...toIconProps(option.icon)} size={size} className={hooks.slotClass('icon')} />
      ) : null}
      {showsIconOnly ? null : (
        <span {...hooks.slot('label', { label: option.label })}>{option.label}</span>
      )}
    </ToggleButton>
  );
  return showsIconOnly ? <Tooltip content={option.label}>{segment}</Tooltip> : segment;
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
  name,
  render,
  className,
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

  return (
    <ToggleButtonGroup
      {...rest}
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
        },
      })}
      selectedKeys={selection.selectedKeys}
      onSelectionChange={selection.onSelectionChange}
      selectionMode={selection.selectionMode}
      {...renderGroupState({ isReadOnly, isInvalid }, render)}
    >
      {options.map((option) => (
        <Segment key={option.value} option={option} size={size} iconOnly={iconOnly} />
      ))}
      {name ? (
        <ChoiceInputs name={name} values={selection.selectedKeys} isDisabled={rest.isDisabled} />
      ) : null}
    </ToggleButtonGroup>
  );
}
