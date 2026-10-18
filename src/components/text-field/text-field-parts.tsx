import {
  useCallback,
  useRef,
  type CompositionEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Group, Input, TextArea } from '../../primitives/index.js';
import { createHooks, type HookProps } from '../../core/hooks.js';
import type { CompletionInputAttributes } from '../completion-list/completion-list.js';
import { useUiStrings } from '../../core/provider.js';
import { useAutoGrow, type AutoGrowOptions } from '../../utils/use-auto-grow.js';
import { IconButton } from '../icon-button/icon-button.js';

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

export interface RevealButtonProps {
  /** The field's label, which names the button. */
  label: string;
  isRevealed: boolean;
  isDisabled: boolean;
  onChange(isRevealed: boolean): void;
}

export interface TextFieldFrameProps {
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

export interface TextFieldAreaProps extends TextFieldInputProps, AutoGrowOptions {
  /** Publishes the text area to the field. */
  controlRef: (node: HTMLElement | null) => void;
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
    <IconButton
      className={hooks.slotClass('reveal')}
      icon={isRevealed ? 'eye-slash' : 'eye'}
      label={strings.revealValue(label)}
      size="sm"
      isSelected={isRevealed}
      aria-pressed={isRevealed}
      isDisabled={isDisabled}
      preventFocusOnPress
      onPress={() => onChange(!isRevealed)}
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
export function TextFieldArea({
  controlRef,
  minRows,
  maxRows,
  value,
  ...rest
}: TextFieldAreaProps) {
  const area = useRef<HTMLTextAreaElement | null>(null);
  const ref = useCallback(
    (node: HTMLTextAreaElement | null) => {
      area.current = node;
      controlRef(node);
    },
    [controlRef],
  );
  useAutoGrow(area, { minRows, maxRows, value });
  return <TextArea {...rest} ref={ref} rows={minRows} />;
}

export interface TextFieldControlProps extends Omit<AutoGrowOptions, 'value'> {
  input: TextFieldInputProps;
  multiline: boolean;
  /** The text the control shows. */
  value: string;
  /** Publishes the input or text area to the field. */
  controlRef: (node: HTMLElement | null) => void;
}

/** The text area of a multiline field, else the input. */
export function TextFieldControl({ input, multiline, controlRef, ...grow }: TextFieldControlProps) {
  if (multiline) return <TextFieldArea {...input} {...grow} controlRef={controlRef} />;
  return <Input {...input} ref={controlRef} />;
}
