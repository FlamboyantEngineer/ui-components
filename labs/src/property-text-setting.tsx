// A property row holding a field around a plain native input, which commits on blur, so a draft
// can outlive filtering.

import { useId } from 'react';
import { Field, useFieldState } from '../../src/components/field/field.js';
import {
  PropertyRow,
  type PropertyRowProps,
} from '../../src/components/property-panel/property-panel.js';

type TextSettingProps = Omit<PropertyRowProps, 'children' | 'htmlFor' | 'label'> & {
  label: string;
  value: string;
};

export function TextSetting({ label, value, ...row }: TextSettingProps) {
  const id = useId();
  const state = useFieldState<string>({ defaultValue: value });
  return (
    <PropertyRow label={label} htmlFor={`${id}-control`} {...row}>
      <Field id={id} state={state} label={label} labelLayout="control-only">
        {(control) => (
          <input
            {...control}
            value={state.value}
            onChange={(event) => state.setValue(event.target.value)}
            onBlur={() => state.commit()}
          />
        )}
      </Field>
    </PropertyRow>
  );
}
