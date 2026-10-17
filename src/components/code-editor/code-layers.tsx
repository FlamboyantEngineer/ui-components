import { Fragment, type ReactNode, type Ref } from 'react';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import type { FieldSeverity } from '../field/field.js';

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
  /** Defaults to `error`. */
  severity?: FieldSeverity | undefined;
}

export interface CodeHighlightProps {
  tokens: readonly CodeToken[];
  /** Where to place the caret marker, which anchors the completion list; `null` places none. */
  caret: number | null;
  caretRef: Ref<HTMLSpanElement>;
  highlightRef: Ref<HTMLPreElement>;
}

export interface CodeGutterProps {
  lines: readonly string[];
  /** The worst severity reported on each line, by line number. */
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
  'caret',
  'input',
  'diagnostics',
  'diagnostic',
  'popover',
  'completions',
  'completion',
  'completion-label',
  'completion-description',
]);

const hooks = codeEditorHooks;

/** Source tokens with the caret marker (`null`) placed at `caret`. */
function placeCaret(tokens: readonly CodeToken[], caret: number): Array<CodeToken | null> {
  const parts: Array<CodeToken | null> = [];
  let offset = 0;
  let placed = false;
  for (const token of tokens) {
    const end = offset + token.text.length;
    if (!placed && caret <= end) {
      const cut = caret - offset;
      if (cut > 0) parts.push({ ...token, text: token.text.slice(0, cut) });
      parts.push(null);
      if (cut < token.text.length) parts.push({ ...token, text: token.text.slice(cut) });
      placed = true;
    } else {
      parts.push(token);
    }
    offset = end;
  }
  if (!placed) parts.push(null);
  return parts;
}

function renderToken(token: CodeToken | null, index: number, caretRef: Ref<HTMLSpanElement>) {
  if (token === null) return <span key={index} {...hooks.slot('caret')} ref={caretRef} />;
  if (!token.type) return <Fragment key={index}>{token.text}</Fragment>;
  return (
    <span key={index} {...hooks.slot('token', { token: token.type })}>
      {token.text}
    </span>
  );
}

function formatLocation({ line, column }: CodeDiagnostic): string {
  if (line === undefined) return '';
  return column === undefined ? `${line} ` : `${line}:${column} `;
}

/**
 * The highlighted copy of the source behind the input. A final line break keeps its last line as
 * tall as the input's, so the two scroll to the same extent.
 */
export function CodeHighlight({ tokens, caret, caretRef, highlightRef }: CodeHighlightProps) {
  const parts = caret === null ? tokens : placeCaret(tokens, caret);
  return (
    <pre {...hooks.slot('highlight')} ref={highlightRef} aria-hidden="true">
      {parts.map((token, index) => renderToken(token, index, caretRef))}
      {'\n'}
    </pre>
  );
}

/**
 * Line numbers beside the input. Each row holds a hidden copy of its line, so a wrapped line keeps
 * one number and the rows stay as tall as the lines they number.
 */
export function CodeGutter({ lines, severities, textWidth, gutterRef }: CodeGutterProps) {
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
          <span {...hooks.slot('line-number')}>{index + 1}</span>
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
