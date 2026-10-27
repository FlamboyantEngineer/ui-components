import {
  useMemo,
  type AriaAttributes,
  useRef,
  type CompositionEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
  type SyntheticEvent,
} from 'react';
import { Group, Input, TextArea } from '../../primitives/index.js';
import { createHooks, type HookProps } from '../../core/hooks.js';
import type { CompletionInputAttributes } from '../completion-list/completion-list.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeProps, mergeRefs } from '../../utils/merge-props.js';
import { useAutoGrow, type AutoGrowOptions } from '../../utils/use-auto-grow.js';
import { Button } from '../button/button.js';

/** The element a text field edits in: an input on one line, a text area on several. */
export type TextFieldElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Attributes and handlers for the input or text area itself, for an editor that drives it: its
 * text events and the ARIA of a suggestion surface the caller owns. The field's own handlers run
 * first, and its own completion list's attributes win over these.
 */
export interface TextFieldControlProps {
  /** `combobox` while the caller's suggestion list belongs to the control. */
  role?: 'combobox' | undefined;
  /** The id of the caller's suggestion list. */
  'aria-controls'?: string | undefined;
  /** Whether the caller's suggestion list is open. */
  'aria-expanded'?: boolean | undefined;
  /** How the caller's suggestions complete the text. */
  'aria-autocomplete'?: 'list' | 'inline' | 'both' | 'none' | undefined;
  /** The id of the caller's highlighted suggestion. */
  'aria-activedescendant'?: string | undefined;
  /** The kind of the caller's suggestion surface, such as `dialog`; a combobox defaults to `listbox`. */
  'aria-haspopup'?: AriaAttributes['aria-haspopup'] | undefined;
  /** Whether the caller's suggestions are still loading. */
  'aria-busy'?: boolean | undefined;
  /** Called before an edit changes the text, with the native `InputEvent` in `nativeEvent`. */
  onBeforeInput?: ((event: FormEvent<TextFieldElement>) => void) | undefined;
  /** Called after each edit changes the text. */
  onInput?: ((event: FormEvent<TextFieldElement>) => void) | undefined;
  /** Called when the selection or the caret moves. */
  onSelect?: ((event: SyntheticEvent<TextFieldElement>) => void) | undefined;
  onCompositionStart?: ((event: CompositionEvent<TextFieldElement>) => void) | undefined;
  onCompositionUpdate?: ((event: CompositionEvent<TextFieldElement>) => void) | undefined;
  onCompositionEnd?: ((event: CompositionEvent<TextFieldElement>) => void) | undefined;
}

/** The field's ref to its control, and the caller's refs to either element. */
interface TextFieldControlRefs {
  field: (node: HTMLElement | null) => void;
  input: Ref<HTMLInputElement> | undefined;
  textArea: Ref<HTMLTextAreaElement> | undefined;
}

/** What the control takes from the field's edit state (`useTextFieldInput`). */
interface TextFieldEdit {
  input: TextFieldInputProps;
  /** The text the control shows. */
  text: string;
  transform: { ref: (node: TextFieldElement | null) => void };
  controlRef: RefObject<TextFieldElement | null>;
}

export const textFieldHooks = createHooks('text-field', [
  'box',
  'group',
  'start',
  'input',
  'end',
  'reveal',
  'count',
  'completions',
]);

const hooks = textFieldHooks;

interface RevealButtonProps {
  /** The field's label, which names the button. */
  label: string;
  isRevealed: boolean;
  isDisabled: boolean;
  onChange(isRevealed: boolean): void;
}

interface TextFieldFrameProps {
  startAdornment: ReactNode;
  endAdornment: ReactNode;
  /** The reveal button of a masked field, or `null`. */
  reveal: RevealButtonProps | null;
  /** The input or text area. */
  children: ReactNode;
}

