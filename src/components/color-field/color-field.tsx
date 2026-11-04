'use client';

import { useId, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { Button as AriaButton, ColorPicker, DialogTrigger } from '../../primitives/index.js';
import { ColorSwatch } from '../color-swatch/color-swatch.js';
import {
  Field,
  type FieldControlProps,
  FieldFormValue,
  type FieldInputProps,
  type FieldIssue,
  type FieldState,
  type FieldTextInputProps,
  toAriaControlProps,
  useFieldControl,
} from '../field/field.js';
import { ColorEntry } from './color-field-entry.js';
import { colorFieldHooks as hooks } from './color-field-hooks.js';
import { ColorFieldPanel } from './color-field-panel.js';
import {
  type ColorFieldFormat,
  formatColor,
  isTranslucent,
  keepAlpha,
  toColorText,
  toStoredValue,
} from './color-values.js';

/** The text-entry props the typed input takes (`placeholder` is also the trigger's empty text). */
export type ColorFieldTextInputProps = Pick<
  FieldTextInputProps,
  'placeholder' | 'autoComplete' | 'inputMode' | 'spellCheck' | 'enterKeyHint'
>;

export interface ColorFieldProps extends FieldInputProps<string | null>, ColorFieldTextInputProps {
  /** How the colour is written beside the swatch and edited in the picker (controlled). */
  format?: ColorFieldFormat | undefined;
  /** The initial format when uncontrolled. Defaults to `hex`. */
  defaultFormat?: ColorFieldFormat | undefined;
  /** Called with the format chosen in the picker. */
  onFormatChange?: ((format: ColorFieldFormat) => void) | undefined;
  /** The formats the picker offers to switch between; two or more draw a format choice. */
  formats?: readonly ColorFieldFormat[] | undefined;
  /**
   * How the value is stored. Defaults to lowercase hex: `#rrggbb`, or `#rrggbbaa` with alpha (while
   * transparency is allowed or the colour is translucent).
   */
  valueFormat?: ColorFieldFormat | undefined;
  /**
   * Offers opacity for every colour: the picker always has its alpha slider and input, and the
   * colour is written and stored with its alpha (`#rrggbbaa`, `rgba()`). Without it the picker
   * offers opacity only for a translucent colour, from the moment it shows one until it closes on
   * an opaque one, and an opaque colour stays opaque.
   */
  allowsTransparency?: boolean | undefined;
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
  const { ref, ...rest } = control;
  const aria = toAriaControlProps(rest);
  return (
    <AriaButton
      {...hooks.slot('trigger')}
      id={aria.id}
      ref={ref}
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
 * Whether the picker is open: it opens only while the field is editable, closes when the field is
 * locked, and commits the picked colour as it closes.
 */
/**
 * Whether the picker offers opacity: always with `allowsTransparency`, and otherwise while the
 * colour is translucent, kept until the picker closes on an opaque colour, so raising the alpha to
 * one does not take the slider away mid-drag.
 */
function useShowsAlpha(allowsTransparency: boolean, color: string | null, isOpen: boolean) {
  const translucent = isTranslucent(color);
  const [isKept, setKept] = useState(translucent);
  if (translucent && !isKept) setKept(true);
  if (!translucent && !isOpen && isKept) setKept(false);
  return allowsTransparency || translucent || isKept;
}

function usePickerOpen(state: FieldState<string | null>) {
  const [isOpen, setOpen] = useState(false);
  const isEditable = !state.isReadOnly && !state.isDisabled;
  if (isOpen && !isEditable) setOpen(false);
  const changeOpen = (next: boolean) => {
    if (next && !isEditable) return;
    setOpen(next);
    if (!next) state.commit();
  };
  return { isOpen, changeOpen };
}

/**
 * A field for a colour value, stored as lowercase hex (or in `valueFormat`) or `null`. Its trigger
 * shows a swatch and the colour text (or, with `allowsTyping`, a swatch button and a text input) and
 * opens a picker: a format choice, a saturation and brightness area, a hue slider (and, with
 * `allowsTransparency` or a translucent colour, an alpha slider), the format's inputs, an eye dropper, preset swatches and,
 * unless required, a Clear button. The picked colour commits when the picker closes. With `name`, a hidden input submits the stored value.
 */
export function ColorField({
  format,
  defaultFormat = 'hex',
  onFormatChange,
  formats = [],
  valueFormat = 'hex',
  swatches = [],
  allowsEyeDropper = false,
  allowsTyping = false,
  allowsTransparency = false,
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
  const color = toColorText(state.value);
  const shownPlaceholder = placeholder ?? strings.noColor;
  const picker = usePickerOpen(state);
  const showsAlpha = useShowsAlpha(allowsTransparency, color, picker.isOpen);
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
          onChange={(next) => {
            const picked = showsAlpha ? next : keepAlpha(next, color);
            state.setValue(toStoredValue(picked, valueFormat, allowsTransparency));
          }}
        >
          <DialogTrigger isOpen={picker.isOpen} onOpenChange={picker.changeOpen}>
            {allowsTyping ? (
              <ColorEntry
                control={control}
                state={state}
                label={field.label}
                color={color}
                format={shownFormat}
                valueFormat={valueFormat}
                allowsTransparency={allowsTransparency}
                placeholder={shownPlaceholder}
                textInput={{ autoComplete, inputMode, spellCheck, enterKeyHint }}
              />
            ) : (
              <ColorTrigger
                control={control}
                state={state}
                color={color}
                text={
                  color ? formatColor(color, shownFormat, allowsTransparency) : shownPlaceholder
                }
              />
            )}
            <ColorFieldPanel
              label={field.label}
              state={state}
              format={shownFormat}
              formats={formats}
              onFormatChange={setFormat}
              showsAlpha={showsAlpha}
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
