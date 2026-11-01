'use client';

import type { ReactNode, Ref, RefObject } from 'react';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { BaseProps, Size } from '../../core/props.js';
import {
  ControlCompletionList,
  type Completion,
  type CompletionSource,
} from '../completion-list/completion-list.js';
import type { CodeLanguage } from './code-languages.js';
import { CodeScrollbars } from './code-scrollbars.js';
import { CodeArea, type CodeTextAreaProps } from './code-area.js';
import { CodeHoverTooltip } from './code-hover.js';
import {
  CodeDiagnostics,
  CodeGutter,
  severitiesByLine,
  type CodeDiagnostic,
  type CodeTokenizer,
} from './code-layers.js';
import { codeEditorHooks as hooks } from './code-editor-hooks.js';
import { CodeSearchPanel } from './code-search.js';
import type { CodeEditorModel } from './use-code-editor.js';
import { useCodeSurface } from './use-code-surface.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

export type CodeEditorSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `soft` wraps long lines; `off` scrolls them sideways. */
export type CodeEditorWrap = 'soft' | 'off';

/** Which way the reader may resize the editing surface: its height, both its sides, or neither. */
export type CodeEditorResize = 'vertical' | 'both' | 'none';

export interface CodeSurfaceProps extends BaseProps, CodeTextAreaProps {
  /** Language identifier published for the stylesheet. */
  language?: CodeLanguage | undefined;
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
  completions?: readonly Completion[] | CompletionSource | undefined;
  /** Information for the hover tip at a source offset, shown with the problems marked there. */
  renderHover?: ((offset: number) => ReactNode) | undefined;
  /** Starting height. Defaults to `md`. */
  size?: CodeEditorSize | undefined;
  /** Defaults to `soft`. */
  wrap?: CodeEditorWrap | undefined;
  /**
   * Which way the reader may resize the editing surface, within the room its container gives it.
   * Defaults to `vertical`; a single-line editor never resizes.
   */
  resize?: CodeEditorResize | undefined;
  /**
   * Edits several lines. Defaults to `true`; `false` keeps the source on one line that never wraps:
   * Enter is left to the caller's `onKeyDown`, and typed or pasted line breaks become spaces.
   */
  multiline?: boolean | undefined;
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
        <ControlCompletionList
          model={model.completion}
          listId={listId}
          anchorRef={props.caretRef}
          className={hooks.slotClass('popover')}
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
function CodeSurfaceBody({ view }: { view: ReturnType<typeof useCodeSurface> }) {
  const {
    model,
    value,
    onChange,
    wrap,
    multiline,
    id,
    props,
    locks,
    inputRef,
    caretRef,
    baseId,
    problems,
    located,
    lineNumbers,
    firstLineNumber,
    textWidth,
    listId,
  } = view;
  const { layers } = model;
  return (
    <div {...hooks.slot('surface')}>
      {lineNumbers || located.length > 0 ? (
        <CodeGutter
          measurement={!lineNumbers}
          lines={value.split('\n')}
          firstLineNumber={firstLineNumber}
          severities={severitiesByLine(located)}
          textWidth={textWidth}
          gutterRef={layers.gutter}
        />
      ) : null}
      <CodeArea
        {...{ model, value, onChange, wrap, multiline, props, locks, inputRef, caretRef }}
        id={id ?? baseId}
        isInvalid={problems.isInvalid}
        listId={listId}
        describedBy={problems.describedBy}
      />
      {multiline ? (
        <CodeScrollbars
          input={layers.input}
          gutter={layers.gutter}
          inputId={id ?? baseId}
          diagnostics={located}
          value={value}
          wrap={wrap}
        />
      ) : null}
    </div>
  );
}

/** Native textarea editing with highlighted layers, diagnostics and custom scrollbars. */
export function CodeSurface(props: CodeSurfaceProps) {
  const view = useCodeSurface(props);
  const { model, toolbar, diagnostics, diagnosticsId, listId, caretRef, problems } = view;
  return (
    <div {...hooks.root({ className: view.className, props: view.dataProps, data: view.data })}>
      {isEmptyNode(toolbar) ? null : <div {...hooks.slot('toolbar')}>{toolbar}</div>}
      {model.search.isOpen ? (
        <CodeSearchPanel
          model={model.search}
          canReplace={!view.locks.isReadOnly && !view.locks.isDisabled}
        />
      ) : null}
      <CodeSurfaceBody view={view} />
      <CodeEditorOverlays
        {...{ model, diagnostics, diagnosticsId, listId, caretRef }}
        isListed={problems.isListed}
      />
    </div>
  );
}

export type { CodeDiagnostic, CodeToken, CodeTokenizer } from './code-layers.js';