/** The input's own props: its hooks, the hint, the field's edit handlers and its completion list's attributes. */
export type TextFieldInputProps = HookProps &
  Partial<CompletionInputAttributes> & {
    placeholder: string | undefined;
    onFocus: () => void;
    onBlur: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    onCompositionStart: () => void;
    onCompositionEnd: (event: CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onClick?: (() => void) | undefined;
    onKeyUp?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
  };

interface TextFieldAreaProps extends TextFieldInputProps, AutoGrowOptions {
  /** Publishes the text area to the field and the caller. */
  controlRef: Ref<HTMLTextAreaElement>;
}

/**
 * The input alone, or with adornments or a reveal button a group around them all, which the host
 * frames as one box.
 */
export function TextFieldFrame({
  startAdornment,
  endAdornment,
  reveal,
  children,
}: TextFieldFrameProps) {
  if (!startAdornment && !endAdornment && !reveal) return children;
  return (
    <Group {...hooks.slot('group')}>
      {startAdornment ? <span {...hooks.slot('start')}>{startAdornment}</span> : null}
      {children}
      {endAdornment ? <span {...hooks.slot('end')}>{endAdornment}</span> : null}
      {reveal ? <RevealButton {...reveal} /> : null}
    </Group>
  );
}

/**
 * A toggle button that shows a masked value while pressed (`aria-pressed`). A pointer press keeps
 * focus, and the caret, in the input.
 */
function RevealButton({ label, isRevealed, isDisabled, onChange }: RevealButtonProps) {
  const strings = useUiStrings();
  return (
    <Button
      className={hooks.slotClass('reveal')}
      icon={isRevealed ? 'eye-slash' : 'eye'}
      label={strings.revealValue(label)}
      size="sm"
      isSelected={isRevealed}
      isDisabled={isDisabled}
      preventFocusOnPress
      onChange={onChange}
    />
  );
}

/** The text's length, against `maxLength` when it has one. */
function CharacterCount({ count, maxLength }: { count: number; maxLength?: number | undefined }) {
  const strings = useUiStrings();
  return <span {...hooks.slot('count')}>{strings.characterCount(count, maxLength)}</span>;
}

/** The description, followed by the character count when there is one, so the count describes the control too. */
export function withCharacterCount(
  description: ReactNode,
  { count, maxLength }: { count: number | null; maxLength: number | undefined },
): ReactNode {
  if (count === null) return description;
  // The space keeps the description and the count apart when they are read as one text.
  return (
    <>
      {description ? <>{description} </> : null}
      <CharacterCount count={count} maxLength={maxLength} />
    </>
  );
}

/** The text area, at least `minRows` tall, growing with its text when a row limit is set. */
function TextFieldArea({ controlRef, minRows, maxRows, value, ...rest }: TextFieldAreaProps) {
  const area = useRef<HTMLTextAreaElement | null>(null);
  const ref = useMemo(() => mergeRefs(area, controlRef), [controlRef]);
  useAutoGrow(area, { minRows, maxRows, value });
  return <TextArea {...rest} ref={ref} rows={minRows} />;
}

interface TextFieldControlElementProps extends Omit<AutoGrowOptions, 'value'> {
  edit: TextFieldEdit;
  multiline: boolean;
  refs: TextFieldControlRefs;
  /** The caller's attributes and handlers for the control. */
  controlProps: TextFieldControlProps | undefined;
}

/** The caller's suggestion ARIA under the field's own, then the field's handlers before the caller's. */
function withControlProps(input: TextFieldInputProps, controlProps: TextFieldControlProps = {}) {
  const attributes: Record<string, unknown> = {};
  const handlers: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(controlProps)) {
    (key.startsWith('on') ? handlers : attributes)[key] = value;
  }
  return mergeProps(attributes, input, handlers);
}

/** The text area of a multiline field, else the input, each also handed to the caller's ref. */
export function TextFieldControl({
  edit,
  multiline,
  refs,
  controlProps,
  ...grow
}: TextFieldControlElementProps) {
  const { field, input: inputRef, textArea } = refs;
  const transform = edit.transform.ref;
  const own = useMemo(
    () => mergeRefs(field, transform, edit.controlRef),
    [field, transform, edit.controlRef],
  );
  const areaRef = useMemo(() => mergeRefs<HTMLTextAreaElement>(own, textArea), [own, textArea]);
  const lineRef = useMemo(() => mergeRefs<HTMLInputElement>(own, inputRef), [own, inputRef]);
  const props = withControlProps(edit.input, controlProps);
  if (multiline) {
    return <TextFieldArea {...props} {...grow} value={edit.text} controlRef={areaRef} />;
  }
  return <Input {...props} ref={lineRef} />;
}
