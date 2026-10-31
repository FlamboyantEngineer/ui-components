'use client';

import { useState } from 'react';
import { Input } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import {
  Field,
  FieldFormValue,
  useFieldControl,
  type FieldControlProps,
  type FieldInputProps,
  type FieldState,
} from '../field/field.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import type { SignatureValue } from './signature-path.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { SignatureSurface, signaturePadHooks as hooks } from './signature-surface.js';

export type { DrawnSignature, SignatureValue, TypedSignature } from './signature-path.js';

/** How the signature is given: drawn with a pointer, or typed as the signer's name. */
type SignaturePadMode = 'draw' | 'type';

export interface SignaturePadProps extends FieldInputProps<SignatureValue | null> {
  /** Offers typing the name as the keyboard alternative to drawing. Defaults to true. */
  allowsTyping?: boolean | undefined;
}

interface SignatureControlsProps {
  control: FieldControlProps;
  state: FieldState<SignatureValue | null>;
  mode: SignaturePadMode;
  onModeChange: ((mode: SignaturePadMode) => void) | null;
  name: string | undefined;
}

/**
 * Whether a signature holds nothing a signer made: none, typed text that is blank, or a drawing
 * with no stroke, however the value arrived.
 */
function isSignatureEmpty(value: SignatureValue | null): boolean {
  if (!value) return true;
  return value.kind === 'typed' ? value.text.trim() === '' : value.paths.length === 0;
}

function modeOf(value: SignatureValue): SignaturePadMode {
  return value.kind === 'typed' ? 'type' : 'draw';
}

/** The name input of the typed mode: blank text is no signature. */
function SignatureInput({ control, state }: Pick<SignatureControlsProps, 'control' | 'state'>) {
  const strings = useUiStrings();
  const { value } = state;
  return (
    <Input
      {...control}
      {...hooks.slot('input')}
      autoComplete="name"
      placeholder={strings.signatureTypePlaceholder}
      value={value?.kind === 'typed' ? value.text : ''}
      onChange={(event) => {
        const text = event.target.value;
        state.setValue(text.trim() === '' ? null : { kind: 'typed', text });
      }}
      onKeyDown={(event) => {
        // The Enter that confirms an input method candidate is the input method's.
        if (event.key === 'Enter' && !isComposingKey(event.nativeEvent)) state.commit();
      }}
    />
  );
}

function SignatureControls({ control, state, mode, onModeChange, name }: SignatureControlsProps) {
  const strings = useUiStrings();
  const { value } = state;
  const isEditable = !state.isReadOnly && !state.isDisabled;
  return (
    <>
      {onModeChange ? (
        <SegmentedChoice
          {...hooks.slot('modes')}
          aria-label={strings.signatureMethod}
          size="sm"
          sizing="content"
          options={[
            { value: 'draw', label: strings.signatureDraw },
            { value: 'type', label: strings.signatureType },
          ]}
          value={mode}
          isReadOnly={state.isReadOnly}
          isDisabled={state.isDisabled}
          onChange={(next) => {
            if (next === 'draw' || next === 'type') onModeChange(next);
          }}
        />
      ) : null}
      {mode === 'type' ? (
        <SignatureInput control={control} state={state} />
      ) : (
        <SignatureSurface
          control={control}
          drawing={value?.kind === 'drawn' ? value : null}
          isEditable={isEditable}
          onDraw={(drawing) => {
            state.setValue(drawing);
            state.commit();
          }}
        />
      )}
      <FieldFormValue
        name={name}
        value={value ? JSON.stringify(value) : null}
        isDisabled={state.isDisabled}
      />
    </>
  );
}

/**
 * A field for a signature: drawn with a mouse, a pen or a touch as smoothed strokes on an SVG
 * canvas, with Undo stroke and Clear, or typed as the signer's name, the keyboard alternative. The
 * value is a drawn signature (SVG path data) or a typed one, and `null` while empty. It has the
 * field base's label, validation, dirty state, restore, undo and menu.
 */
export function SignaturePad({ allowsTyping = true, ...props }: SignaturePadProps) {
  const { state, field, rest } = useFieldControl(props, {
    initialValue: null,
    emptyValue: null,
    isEmpty: isSignatureEmpty,
  });
  const valueMode = state.value ? modeOf(state.value) : null;
  const [chosenMode, setChosenMode] = useState<SignaturePadMode>(valueMode ?? 'draw');
  // An empty field keeps the mode of the value it last held, so clearing a typed name keeps its input.
  if (valueMode && valueMode !== chosenMode) setChosenMode(valueMode);
  // Without typing, an empty field draws; a typed value already held still shows, not erased.
  const mode = valueMode ?? (allowsTyping ? chosenMode : 'draw');
  const changeMode = (next: SignaturePadMode) => {
    setChosenMode(next);
    if (state.value && modeOf(state.value) !== next) {
      state.setValue(null);
      state.commit();
    }
  };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data: { mode } })}
      state={state}
      commitOnBlur
    >
      {(control) => (
        <SignatureControls
          control={control}
          state={state}
          mode={mode}
          onModeChange={allowsTyping ? changeMode : null}
          name={rest.name}
        />
      )}
    </Field>
  );
}
