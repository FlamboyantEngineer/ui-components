'use client';

import { useId, useState } from 'react';
import { Button as AriaButton, ColorPicker, DialogTrigger } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { ColorSwatch } from '../color-swatch/color-swatch.js';
import {
  Field,
  FieldFormValue,
  toAriaControlProps,
  useFieldControl,
  type FieldControlProps,
  type FieldInputProps,
  type FieldIssue,
  type FieldTextInputProps,
  type FieldState,
} from '../field/field.js';
import { ColorEntry } from './color-field-entry.js';
import { ColorFieldPanel } from './color-field-panel.js';
import { colorFieldHooks as hooks } from './color-field-hooks.js';
import {
  formatColor,
  hasAlpha,
  toColorText,
  toStoredValue,
  type ColorFieldFormat,
} from './color-values.js';

/** The text-entry props the typed input takes (`placeholder` is also the trigger's empty text). */
export type ColorFieldTextInputProps = Pick<
  FieldTextInputProps,
  'placeholder' | 'autoComplete' | 'inputMode' | 'spellCheck' | 'enterKeyHint'
>;

export interface ColorFieldProps extends FieldInputProps<string | null>, ColorFieldTextInputProps {
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
}

interface ColorTriggerProps {
  control: FieldControlProps;
  state: FieldState<string | null>;
  /** The value as a CSS colour, or `null` without one. */
  color: string | null;
  text: string;
}

/** A value that is no colour, such as one loaded from elsewhere, is invalid rather than empty. */
function createColorCheck(message: string) {
  return (value: string | null): FieldIssue | null =>
    value !== null && value.trim() !== '' && toColorText(value) === null
      ? { severity: 'error', message }
      : null;
}

// The picker needs a colour to show while the value is empty.
const emptyPickerColor = '#808080';

/**
 * The trigger is named by the field label and the colour text, and stays focusable while read-only.
 * Backspace or Delete clears an optional value; every other key goes on to the field, for its undo
 * chords.
 */
function ColorTrigger({ control, state, color, text }: ColorTriggerProps) {
  const valueId = useId();
  const aria = toAriaControlProps(control);
  return (
    <AriaButton
      {...hooks.slot('trigger')}
      id={aria.id}
      ref={control.ref}
      aria-label={aria['aria-label']}
      // A button takes no state props but the disabled one; it is named by the label, then its text.
      aria-labelledby={`${aria['aria-labelledby'] ?? aria.id} ${valueId}`}
      aria-describedby={aria['aria-describedby']}
      isDisabled={aria.isDisabled}
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
 * colour commits when the picker closes. With `name`, a hidden input submits the stored value.
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
  autoComplete,
  inputMode,
  spellCheck,
  enterKeyHint,
  ...props
}: ColorFieldProps) {
  const strings = useUiStrings();
  const check = createColorCheck(strings.colorUnreadable);
  const { state, field } = useFieldControl(props, { initialValue: null, emptyValue: null, check });
  const [shownFormat, setFormat] = useControllableState(format, defaultFormat, onFormatChange);
  const storedFormat = valueFormat ?? (hasAlpha(shownFormat) ? 'hexa' : 'hex');
  const color = toColorText(state.value);
  const shownPlaceholder = placeholder ?? strings.noColor;
  const [isOpen, setOpen] = useState(false);
  const isEditable = !state.isReadOnly && !state.isDisabled;
  if (isOpen && !isEditable) setOpen(false);
  const changeOpen = (next: boolean) => {
    if (next && !isEditable) return;
    setOpen(next);
    if (!next) state.commit();
  };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className })}
      state={state}
      commitOnBlur={allowsTyping}
    >
      {(control) => (
        <ColorPicker
          value={color ?? emptyPickerColor}
          onChange={(next) => state.setValue(toStoredValue(next, storedFormat))}
        >
          <DialogTrigger isOpen={isOpen} onOpenChange={changeOpen}>
            {allowsTyping ? (
              <ColorEntry
                control={control}
                state={state}
                label={field.label}
                color={color}
                format={shownFormat}
                valueFormat={storedFormat}
                placeholder={shownPlaceholder}
                textInput={{ autoComplete, inputMode, spellCheck, enterKeyHint }}
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
          <FieldFormValue name={props.name} value={state.value} isDisabled={state.isDisabled} />
        </ColorPicker>
      )}
    </Field>
  );
}

export type { ColorFieldFormat } from './color-values.js';
