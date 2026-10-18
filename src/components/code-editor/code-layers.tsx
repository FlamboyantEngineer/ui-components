import { Fragment, type ReactNode, type Ref } from 'react';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import type { FieldSeverity } from '../field/field.js';
import type { CodeSegment } from './code-segments.js';

/** A run of source text. `type` names its kind (`keyword`, `string`, …) for the stylesheet. */
export interface CodeToken {
  text: string;
  type?: string | null | undefined;
}

/** Splits source into tokens that cover it exactly, in order. */
export type CodeTokenizer = (source: string) => readonly CodeToken[];

/** A problem in the source, at a line and column counted from 1 when known. */
export interface CodeDiagnostic {
  message: string;
  line?: number | undefined;
  column?: number | undefined;
  /** Where the marked range ends, counted from 1 and exclusive. Defaults to `line`. */
  endLine?: number | undefined;
  /** Where the marked range ends, counted from 1 and exclusive. Without it the word at `column` is marked. */
  endColumn?: number | undefined;
  /** Defaults to `error`. */
  severity?: FieldSeverity | undefined;
}

export interface CodeHighlightProps {
  /** The tokens cut at the decorations, with the caret marker (`null`) that anchors popovers. */
  segments: ReadonlyArray<CodeSegment | null>;
  caretRef: Ref<HTMLSpanElement>;
  highlightRef: Ref<HTMLPreElement>;
}

export interface CodeGutterProps {
  lines: readonly string[];
  /** The number of the first row. */
  firstLineNumber: number;
  /** The worst severity reported on each line, by line counted from 1 at the text's start. */
  severities: ReadonlyMap<number, FieldSeverity>;
  /** The input's text width, so each hidden line copy wraps where the input wraps. */
  textWidth: number | undefined;
  gutterRef: Ref<HTMLDivElement>;
}

export interface CodeDiagnosticsProps {
  id: string;
  diagnostics: readonly CodeDiagnostic[];
}

export const codeEditorHooks = createHooks('code-editor', [
  'toolbar',
  'surface',
  'gutter',
  'line',
  'line-number',
  'line-text',
  'code',
  'highlight',
  'token',
  'mark',
  'match',
  'bracket',
  'caret',
  'input',
  'diagnostics',
  'diagnostic',
  'announcement',
  'tooltip',
  'popover',
  'completions',
  'completion',
  'completion-label',
  'completion-description',
  'completion-documentation',
  'search',
]);

const hooks = codeEditorHooks;

function renderSegment(segment: CodeSegment | null, index: number, caretRef: Ref<HTMLSpanElement>) {
  if (segment === null) return <span key={index} {...hooks.slot('caret')} ref={caretRef} />;
  const { text, type, severity, match, bracket } = segment;
  let node: ReactNode = type ? <span {...hooks.slot('token', { token: type })}>{text}</span> : text;
  if (bracket)
    node = <span {...hooks.slot('bracket', { unmatched: bracket.isUnmatched })}>{node}</span>;
  if (match) node = <span {...hooks.slot('match', { current: match.isCurrent })}>{node}</span>;
  if (severity) node = <span {...hooks.slot('mark', { severity })}>{node}</span>;
  return <Fragment key={index}>{node}</Fragment>;
}

function formatLocation({ line, column }: CodeDiagnostic): string {
  if (line === undefined) return '';
  return column === undefined ? `${line} ` : `${line}:${column} `;
}

/**
 * The highlighted copy of the source behind the input. A final line break keeps its last line as
 * tall as the input's, so the two scroll to the same extent.
 */
export function CodeHighlight({ segments, caretRef, highlightRef }: CodeHighlightProps) {
  return (
    <pre {...hooks.slot('highlight')} ref={highlightRef} aria-hidden="true">
      {segments.map((segment, index) => renderSegment(segment, index, caretRef))}
      {'\n'}
    </pre>
  );
}

/**
 * Line numbers beside the input. Each row holds a hidden copy of its line, so a wrapped line keeps
 * one number and the rows stay as tall as the lines they number.
 */
export function CodeGutter({
  lines,
  firstLineNumber,
  severities,
  textWidth,
  gutterRef,
}: CodeGutterProps) {
  return (
    <div
      {...hooks.slot('gutter')}
      ref={gutterRef}
      aria-hidden="true"
      style={
        textWidth === undefined ? undefined : measuredProperty('code-editor-text-width', textWidth)
      }
    >
      {lines.map((line, index) => (
        <div key={index} {...hooks.slot('line', { severity: severities.get(index + 1) })}>
          <span {...hooks.slot('line-number')}>{index + firstLineNumber}</span>
          <span {...hooks.slot('line-text')}>{line || '​'}</span>
        </div>
      ))}
    </div>
  );
}

/** The worst severity on each line that a diagnostic points at. */
export function severitiesByLine(
  diagnostics: readonly CodeDiagnostic[],
): Map<number, FieldSeverity> {
  const lines = new Map<number, FieldSeverity>();
  for (const { line, severity = 'error' } of diagnostics) {
    if (line === undefined || lines.get(line) === 'error') continue;
    lines.set(line, severity);
  }
  return lines;
}

/** The diagnostics list. It stays in the document so new diagnostics are announced politely. */
export function CodeDiagnostics({ id, diagnostics }: CodeDiagnosticsProps): ReactNode {
  return (
    <ul {...hooks.slot('diagnostics')} id={id} aria-live="polite">
      {diagnostics.map((diagnostic, index) => (
        <li key={index} {...hooks.slot('diagnostic', { severity: diagnostic.severity ?? 'error' })}>
          {formatLocation(diagnostic)}
          {diagnostic.message}
        </li>
      ))}
    </ul>
  );
}
