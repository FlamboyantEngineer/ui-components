import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { VisuallyHidden } from '../../primitives/index.js';
import { splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { CodeArea, type CodeTextAreaProps } from './code-area.js';
import { CodeCompletionList } from './code-completion.js';
import { CodeHoverTooltip } from './code-hover.js';
import {
  CodeDiagnostics,
  CodeGutter,
  codeEditorHooks as hooks,
  severitiesByLine,
  type CodeDiagnostic,
  type CodeTokenizer,
} from './code-layers.js';
import { CodeSearchPanel } from './code-search.js';
import { toTextLines } from './code-ranges.js';
import type { CodeCompletion } from './completion-match.js';
import type { CodeCompletionSource } from './use-code-completion.js';
import { alignLayers, useCodeEditor, type CodeEditorModel } from './use-code-editor.js';

export type CodeEditorSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `soft` wraps long lines; `off` scrolls them sideways. */
export type CodeEditorWrap = 'soft' | 'off';

export interface CodeEditorProps extends BaseProps, CodeTextAreaProps {
  /** The source text, controlled. */
  value: string;
  onChange?: ((value: string) => void) | undefined;
  /** The language: splits the source into tokens for the highlighted layer. */
  tokenize?: CodeTokenizer | undefined;
  /** Problems to list below the editor, mark in the source and the gutter. An error makes it invalid. */
  diagnostics?: readonly CodeDiagnostic[] | undefined;
  /** Lists the diagnostics below the source. Defaults to `true`; marks and tips stay without it. */
  listDiagnostics?: boolean | undefined;
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
  /** The number of the first line, for an excerpt of a longer text; diagnostics count lines from it. Defaults to 1. */
  firstLineNumber?: number | undefined;
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
  /** Keeps the source readable and selectable but refuses every edit. */
  isReadOnly?: boolean | undefined;
  /** Refuses focus and every edit. */
  isDisabled?: boolean | undefined;
  /** Marks the source invalid, besides an error among the diagnostics. */
  isInvalid?: boolean | undefined;
  /** Reports that the source is required (`aria-required`). */
  isRequired?: boolean | undefined;
  /** The text area. */
  ref?: Ref<HTMLTextAreaElement> | undefined;
}

type ProblemOptions = Pick<CodeEditorProps, 'diagnostics' | 'listDiagnostics' | 'isInvalid'>;

function joinIds(...ids: Array<string | false | undefined>): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
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

/** The problems' state: the reported ones, whether one is an error, and what describes the input. */
function describeProblems(
  { diagnostics, listDiagnostics = true, isInvalid }: ProblemOptions,
  props: CodeTextAreaProps,
  id: string,
) {
  const shown = diagnostics ?? [];
  const isListed = diagnostics !== undefined && listDiagnostics;
  return {
    shown,
    isListed,
    isInvalid: shown.some(({ severity = 'error' }) => severity === 'error') || Boolean(isInvalid),
    describedBy: joinIds(props['aria-describedby'], isListed && shown.length > 0 && id),
  };
}

/** The diagnostics list, when listed, and the status that reads a problem out after F8. */
function CodeProblems(props: {
  id: string;
  diagnostics: readonly CodeDiagnostic[];
  isListed: boolean;
  announcement: string;
}) {
  return (
    <>
      {props.isListed ? <CodeDiagnostics id={props.id} diagnostics={props.diagnostics} /> : null}
      <VisuallyHidden elementType="span" className={hooks.slotClass('announcement')} role="status">
        {props.announcement}
      </VisuallyHidden>
    </>
  );
}

/** What sits around the surface: the problems, the completion list and the hover tip. */
function CodeEditorOverlays(props: {
  model: CodeEditorModel;
  diagnostics: readonly CodeDiagnostic[] | undefined;
  diagnosticsId: string;
  isListed: boolean;
  listId: string | undefined;
  caretRef: RefObject<HTMLSpanElement | null>;
}) {
  const { model, diagnostics, listId } = props;
  return (
    <>
      {diagnostics ? (
        <CodeProblems
          id={props.diagnosticsId}
          diagnostics={diagnostics}
          isListed={props.isListed}
          announcement={model.announcement}
        />
      ) : null}
      {listId ? (
        <CodeCompletionList
          model={model.completion}
          id={listId}
          inputRef={model.layers.input}
          caretRef={props.caretRef}
        />
      ) : null}
      <CodeHoverTooltip model={model.hover} inputRef={model.layers.input} />
    </>
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
  listDiagnostics,
  completions,
  renderHover,
  size = 'md',
  wrap = 'soft',
  lineNumbers = false,
  firstLineNumber = 1,
  toolbar,
  indent,
  indentWithTab,
  autoCloseBrackets,
  allowsSearch,
  isReadOnly = false,
  isDisabled = false,
  isInvalid: isMarkedInvalid,
  isRequired,
  className,
  id,
  ref,
  ...rest
}: CodeEditorProps) {
  const [dataProps, props] = splitDataAttributes(rest);
  const baseId = useId();
  const diagnosticsId = `${baseId}-diagnostics`;
  const problems = describeProblems(
    { diagnostics, listDiagnostics, isInvalid: isMarkedInvalid },
    props,
    diagnosticsId,
  );
  const { shown, isInvalid } = problems;
  const located = toTextLines(shown, firstLineNumber);
  const isLocked = isReadOnly || isDisabled;
  const model = useCodeEditor({
    ...{ value, onChange, tokenize, completions, renderHover, indent, indentWithTab },
    ...{ autoCloseBrackets, allowsSearch, isLocked, diagnostics: located },
  });
  const { layers, search } = model;
  const inputRef = useMergedRef(layers.input, ref);
  const caretRef = useRef<HTMLSpanElement>(null);
  const textWidth = useElementSize(layers.input, { box: 'client', enabled: lineNumbers })?.width;
  const listId = completions ? `${baseId}-completions` : undefined;

  useLayoutEffect(() => alignLayers(layers), [layers, value, wrap, lineNumbers, textWidth]);

  const locks = { isReadOnly, isDisabled, isRequired };
  const states = { invalid: isInvalid, readonly: isReadOnly, disabled: isDisabled };
  const data = { size, wrap, numbered: lineNumbers, ...states };
  return (
    <div {...hooks.root({ className, props: dataProps, data })}>
      {toolbar ? <div {...hooks.slot('toolbar')}>{toolbar}</div> : null}
      {search.isOpen ? <CodeSearchPanel model={search} canReplace={!isLocked} /> : null}
      <div {...hooks.slot('surface')}>
        {lineNumbers ? (
          <CodeGutter
            lines={value.split('\n')}
            firstLineNumber={firstLineNumber}
            severities={severitiesByLine(located)}
            textWidth={textWidth}
            gutterRef={layers.gutter}
          />
        ) : null}
        <CodeArea
          {...{ model, value, onChange, wrap, id, props, locks, inputRef, caretRef, isInvalid }}
          listId={listId}
          describedBy={problems.describedBy}
        />
      </div>
      <CodeEditorOverlays
        {...{ model, diagnostics, diagnosticsId, listId, caretRef }}
        isListed={problems.isListed}
      />
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
