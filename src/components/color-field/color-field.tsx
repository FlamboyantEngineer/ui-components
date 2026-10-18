import { useId } from 'react';
import {
  Button as AriaButton,
  ColorPicker,
  DialogTrigger,
  type Color,
} from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { ColorSwatch } from '../color-swatch/color-swatch.js';
import {
  Field,
  useFieldControl,
  type FieldControlProps,
  type FieldInputProps,
  type FieldState,
} from '../field/field.js';
import { ColorEntry } from './color-field-entry.js';
import { ColorFieldPanel, colorFieldHooks as hooks } from './color-field-panel.js';
import {
  formatColor,
  hasAlpha,
  toColor,
  toStoredValue,
  type ColorFieldFormat,
} from './color-values.js';

export interface ColorFieldProps extends FieldInputProps<string | null> {
  /**
   * How the colour is written beside the swatch and edited in the picker (controlled). An alpha
   * format (`hexa`, `rgba`, `hsla`, `hsba`) adds an alpha slider and input.
   */
  format?: ColorFieldFormat | undefined;
  /** The initial format when uncontrolled. Defaults to `hex`. */
  defaultFormat?: ColorFieldFormat | undefined;
  /** Called with the format chosen in the picker. */
  onFormatChange?: ((format: ColorFieldFormat) => void) | undefined;
  /** The formats the picker offers to switch between; two or more draw a format choice. */
  formats?: readonly ColorFieldFormat[] | undefined;
  /**
   * How the value is stored. Defaults to lowercase hex: `#rrggbb`, or `#rrggbbaa` while the format
   * has alpha.
   */
  valueFormat?: ColorFieldFormat | undefined;
  /** Preset colours the picker offers as swatches. */
  swatches?: readonly string[] | undefined;
  /** Adds a picker button that samples a colour from the screen, where the browser can. */
  allowsEyeDropper?: boolean | undefined;
  /** Draws a text input to type a colour into beside a swatch button, instead of a text trigger. */
  allowsTyping?: boolean | undefined;
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
 * A field for a colour value, stored as lowercase hex (or in `valueFormat`) or `null`. Its trigger
 * shows a swatch and the colour text (or, with `allowsTyping`, a swatch button and a text input) and
 * opens a picker: a format choice, a saturation and brightness area, hue and alpha sliders, the
 * format's inputs, an eye dropper, preset swatches and, unless required, a Clear button. The picked
 * colour commits when the picker closes.
 */
export function ColorField({
  format,
  defaultFormat = 'hex',
  onFormatChange,
  formats = [],
  valueFormat,
  swatches = [],
  allowsEyeDropper = false,
  allowsTyping = false,
  placeholder,
  ...props
}: ColorFieldProps) {
  const strings = useUiStrings();
  const { state, field } = useFieldControl(props, { initialValue: null, emptyValue: null });
  const [shownFormat, setFormat] = useControllableState(format, defaultFormat, onFormatChange);
  const storedFormat = valueFormat ?? (hasAlpha(shownFormat) ? 'hexa' : 'hex');
  const color = toColor(state.value);
  const shownPlaceholder = placeholder ?? strings.noColor;
  return (
    <Field {...field} {...hooks.root({ className: field.className })} state={state}>
      {(control) => (
        <ColorPicker
          value={color ?? emptyPickerColor}
          onChange={(next) => state.setValue(toStoredValue(next, storedFormat))}
        >
          <DialogTrigger onOpenChange={(isOpen) => (isOpen ? undefined : state.commit())}>
            {allowsTyping ? (
              <ColorEntry
                control={control}
                state={state}
                label={field.label}
                color={color}
                format={shownFormat}
                valueFormat={storedFormat}
                placeholder={shownPlaceholder}
              />
            ) : (
              <ColorTrigger
                control={control}
                state={state}
                color={color}
                text={color ? formatColor(color, shownFormat) : shownPlaceholder}
              />
            )}
            <ColorFieldPanel
              label={field.label}
              state={state}
              format={shownFormat}
              formats={formats}
              onFormatChange={setFormat}
              swatches={swatches}
              allowsEyeDropper={allowsEyeDropper}
            />
          </DialogTrigger>
        </ColorPicker>
      )}
    </Field>
  );
}

export type { ColorFieldFormat } from './color-values.js';
