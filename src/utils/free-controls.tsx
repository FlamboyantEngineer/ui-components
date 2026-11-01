'use client';

// Host content inside a React Aria component that slots its own buttons or checkboxes.

import type { ReactNode } from 'react';
import {
  ButtonContext,
  CheckboxContext,
  CheckboxFieldContext,
  Provider,
} from '../primitives/index.js';

/**
 * Frees the buttons and checkboxes in `children` from the slots of the component around them (a
 * number field's steppers, a tag's remove button, a header row's select-all checkbox), so a host
 * control there needs no `slot` and takes none of those props.
 */
export function FreeControls({ children }: { children: ReactNode }) {
  return (
    <Provider
      values={[
        [ButtonContext, null],
        [CheckboxContext, null],
        [CheckboxFieldContext, null],
      ]}
    >
      {children}
    </Provider>
  );
}
