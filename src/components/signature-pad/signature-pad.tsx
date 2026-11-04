'use client';

import { useState } from 'react';
import { EditGlyph, ImageGlyph, ItalicGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { Input } from '../../primitives/index.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import {
  Field,
  type FieldControlProps,
  FieldFormValue,
  type FieldInputProps,
  type FieldState,
  useFieldControl,
} from '../field/field.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import {
  type ImageIntake,
  SignatureImageArea,
  SignatureImageChooser,
  useImageIntake,
} from './signature-image.js';
import { type SignaturePadMenuIcons, useSignatureMenu } from './signature-pad-menu.js';
import type { SignatureValue } from './signature-path.js';
import { signaturePadHooks as hooks, SignatureSurface } from './signature-surface.js';

export type { SignaturePadAction, SignaturePadMenuIcons } from './signature-pad-menu.js';
export type {
  DrawnSignature,
  ImageSignature,
  SignatureValue,
  TypedSignature,
} from './signature-path.js';

/**
 * How the signature is given: drawn with a pointer, typed as the signer's name, or as an existing
 * image, uploaded or pasted.
 */
export type SignaturePadMode = 'draw' | 'type' | 'image';

const allModes: readonly SignaturePadMode[] = ['draw', 'type', 'image'];

/** An image file of 2 MB at most is taken by default. */
const defaultMaxImageSize = 2 * 1024 * 1024;

export interface SignaturePadProps extends FieldInputProps<SignatureValue | null> {
  /**
   * The ways the signer may give the signature, in the order offered; the first is where an empty
   * pad starts. Defaults to drawing, typing and an image. With one mode, no choice shows.
   */
  modes?: readonly SignaturePadMode[] | undefined;
  /** The largest image file the image mode takes, in bytes. Defaults to 2 MB. */
  maxImageSize?: number | undefined;
  /**
   * Icons for the menu's built-in actions, by action: the pad's (`upload-image`, `paste-image`,
   * `delete-image`, `undo-stroke`) and the field's. An icon replaces the action's own, `null`
   * removes it.
   */
  menuIcons?: SignaturePadMenuIcons | undefined;
}

interface SignatureControlsProps {
  control: FieldControlProps;
  state: FieldState<SignatureValue | null>;
  mode: SignaturePadMode;
  /** The modes offered, when there is a choice. */
  modes: readonly SignaturePadMode[] | null;
  onModeChange: (mode: SignaturePadMode) => void;
  intake: ImageIntake;
  settle: (next: SignatureValue | null) => void;
  name: string | undefined;
}

/**
 * Whether a signature holds nothing a signer made: none, typed text that is blank, or a drawing
 * with no stroke, however the value arrived.
 */
function isSignatureEmpty(value: SignatureValue | null): boolean {
  if (!value) return true;
  if (value.kind === 'typed') return value.text.trim() === '';
  return value.kind === 'image' ? value.src === '' : value.paths.length === 0;
}

const modeByKind = { drawn: 'draw', typed: 'type', image: 'image' } as const;

