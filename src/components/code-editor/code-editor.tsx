import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import {
  TextArea,
  VisuallyHidden,
  type TextAreaProps as AriaTextAreaProps,
} from 'react-aria-components';
import { splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { CodeCompletionList } from './code-completion.js';
import { CodeHoverTooltip } from './code-hover.js';
import {
  CodeDiagnostics,
  CodeGutter,
  CodeHighlight,
  codeEditorHooks as hooks,
  severitiesByLine,
  type CodeDiagnostic,
  type CodeTokenizer,
} from './code-layers.js';
import { CodeSearchPanel } from './code-search.js';
import type { CodeCompletion } from './completion-match.js';
import type { CodeCompletionSource } from './use-code-completion.js';
import { alignLayers, useCodeEditor, type CodeEditorModel } from './use-code-editor.js';

export type CodeEditorSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `soft` wraps long lines; `off` scrolls them sideways. */
export type CodeEditorWrap = 'soft' | 'off';

export interface CodeEditorProps extends TextAreaPassThrough, BaseProps {
  /** The source text, controlled. */
  value: string;
  onChange?: ((value: string) => void) | undefined;
  /** The language: splits the source into tokens for the highlighted layer. */
  tokenize?: CodeTokenizer | undefined;
  /** Problems to list below the editor, mark in the source and the gutter. An error makes it invalid. */
  diagnostics?: readonly CodeDiagnostic[] | undefined;
  /** A vocabulary for the word before the caret, or a source that completes the place at the caret. */
  completions?: readonly CodeCompletion[] | CodeCompletionSource | undefined;
  /** Information for the hover tip at a source offset, shown with the problems marked there. */
  renderHover?: ((offset: number) => ReactNode) | undefined;
  /** Starting height. Defaults to `md`. */
  size?: CodeEditorSize | undefined;
  /** Defaults to `soft`. */
  wrap?: CodeEditorWrap | undefined;
  /** Numbers the source lines in a gutter. */
  lineNumbers?: boolean | undefined;
  /** Tools shown in a row above the source, such as a label, a count or a format button. */
  toolbar?: ReactNode;
  /** Spaces per indentation level, for Tab, Shift+Tab and Enter. Defaults to 2. */
  indent?: number | undefined;
  /** Tab and Shift+Tab indent and outdent instead of moving focus; Escape then Tab leaves. */
  indentWithTab?: boolean | undefined;
  /** Typing an opening bracket or quote inserts its partner, and typing the partner steps over it. */
  autoCloseBrackets?: boolean | undefined;
  /** Ctrl+F or Cmd+F opens a find and replace row above the source. */
  allowsSearch?: boolean | undefined;
  /** The text area. */
  ref?: Ref<HTMLTextAreaElement> | undefined;
}

type TextAreaPassThrough = Omit<
  AriaTextAreaProps,
  'className' | 'style' | 'render' | 'children' | 'value' | 'defaultValue' | 'onChange' | 'wrap'
>;

interface CodeAreaProps {
  model: CodeEditorModel;
  value: string;
  onChange: ((value: string) => void) | undefined;
  wrap: CodeEditorWrap;
  id: string | undefined;
  /** The caller's text area props, without data attributes. */
  props: TextAreaPassThrough;
  inputRef: Ref<HTMLTextAreaElement>;
  caretRef: RefObject<HTMLSpanElement | null>;
  isInvalid: boolean;
  describedBy: string | undefined;
  /** The completion list's id, when the editor offers completions. */
  listId: string | undefined;
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
function toCompletionProps({ completion }: CodeEditorModel, listId: string): AriaTextAreaProps {
  return {
    'aria-autocomplete': 'list',
    'aria-haspopup': 'listbox',
    'aria-controls': completion.isOpen ? listId : undefined,
    'aria-activedescendant': completion.isOpen ? `${listId}-${completion.activeIndex}` : undefined,
  };
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

/** The text area's keys: the completion list, the snippet fields, the editing keys, then the caller's. */
function useKeyProps(model: CodeEditorModel, props: TextAreaPassThrough): AriaTextAreaProps {
  const { completion, snippet, hover } = model;
  return {
    onKeyDown: (event) => {
      if (completion.handleKeyDown(event) || snippet.handleKeyDown(event)) return;
      if (event.key === 'Escape' && hover.tip) hover.close();
      if (!model.handleKeyDown(event)) props.onKeyDown?.(event);
    },
    onKeyUp: (event) => {
      completion.handleKeyUp(event);
      props.onKeyUp?.(event);
    },
  };
}

/** The text area's props: the caller's, with the editor's handlers run first. */
function useInputProps(
  model: CodeEditorModel,
  { props, onChange }: Pick<CodeAreaProps, 'props' | 'onChange'>,
): AriaTextAreaProps {
  const { layers, completion, hover, snippet } = model;
  return {
    spellCheck: false,
    autoComplete: 'off',
    autoCapitalize: 'off',
    autoCorrect: 'off',
    ...props,
    ...useKeyProps(model, props),
    onChange: (event) => {
      onChange?.(event.target.value);
      hover.close();
      completion.track('input');
    },
    onClick: (event) => {
      completion.track('move');
      props.onClick?.(event);
    },
    onSelect: (event) => {
      const input = event.currentTarget;
      model.setCaret(input.selectionStart === input.selectionEnd ? input.selectionStart : null);
      props.onSelect?.(event);
    },
    onBlur: (event) => {
      completion.close();
      hover.close();
      snippet.end();
      model.setCaret(null);
      props.onBlur?.(event);
    },
    onScroll: (event) => {
      alignLayers(layers);
      if (completion.isOpen) completion.reposition();
      props.onScroll?.(event);
    },
    onPointerMove: (event) => {
      hover.onPointerMove(event);
      props.onPointerMove?.(event);
    },
    onPointerLeave: (event) => {
      hover.onPointerLeave();
      props.onPointerLeave?.(event);
    },
  };
}

/** The diagnostics list and the status that reads a problem out after F8. */
function CodeProblems(props: {
  id: string;
  diagnostics: readonly CodeDiagnostic[];
  announcement: string;
}) {
  return (
    <>
      <CodeDiagnostics id={props.id} diagnostics={props.diagnostics} />
      <VisuallyHidden elementType="span" className={hooks.slotClass('announcement')} role="status">
        {props.announcement}
      </VisuallyHidden>
    </>
  );
}

/** The highlighted copy and the text area over it. */
function CodeArea({ model, props, onChange, ...area }: CodeAreaProps) {
  const inputProps = useInputProps(model, { props, onChange });
  const { listId } = area;
  return (
    <div {...hooks.slot('code')}>
      <CodeHighlight
        segments={model.segments}
        caretRef={area.caretRef}
        highlightRef={model.layers.highlight}
      />
      <TextArea
        {...inputProps}
        {...hooks.slot('input')}
        id={area.id}
        ref={area.inputRef}
        value={area.value}
        wrap={area.wrap}
        aria-invalid={area.isInvalid || undefined}
        aria-describedby={area.describedBy}
        {...(listId === undefined ? {} : toCompletionProps(model, listId))}
      />
    </div>
  );
}

/**
 * A code editing surface: a native text area over a highlighted copy of the source, so the browser
 * keeps the caret, selection, undo and input methods. The language (tokens), the diagnostics and
 * the completions come from the caller. It can indent with Tab, pair brackets, match the bracket at
 * the caret, mark problems with hover tips, find and replace, number lines and show a toolbar row.
 */
export function CodeEditor({
  value,
  onChange,
  tokenize,
  diagnostics,
  completions,
  renderHover,
  size = 'md',
  wrap = 'soft',
  lineNumbers = false,
  toolbar,
  indent,
  indentWithTab,
  autoCloseBrackets,
  allowsSearch,
  className,
  id,
  ref,
  ...rest
}: CodeEditorProps) {
  const [dataProps, props] = splitDataAttributes(rest);
  const baseId = useId();
  const shown = diagnostics ?? [];
  const isLocked = Boolean(props.readOnly || props.disabled);
  const model = useCodeEditor({
    ...{ value, onChange, tokenize, completions, renderHover, indent, indentWithTab },
    ...{ autoCloseBrackets, allowsSearch, isLocked, diagnostics: shown },
  });
  const { layers, completion, search } = model;
  const inputRef = useMergedRef(layers.input, ref);
  const caretRef = useRef<HTMLSpanElement>(null);
  const textWidth = useElementSize(layers.input, { box: 'client', enabled: lineNumbers })?.width;
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
      {search.isOpen ? <CodeSearchPanel model={search} canReplace={!isLocked} /> : null}
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
          {...{ model, value, onChange, wrap, id, props, inputRef, caretRef, isInvalid, listId }}
          describedBy={joinIds(props['aria-describedby'], shown.length > 0 && diagnosticsId)}
        />
      </div>
      {diagnostics ? (
        <CodeProblems
          id={diagnosticsId}
          diagnostics={diagnostics}
          announcement={model.announcement}
        />
      ) : null}
      {listId ? (
        <CodeCompletionList
          model={completion}
          id={listId}
          inputRef={layers.input}
          caretRef={caretRef}
        />
      ) : null}
      <CodeHoverTooltip model={model.hover} inputRef={layers.input} />
    </div>
  );
}

export type { CodeCompletion } from './completion-match.js';

export type {
  CodeCompletionAnswer,
  CodeCompletionContext,
  CodeCompletionResult,
  CodeCompletionSource,
} from './use-code-completion.js';

export type { CodeDiagnostic, CodeToken, CodeTokenizer } from './code-layers.js';
