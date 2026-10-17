import { useId } from 'react';
import {
  Button as AriaButton,
  ColorPicker,
  DialogTrigger,
  parseColor,
  type Color,
} from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';
import { ColorSwatch } from '../color-swatch/color-swatch.js';
import {
  Field,
  useFieldControl,
  type FieldControlProps,
  type FieldInputProps,
  type FieldState,
} from '../field/field.js';
import { ColorFieldPanel, colorFieldHooks as hooks } from './color-field-panel.js';

/** How the colour is written beside the swatch. */
export type ColorFieldFormat = 'hex' | 'rgb' | 'hsl' | 'hsb';

export interface ColorFieldProps extends FieldInputProps<string | null> {
  /** How the colour is written beside the swatch. Defaults to `hex`. */
  format?: ColorFieldFormat | undefined;
  /** The text shown while no colour is set. Defaults to the provider's `noColor`. */
  placeholder?: string | undefined;
}

interface ColorTriggerProps {
  control: FieldControlProps;
  state: FieldState<string | null>;
  color: Color | null;
  text: string;
}

// The picker needs a colour to show while the value is empty.
const emptyPickerColor = '#808080';

function toColor(value: string | null): Color | null {
  if (!value) return null;
  try {
    return parseColor(value);
  } catch {
    return null;
  }
}

/** The stored form of a colour: lowercase `#rrggbb`. */
function toStoredValue(color: Color): string {
  return color.toString('hex').toLowerCase();
}

/**
 * The trigger is named by the field label and the colour text. Backspace or Delete clears an optional
 * value; every other key goes on to the field, for its undo chords.
 */
function ColorTrigger({ control, state, color, text }: ColorTriggerProps) {
  const valueId = useId();
  const name = control['aria-labelledby'] ?? control.id;
  return (
    <AriaButton
      {...hooks.slot('trigger')}
      id={control.id}
      ref={control.ref}
      aria-label={control['aria-label']}
      aria-labelledby={`${name} ${valueId}`}
      aria-describedby={control['aria-describedby']}
      isDisabled={control.disabled || control.readOnly}
      onKeyDown={(event) => {
        if ((event.key === 'Backspace' || event.key === 'Delete') && state.canClear) state.clear();
        else event.continuePropagation();
      }}
    >
      <ColorSwatch color={color} size="sm" className={hooks.slotClass('swatch')} />
      <span {...hooks.slot('value', { placeholder: color === null })} id={valueId}>
        {text}
      </span>
    </AriaButton>
  );
}

/**
 * A field for a colour value, stored as lowercase `#rrggbb` or `null`. Its trigger shows a swatch
 * and the colour text and opens a picker: a saturation and brightness area, a hue slider, a hex
 * input and, unless required, a Clear button. The picked colour commits when the picker closes.
 */
export function ColorField({ format = 'hex', placeholder, ...props }: ColorFieldProps) {
  const strings = useUiStrings();
  const { state, field } = useFieldControl(props, { initialValue: null, emptyValue: null });
  const color = toColor(state.value);
  const text = color ? color.toString(format) : (placeholder ?? strings.noColor);
  return (
    <Field {...field} {...hooks.root({ className: field.className })} state={state}>
      {(control) => (
        <ColorPicker
          value={color ?? emptyPickerColor}
          onChange={(next) => state.setValue(toStoredValue(next))}
        >
          <DialogTrigger onOpenChange={(isOpen) => (isOpen ? undefined : state.commit())}>
            <ColorTrigger control={control} state={state} color={color} text={text} />
            <ColorFieldPanel label={field.label} state={state} />
          </DialogTrigger>
        </ColorPicker>
      )}
    </Field>
  );
}