function modeOf(value: SignatureValue): SignaturePadMode {
  return modeByKind[value.kind];
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

/** Where the signature is given in the current mode: the name input, the image area or the canvas. */
function SignatureEntry({ control, state, mode, intake, settle }: SignatureControlsProps) {
  const { value } = state;
  const isEditable = !state.isReadOnly && !state.isDisabled;
  if (mode === 'type') return <SignatureInput control={control} state={state} />;
  if (mode === 'image') {
    return (
      <SignatureImageArea
        control={control}
        image={value?.kind === 'image' ? value : null}
        isEditable={isEditable}
        intake={intake}
      />
    );
  }
  return (
    <SignatureSurface
      control={control}
      drawing={value?.kind === 'drawn' ? value : null}
      isEditable={isEditable}
      onDraw={settle}
    />
  );
}

function SignatureControls(props: SignatureControlsProps) {
  const { state, mode, modes, onModeChange, name } = props;
  const strings = useUiStrings();
  const labels: Record<SignaturePadMode, string> = {
    draw: strings.signatureDraw,
    type: strings.signatureType,
    image: strings.signatureImage,
  };
  const icons = { draw: EditGlyph, type: ItalicGlyph, image: ImageGlyph } as const;
  return (
    <>
      {modes ? (
        <SegmentedChoice
          {...hooks.slot('modes')}
          aria-label={strings.signatureMethod}
          size="sm"
          sizing="content"
          iconOnly
          options={modes.map((entry) => ({
            value: entry,
            label: labels[entry],
            icon: icons[entry],
          }))}
          value={mode}
          isReadOnly={state.isReadOnly}
          isDisabled={state.isDisabled}
          onChange={(next) => {
            const chosen = modes.find((entry) => entry === next);
            if (chosen) onModeChange(chosen);
          }}
        />
      ) : null}
      <SignatureEntry {...props} />
      <SignatureImageChooser intake={props.intake} />
      <FieldFormValue
        name={name}
        value={state.value ? JSON.stringify(state.value) : null}
        isDisabled={state.isDisabled}
      />
    </>
  );
}

/**
 * A field for a signature: drawn with a mouse, a pen or a touch as smoothed strokes on an SVG
 * canvas, with Undo stroke and Clear; typed as the signer's name, the keyboard alternative; or
 * given as an existing image, uploaded or pasted. The value is a drawn signature (SVG path data), a
 * typed one or an image one, and `null` while empty. It has the field base's label, validation,
 * dirty state, restore, undo and menu.
 */
export function SignaturePad({
  modes: offered = allModes,
  maxImageSize = defaultMaxImageSize,
  ...props
}: SignaturePadProps) {
  const { state, field, rest } = useFieldControl(props, {
    initialValue: null,
    emptyValue: null,
    isEmpty: isSignatureEmpty,
  });
  const modes = offered.length > 0 ? offered : allModes.slice(0, 1);
  const firstMode = modes[0] ?? 'draw';
  const valueMode = state.value ? modeOf(state.value) : null;
  const [chosenMode, setChosenMode] = useState<SignaturePadMode>(valueMode ?? firstMode);
  // An empty field keeps the mode of the value it last held, so clearing a typed name keeps its input.
  if (valueMode && valueMode !== chosenMode) setChosenMode(valueMode);
  // An empty field shows the chosen mode while it is offered; a value of a mode no longer offered
  // still shows, not erased.
  const mode = valueMode ?? (modes.includes(chosenMode) ? chosenMode : firstMode);
  // Changing the mode clears a signature given another way, so no hidden signature is kept.
  const changeMode = (next: SignaturePadMode) => {
    setChosenMode(next);
    if (state.value && modeOf(state.value) !== next) {
      state.setValue(null);
      state.commit();
    }
  };
  const settle = (next: SignatureValue | null) => {
    state.setValue(next);
    state.commit();
  };
  const intake = useImageIntake({
    maxSize: maxImageSize,
    isActive: mode === 'image',
    isEditable: !state.isReadOnly && !state.isDisabled,
    value: state.value,
    onImage: settle,
  });
  const menu = useSignatureMenu({
    state,
    menu: field.menu,
    onMenuAction: field.onMenuAction,
    menuIcons: field.menuIcons,
    allowsImage: modes.includes('image'),
    isImageMode: mode === 'image',
    intake,
    settle,
  });
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data: { mode } })}
      {...menu}
      state={state}
      commitOnBlur
    >
      {(control) => (
        <SignatureControls
          control={control}
          state={state}
          mode={mode}
          modes={modes.length > 1 ? modes : null}
          onModeChange={changeMode}
          intake={intake}
          settle={settle}
          name={rest.name}
        />
      )}
    </Field>
  );
}
