import { Switch } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Checkbox, cycleCheckState } from '../checkbox/checkbox.js';
import {
  Field,
  toAriaControlProps,
  useFieldControl,
  type FieldControlProps,
  type FieldInputProps,
} from '../field/field.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';

/** How a boolean is drawn: a tick box, a switch, or a pair of named segments. */
export type BooleanFieldVariant = 'checkbox' | 'switch' | 'segmented';

export interface BooleanFieldProps extends FieldInputProps<boolean | null> {
  /** How the value is drawn. Defaults to `checkbox`. */
  variant?: BooleanFieldVariant | undefined;
  /** Names the true value: a segment, and the switch caption. Defaults to the provider's `valueTrue`. */
  trueLabel?: string | undefined;
  /** Names the false value. Defaults to the provider's `valueFalse`. */
  falseLabel?: string | undefined;
  /** The switch caption while the value is unset. Defaults to the provider's `valueUnset`. */
  unsetLabel?: string | undefined;
  /**
   * Pressing can return the value to unset (`null`): the checkbox and switch cycle unset, true and
   * false, and pressing the selected segment again clears it.
   */
  allowsUnset?: boolean | undefined;
  /** The form name; a form submits `true` or `false`, and nothing while the value is unset. */
  name?: string | undefined;
}

interface BooleanControlProps {
  control: FieldControlProps;
  variant: BooleanFieldVariant;
  value: boolean | null;
  labels: { true: string; false: string; unset: string; hasCustom: boolean };
  allowsUnset: boolean;
  name: string | undefined;
  onPick: (value: boolean | null) => void;
}

const hooks = createHooks('boolean-field', ['switch', 'track', 'thumb', 'caption', 'form-value']);

function serialize(value: boolean | null): string {
  return value === null ? 'unset' : String(value);
}

/** A switch shows its state by position, so only the caller's labels or the unset state caption it. */
function captionOf(value: boolean | null, labels: BooleanControlProps['labels']): string | null {
  if (value === null) return labels.unset;
  if (!labels.hasCustom) return null;
  return value ? labels.true : labels.false;
}

function SegmentedControl({
  control,
  value,
  labels,
  allowsUnset,
  name,
  onPick,
}: BooleanControlProps) {
  const aria = toAriaControlProps(control);
  return (
    <>
      <SegmentedChoice
        id={aria.id}
        aria-label={aria['aria-label']}
        aria-labelledby={aria['aria-labelledby']}
        aria-describedby={aria['aria-describedby']}
        isInvalid={aria.isInvalid}
        isReadOnly={aria.isReadOnly}
        isDisabled={aria.isDisabled}
        isClearable={allowsUnset}
        options={[
          { value: 'false', label: labels.false },
          { value: 'true', label: labels.true },
        ]}
        value={value === null ? null : String(value)}
        onChange={(next) => onPick(next === null ? null : next === 'true')}
      />
      {name ? (
        <input
          {...hooks.slot('form-value')}
          type="hidden"
          name={name}
          value={String(value)}
          disabled={value === null || aria.isDisabled}
        />
      ) : null}
    </>
  );
}

function BooleanControl(props: BooleanControlProps) {
  const { control, variant, value, labels, allowsUnset, name, onPick } = props;
  if (variant === 'segmented') return <SegmentedControl {...props} />;
  const toggle = () => onPick(allowsUnset ? cycleCheckState(value) : value !== true);
  const shared = {
    ...toAriaControlProps(control),
    inputRef: control.ref,
    isSelected: value === true,
    onChange: toggle,
    name,
    value: 'true',
  };
  if (variant === 'checkbox') return <Checkbox {...shared} isIndeterminate={value === null} />;
  const caption = captionOf(value, labels);
  return (
    <Switch {...shared} {...hooks.slot('switch')}>
      <span {...hooks.slot('track')} aria-hidden="true">
        <span {...hooks.slot('thumb')} />
      </span>
      {caption ? <span {...hooks.slot('caption')}>{caption}</span> : null}
    </Switch>
  );
}

/**
 * A field for a true-or-false value, drawn as a checkbox, a switch or two named segments. It may
 * also hold no value (`null`): required, it is then invalid; with `allowsUnset`, pressing returns to it.
 */
export function BooleanField({
  variant = 'checkbox',
  trueLabel,
  falseLabel,
  unsetLabel,
  allowsUnset = false,
  name,
  ...props
}: BooleanFieldProps) {
  const strings = useUiStrings();
  const { state, field } = useFieldControl(props, {
    initialValue: null,
    emptyValue: allowsUnset ? null : undefined,
  });
  const labels = {
    true: trueLabel ?? strings.valueTrue,
    false: falseLabel ?? strings.valueFalse,
    unset: unsetLabel ?? strings.valueUnset,
    hasCustom: trueLabel !== undefined || falseLabel !== undefined,
  };
  const onPick = (next: boolean | null) => {
    state.setValue(next);
    state.commit();
  };
  const data = { variant, value: serialize(state.value) };
  return (
    <Field {...field} {...hooks.root({ className: field.className, data })} state={state}>
      {(control) => (
        <BooleanControl
          control={control}
          variant={variant}
          value={state.value}
          labels={labels}
          allowsUnset={allowsUnset}
          name={name}
          onPick={onPick}
        />
      )}
    </Field>
  );
}
