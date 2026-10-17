import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { TextArea, type TextAreaProps as AriaTextAreaProps } from 'react-aria-components';
import { splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useElementSize } from '../../utils/use-element-size.js';
import {
  CodeCompletionList,
  useCodeCompletion,
  type CodeCompletion,
  type CodeCompletionModel,
} from './code-completion.js';
import {
  CodeDiagnostics,
  CodeGutter,
  CodeHighlight,
  codeEditorHooks as hooks,
  severitiesByLine,
  type CodeDiagnostic,
  type CodeToken,
  type CodeTokenizer,
} from './code-layers.js';

export type CodeEditorSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `soft` wraps long lines; `off` scrolls them sideways. */
export type CodeEditorWrap = 'soft' | 'off';

type TextAreaPassThrough = Omit<
  AriaTextAreaProps,
  'className' | 'style' | 'render' | 'children' | 'value' | 'defaultValue' | 'onChange' | 'wrap'
>;

export interface CodeEditorProps extends TextAreaPassThrough, BaseProps {
  /** The source text, controlled. */
  value: string;
  onChange?: ((value: string) => void) | undefined;
  /** The language: splits the source into tokens for the highlighted layer. */
  tokenize?: CodeTokenizer | undefined;
  /** Problems to list below the editor and mark in the gutter. An error makes the editor invalid. */
  diagnostics?: readonly CodeDiagnostic[] | undefined;
  /** The vocabulary offered as completions for the word before the caret. */
  completions?: readonly CodeCompletion[] | undefined;
  /** Starting height. Defaults to `md`. */
  size?: CodeEditorSize | undefined;
  /** Defaults to `soft`. */
  wrap?: CodeEditorWrap | undefined;
  /** Numbers the source lines in a gutter. */
  lineNumbers?: boolean | undefined;
  /** Tools shown in a row above the source, such as a label, a count or a format button. */
  toolbar?: ReactNode;
  /** The text area. */
  ref?: Ref<HTMLTextAreaElement> | undefined;
}

interface Layers {
  input: RefObject<HTMLTextAreaElement | null>;
  highlight: RefObject<HTMLPreElement | null>;
  gutter: RefObject<HTMLDivElement | null>;
}

function joinIds(...ids: Array<string | false | undefined>): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}

function isTrue(value: unknown): boolean {
  return value === true || value === 'true';
}

/**
 * Ties the text area to its completion list: a multiline text box that autocompletes from a list,
 * with the active option as its active descendant while the list is open.
 */
function toCompletionProps(completion: CodeCompletionModel, listId: string): AriaTextAreaProps {
  return {
    'aria-autocomplete': 'list',
    'aria-haspopup': 'listbox',
    'aria-controls': completion.isOpen ? listId : undefined,
    'aria-activedescendant': completion.isOpen ? `${listId}-${completion.activeIndex}` : undefined,
  };
}

/** Moves the highlighted layer and the gutter to the input's scroll offset. */
function alignLayers({ input, highlight, gutter }: Layers) {
  const source = input.current;
  if (!source) return;
  if (highlight.current) {
    highlight.current.scrollTop = source.scrollTop;
    highlight.current.scrollLeft = source.scrollLeft;
  }
  if (gutter.current) gutter.current.scrollTop = source.scrollTop;
}

function useMergedRef<T>(own: RefObject<T | null>, caller: Ref<T> | undefined) {
  return useCallback(
    (node: T | null) => {
      own.current = node;
      if (typeof caller === 'function') caller(node);
      else if (caller) caller.current = node;
    },
    [own, caller],
  );
}

/** The text area's props: the caller's, with the editor's handlers run first. */
function useInputProps(
  props: TextAreaPassThrough,
  editor: {
    layers: Layers;
    completion: CodeCompletionModel;
    onChange: ((value: string) => void) | undefined;
  },
): AriaTextAreaProps {
  const { layers, completion, onChange } = editor;
  return {
    spellCheck: false,
    autoComplete: 'off',
    autoCapitalize: 'off',
    autoCorrect: 'off',
    ...props,
    onChange: (event) => {
      onChange?.(event.target.value);
      completion.track();
    },
    onKeyDown: (event) => {
      if (!completion.handleKeyDown(event)) props.onKeyDown?.(event);
    },
    onKeyUp: (event) => {
      completion.handleKeyUp(event);
      props.onKeyUp?.(event);
    },
    onClick: (event) => {
      completion.track();
      props.onClick?.(event);
    },
    onBlur: (event) => {
      completion.close();
      props.onBlur?.(event);
    },
    onScroll: (event) => {
      alignLayers(layers);
      if (completion.isOpen) completion.reposition();
      props.onScroll?.(event);
    },
  };
}

