import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { Popover, useLocale, type Placement } from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';
import { useLayerZIndex } from '../portal/portal.js';
import { codeEditorHooks as hooks } from './code-layers.js';

/** A completion the editor offers for the word before the caret. */
export interface CodeCompletion {
  /** The text inserted in place of the word. */
  label: string;
  /** A short explanation shown beside the label. */
  description?: string | undefined;
}

export interface CodeCompletionOptions {
  completions: readonly CodeCompletion[] | undefined;
  value: string;
  onChange: ((value: string) => void) | undefined;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  /** A read-only or disabled editor offers nothing. */
  isLocked: boolean;
}

export interface CodeCompletionModel {
  isOpen: boolean;
  options: readonly CodeCompletion[];
  activeIndex: number;
  /** The caret offset the list belongs to. */
  caret: number;
  /** Changes whenever the caret moves on screen, so the list follows it. */
  anchorKey: number;
  setActiveIndex(index: number): void;
  apply(option: CodeCompletion): void;
  /** Reads the caret from the input after it moved. */
  track(): void;
  /** Follows the caret after the input scrolled. */
  reposition(): void;
  close(): void;
  /** Handles the list's keys while it is open; returns whether the key was used. */
  handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): boolean;
  /** Follows the caret after a navigation key the list did not use. */
  handleKeyUp(event: KeyboardEvent<HTMLTextAreaElement>): void;
}

export interface CodeCompletionListProps {
  model: CodeCompletionModel;
  id: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  caretRef: RefObject<HTMLSpanElement | null>;
}

interface CompletionState {
  caret: number;
  activeIndex: number;
  isClosed: boolean;
  anchorKey: number;
}

const WORD_BEFORE_CARET = /[A-Za-z_$][\w$.]*$/;

const NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

function step(index: number, delta: number, count: number): number {
  return (index + delta + count) % count;
}

/**
 * Replaces the word before the caret with a completion through `onChange`, then puts the caret
 * after it once the new value is rendered.
 */
function useInsertion(
  inputRef: RefObject<HTMLTextAreaElement | null>,
  value: string,
  onChange: ((value: string) => void) | undefined,
) {
  const pendingCaret = useRef<number | null>(null);
  useLayoutEffect(() => {
    const input = inputRef.current;
    const caret = pendingCaret.current;
    if (!input || caret === null || input.value !== value) return;
    pendingCaret.current = null;
    input.setSelectionRange(caret, caret);
  }, [inputRef, value]);
  return (text: string) => {
    const input = inputRef.current;
    if (!input) return;
    const caret = input.selectionStart ?? input.value.length;
    const start = caret - findCompletionQuery(input.value, caret).length;
    pendingCaret.current = start + text.length;
    onChange?.(`${input.value.slice(0, start)}${text}${input.value.slice(caret)}`);
  };
}

/** The identifier-like word that ends at `caret`, or `''`. */
export function findCompletionQuery(value: string, caret: number): string {
  return WORD_BEFORE_CARET.exec(value.slice(0, caret))?.[0] ?? '';
}

/** The completions that extend `query`, ignoring case; none for an empty query. */
export function matchCompletions(
  completions: readonly CodeCompletion[],
  query: string,
): CodeCompletion[] {
  if (!query) return [];
  const prefix = query.toLowerCase();
  return completions.filter(
    ({ label }) => label !== query && label.toLowerCase().startsWith(prefix),
  );
}

/**
 * Completion for a code editor's input: the words that extend the word before the caret, an
 * active option moved with the arrow keys, and Enter or Tab to insert it. The input keeps focus.
 */
export function useCodeCompletion({
  completions,
  value,
  onChange,
  inputRef,
  isLocked,
}: CodeCompletionOptions): CodeCompletionModel {
  const [state, setState] = useState<CompletionState>({
    caret: 0,
    activeIndex: 0,
    isClosed: true,
    anchorKey: 0,
  });
  const insert = useInsertion(inputRef, value, onChange);
  const usedKey = useRef<string | null>(null);
  const options =
    completions && !isLocked
      ? matchCompletions(completions, findCompletionQuery(value, state.caret))
      : [];
  const isOpen = !state.isClosed && options.length > 0;
  const activeIndex = Math.min(state.activeIndex, Math.max(0, options.length - 1));

  const track = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const caret = input.selectionStart ?? input.value.length;
    setState((current) => ({
      caret,
      activeIndex: 0,
      isClosed: false,
      anchorKey: current.anchorKey + 1,
    }));
  }, [inputRef]);

  const close = () => setState((current) => ({ ...current, isClosed: true }));
  const apply = (option: CodeCompletion) => {
    insert(option.label);
    close();
  };
  const setActiveIndex = (index: number) =>
    setState((current) => ({ ...current, activeIndex: index }));

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
    if (!isOpen || event.nativeEvent.isComposing) return false;
    const option = options[activeIndex];
    if (event.key === 'ArrowDown') setActiveIndex(step(activeIndex, 1, options.length));
    else if (event.key === 'ArrowUp') setActiveIndex(step(activeIndex, -1, options.length));
    else if ((event.key === 'Enter' || event.key === 'Tab') && option) apply(option);
    else if (event.key === 'Escape') close();
    else return false;
    usedKey.current = event.key;
    event.preventDefault();
    event.stopPropagation();
    return true;
  };
  const handleKeyUp = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const used = usedKey.current === event.key;
    usedKey.current = null;
    if (!used && NAVIGATION_KEYS.has(event.key)) track();
  };

  return {
    isOpen,
    options,
    activeIndex,
    caret: state.caret,
    anchorKey: state.anchorKey,
    setActiveIndex,
    apply,
    track,
    reposition: () => setState((current) => ({ ...current, anchorKey: current.anchorKey + 1 })),
    close,
    handleKeyDown,
    handleKeyUp,
  };
}

/**
 * The completion list, a listbox in a non-modal popover at the caret. React Aria repositions an
 * open popover when its placement changes, so each caret move alternates between the logical and
 * physical spelling of the same placement.
 */
export function CodeCompletionList({ model, id, inputRef, caretRef }: CodeCompletionListProps) {
  const strings = useUiStrings();
  const { direction } = useLocale();
  const zIndex = useLayerZIndex('dropdown');
  const physical: Placement = direction === 'rtl' ? 'bottom right' : 'bottom left';
  return (
    <Popover
      className={hooks.slotClass('popover')}
      isOpen={model.isOpen}
      onOpenChange={(open) => (open ? undefined : model.close())}
      isNonModal
      triggerRef={inputRef}
      getTargetRect={() => caretRef.current?.getBoundingClientRect()}
      placement={model.anchorKey % 2 === 0 ? 'bottom start' : physical}
      offset={2}
      style={{ zIndex }}
    >
      <div {...hooks.slot('completions')} id={id} role="listbox" aria-label={strings.suggestions}>
        {model.options.map((option, index) => (
          <div
            key={option.label}
            {...hooks.slot('completion', { focused: index === model.activeIndex })}
            id={`${id}-${index}`}
            role="option"
            aria-selected={index === model.activeIndex}
            onPointerDown={(event) => event.preventDefault()}
            onPointerMove={() => {
              if (index !== model.activeIndex) model.setActiveIndex(index);
            }}
            onClick={() => model.apply(option)}
          >
            <span {...hooks.slot('completion-label')}>{option.label}</span>
            {option.description ? (
              <span {...hooks.slot('completion-description')}>{option.description}</span>
            ) : null}
          </div>
        ))}
      </div>
    </Popover>
  );
}
