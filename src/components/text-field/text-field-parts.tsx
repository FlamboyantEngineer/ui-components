import { useCallback, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { Group, TextArea, type TextAreaProps } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { IconButton } from '../icon-button/icon-button.js';

export const textFieldHooks = createHooks('text-field', [
  'box',
  'group',
  'start',
  'input',
  'end',
  'reveal',
  'count',
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

export interface AutoGrowOptions {
  minRows: number | undefined;
  maxRows: number | undefined;
  value: string;
}

export interface TextFieldAreaProps
  extends Omit<TextAreaProps, 'ref' | 'rows' | 'value'>, AutoGrowOptions {
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

function toPixels(value: string): number {
  return Number.parseFloat(value) || 0;
}

/** Sets the text area's height to its text's, between the given rows, in its own line height. */
function fitRows(area: HTMLTextAreaElement, minRows: number, maxRows: number) {
  const style = area.ownerDocument.defaultView?.getComputedStyle(area);
  if (!style) return;
  const lineHeight = toPixels(style.lineHeight) || toPixels(style.fontSize) * 1.2 || 16;
  const padding = toPixels(style.paddingTop) + toPixels(style.paddingBottom);
  const border = toPixels(style.borderTopWidth) + toPixels(style.borderBottomWidth);
  const frame = style.boxSizing === 'border-box' ? padding + border : 0;
  area.style.height = '0px';
  const content = clamp(area.scrollHeight - padding, minRows * lineHeight, maxRows * lineHeight);
  area.style.height = `${content + frame}px`;
}

/** Whether a text area grows with its text: when either row limit is set. */
export function isAutoGrowing({ minRows, maxRows }: Pick<AutoGrowOptions, 'minRows' | 'maxRows'>) {
  return minRows !== undefined || maxRows !== undefined;
}

/**
 * Grows a text area with its text between `minRows` and `maxRows` (one row and no limit by default),
 * when either is set. Past `maxRows` the text area scrolls. A new width (a stylesheet or font that
 * loads late, a resized container) wraps the text anew, so it measures again.
 */
function useAutoGrow(area: RefObject<HTMLTextAreaElement | null>, options: AutoGrowOptions) {
  const { minRows, maxRows, value } = options;
  const isEnabled = isAutoGrowing(options);
  const width = useElementSize(area, { enabled: isEnabled })?.width;
  useLayoutEffect(() => {
    if (isEnabled && area.current) fitRows(area.current, minRows ?? 1, maxRows ?? Infinity);
  }, [area, isEnabled, minRows, maxRows, value, width]);
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