interface CodeAreaProps {
  value: string;
  onChange: ((value: string) => void) | undefined;
  tokenize: CodeTokenizer | undefined;
  wrap: CodeEditorWrap;
  id: string | undefined;
  /** The caller's text area props, without data attributes. */
  props: TextAreaPassThrough;
  inputRef: Ref<HTMLTextAreaElement>;
  layers: Layers;
  caretRef: RefObject<HTMLSpanElement | null>;
  completion: CodeCompletionModel;
  isInvalid: boolean;
  describedBy: string | undefined;
  /** The completion list's id, when the editor offers completions. */
  listId: string | undefined;
}

/** The highlighted copy and the text area over it. */
function CodeArea({ props, completion, layers, onChange, ...area }: CodeAreaProps) {
  const { value, tokenize, listId } = area;
  const inputProps = useInputProps(props, { layers, completion, onChange });
  const tokens = useMemo<readonly CodeToken[]>(
    () => (tokenize ? tokenize(value) : [{ text: value }]),
    [tokenize, value],
  );
  return (
    <div {...hooks.slot('code')}>
      <CodeHighlight
        tokens={tokens}
        caret={completion.isOpen ? completion.caret : null}
        caretRef={area.caretRef}
        highlightRef={layers.highlight}
      />
      <TextArea
        {...inputProps}
        {...hooks.slot('input')}
        id={area.id}
        ref={area.inputRef}
        value={value}
        wrap={area.wrap}
        aria-invalid={area.isInvalid || undefined}
        aria-describedby={area.describedBy}
        {...(listId === undefined ? {} : toCompletionProps(completion, listId))}
      />
    </div>
  );
}

function useLayers(): Layers {
  const input = useRef<HTMLTextAreaElement>(null);
  const highlight = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  return useMemo(() => ({ input, highlight, gutter }), []);
}

/**
 * A code editing surface: a native text area over a highlighted copy of the source, so the browser
 * keeps the caret, selection, undo and input methods. The language (tokens), the diagnostics and
 * the completion vocabulary come from the caller. Optional line numbers and a toolbar row.
 */
export function CodeEditor({
  value,
  onChange,
  tokenize,
  diagnostics,
  completions,
  size = 'md',
  wrap = 'soft',
  lineNumbers = false,
  toolbar,
  className,
  id,
  ref,
  ...rest
}: CodeEditorProps) {
  const [dataProps, props] = splitDataAttributes(rest);
  const baseId = useId();
  const layers = useLayers();
  const caretRef = useRef<HTMLSpanElement>(null);
  const inputRef = useMergedRef(layers.input, ref);
  const isLocked = Boolean(props.readOnly || props.disabled);
  const completion = useCodeCompletion({
    completions,
    value,
    onChange,
    inputRef: layers.input,
    isLocked,
  });
  const textWidth = useElementSize(layers.input, { box: 'client', enabled: lineNumbers })?.width;
  const shown = diagnostics ?? [];
  const isInvalid =
    shown.some(({ severity = 'error' }) => severity === 'error') || isTrue(props['aria-invalid']);
  const diagnosticsId = `${baseId}-diagnostics`;
  const listId = completions ? `${baseId}-completions` : undefined;

  useLayoutEffect(() => alignLayers(layers), [layers, value, wrap, lineNumbers, textWidth]);

  const locks = { readonly: Boolean(props.readOnly), disabled: Boolean(props.disabled) };
  const data = { size, wrap, numbered: lineNumbers, invalid: isInvalid, ...locks };
  return (
    <div {...hooks.root({ className, props: dataProps, data })}>
      {toolbar ? <div {...hooks.slot('toolbar')}>{toolbar}</div> : null}
      <div {...hooks.slot('surface')}>
        {lineNumbers ? (
          <CodeGutter
            lines={value.split('\n')}
            severities={severitiesByLine(shown)}
            textWidth={textWidth}
            gutterRef={layers.gutter}
          />
        ) : null}
        <CodeArea
          {...{
            value,
            onChange,
            tokenize,
            wrap,
            id,
            props,
            inputRef,
            layers,
            caretRef,
            completion,
          }}
          isInvalid={isInvalid}
          describedBy={joinIds(props['aria-describedby'], shown.length > 0 && diagnosticsId)}
          listId={listId}
        />
      </div>
      {diagnostics ? <CodeDiagnostics id={diagnosticsId} diagnostics={diagnostics} /> : null}
      {listId ? (
        <CodeCompletionList
          model={completion}
          id={listId}
          inputRef={layers.input}
          caretRef={caretRef}
        />
      ) : null}
    </div>
  );
}

export type { CodeCompletion } from './code-completion.js';
export type { CodeDiagnostic, CodeToken, CodeTokenizer } from './code-layers.js';
