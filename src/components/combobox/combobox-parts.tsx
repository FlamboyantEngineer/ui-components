'use client';

import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import type { OverlayPositionProps } from '../../core/events.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { ComboboxField } from './combobox-field.js';
import { ComboboxSuggestions } from './combobox-suggestions.js';

interface ComboboxParts {
  field: ComponentProps<typeof ComboboxField>;
  suggestions: ComponentProps<typeof ComboboxSuggestions>;
}

const ComboboxPartsContext = createContext<ComboboxParts | null>(null);

/** Shares the same field configuration in the built-in and caller-composed layouts. */
export function ComboboxLayout({ parts, children }: { parts: ComboboxParts; children: ReactNode }) {
  return (
    <ComboboxPartsContext value={parts}>
      {children ?? (
        <>
          <ComboboxInput />
          <ComboboxContent />
        </>
      )}
    </ComboboxPartsContext>
  );
}

function useComboboxParts() {
  const parts = useContext(ComboboxPartsContext);
  if (!parts) throw new Error('ComboboxInput and ComboboxContent must be inside a Combobox.');
  return parts;
}

export interface ComboboxInputProps extends BaseProps, RefProps<HTMLDivElement> {}

/** The search input frame, with its clear and toggle buttons and any selected chips. */
export function ComboboxInput(props: ComboboxInputProps) {
  const { field } = useComboboxParts();
  return <ComboboxField {...field} fieldProps={props} />;
}

export interface ComboboxContentProps
  extends BaseProps, OverlayPositionProps, RefProps<HTMLElement> {}

/** The anchored suggestions popup, including any list header, groups and loading state. */
export function ComboboxContent(props: ComboboxContentProps) {
  const { suggestions } = useComboboxParts();
  return <ComboboxSuggestions {...suggestions} popoverProps={props} />;
}
