import { useState } from 'react';
import { Button as AriaButton, Input, TextField, type Color } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { ColorSwatch } from '../color-swatch/color-swatch.js';
import { toAriaControlProps, type FieldControlProps, type FieldState } from '../field/field.js';
import { colorFieldHooks as hooks } from './color-field-panel.js';
import { formatColor, toColor, toStoredValue, type ColorFieldFormat } from './color-values.js';

export interface ColorEntryProps {
  control: FieldControlProps;
  state: FieldState<string | null>;
  label: string;
  color: Color | null;
  format: ColorFieldFormat;
  valueFormat: ColorFieldFormat;
  placeholder: string;
}

/**
 * The typeable closed control: a swatch button that opens the picker, then a text input showing the
 * colour in its format. Typed text commits on Enter or when focus leaves: a colour in any CSS form
 * sets the value, empty text clears an optional one, and anything else is put back.
 */
export function ColorEntry({
  control,
  state,
  label,
  color,
  format,
  valueFormat,
  placeholder,
}: ColorEntryProps) {
  const strings = useUiStrings();
  const [draft, setDraft] = useState<string | null>(null);
  const finish = () => {
    if (draft === null) return;
    setDraft(null);
    const typed = toColor(draft);
    if (typed) {
      state.setValue(toStoredValue(typed, valueFormat));
      state.commit();
    } else if (!draft.trim() && state.canClear) {
      state.clear();
    }
  };
  return (
    <div {...hooks.slot('group')}>
      <AriaButton
        {...hooks.slot('trigger')}
        aria-label={strings.colorPicker(label)}
        isDisabled={control.disabled || control.readOnly}
      >
        <ColorSwatch color={color} size="sm" className={hooks.slotClass('swatch')} />
      </AriaButton>
      <TextField
        {...toAriaControlProps(control)}
        className={hooks.slotClass('entry')}
        value={draft ?? (color ? formatColor(color, format) : '')}
        onChange={setDraft}
        onBlur={finish}
        onKeyDown={(event) => {
          if (event.key === 'Enter') finish();
          else if (event.key === 'Escape' && draft !== null) setDraft(null);
          else event.continuePropagation();
        }}
      >
        <Input {...hooks.slot('input')} ref={control.ref} placeholder={placeholder} />
      </TextField>
    </div>
  );
}
