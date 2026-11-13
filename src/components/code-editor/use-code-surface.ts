'use client';

import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { splitDataAttributes } from '../../core/hooks.js';
import { joinIds } from '../../utils/join-ids.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useElementSize } from '../../utils/use-element-size.js';
import type { CodeTextAreaProps } from './code-area.js';
import type { CodeDiagnostic } from './code-layers.js';
import { toTextLines } from './code-ranges.js';
import type { CodeSurfaceProps } from './code-surface.js';
import { alignLayers, useCodeEditor } from './use-code-editor.js';
type ProblemOptions = Pick<CodeSurfaceProps, 'diagnostics' | 'listDiagnostics' | 'isInvalid'>;

/** The problems' state: the reported ones, whether one is an error, and what describes the input. */
/** The diagnostics of a surface given none, one list so the layers drawn from it keep. */
const noDiagnostics: readonly CodeDiagnostic[] = [];

/** The diagnostics on the surface's own lines, one list while the given ones stay the same. */
function useLocatedDiagnostics(
  diagnostics: readonly CodeDiagnostic[] | undefined,
  firstLineNumber: number,
) {
  return useMemo(
    () => toTextLines(diagnostics ?? noDiagnostics, firstLineNumber),
    [diagnostics, firstLineNumber],
  );
}

function describeProblems(
  { diagnostics, listDiagnostics = true, isInvalid }: ProblemOptions,
  props: CodeTextAreaProps,
  id: string,
) {
  const shown = diagnostics ?? noDiagnostics;
  const isListed = diagnostics !== undefined && listDiagnostics;
  return {
    shown,
    isListed,
    isInvalid: shown.some(({ severity = 'error' }) => severity === 'error') || Boolean(isInvalid),
    describedBy: joinIds(props['aria-describedby'], isListed && shown.length > 0 && id),
  };
}

function describeSurface(
  props: CodeSurfaceProps,
  { wrap, isInvalid }: { wrap: 'soft' | 'off'; isInvalid: boolean },
) {
  return {
    variant: 'surface',
    language: props.language ?? 'text',
    size: props.size ?? 'md',
    wrap,
    resize: props.multiline === false ? 'none' : (props.resize ?? 'vertical'),
    numbered: props.lineNumbers ?? false,
    singleLine: props.multiline === false,
    invalid: isInvalid,
    readonly: props.isReadOnly ?? false,
    disabled: props.isDisabled ?? false,
  };
}

export function useCodeSurface(configuration: CodeSurfaceProps) {
  const {
    value,
    language: _language,
    onChange,
    tokenize,
    diagnostics,
    listDiagnostics,
    completions,
    renderHover,
    size: _size,
    resize: _resize,
    wrap: wrapOption = 'soft',
    multiline = true,
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
  } = configuration;
  const [dataProps, props] = splitDataAttributes(rest);
  const baseId = useId();
  const diagnosticsId = `${baseId}-diagnostics`;
  const problems = describeProblems(
    { diagnostics, listDiagnostics, isInvalid: isMarkedInvalid },
    props,
    diagnosticsId,
  );
  const { shown, isInvalid } = problems;
  const located = useLocatedDiagnostics(diagnostics, firstLineNumber);
  const isLocked = isReadOnly || isDisabled;
  const wrap = multiline ? wrapOption : 'off';
  const model = useCodeEditor({
    ...{ value, onChange, tokenize, completions, renderHover, indent, indentWithTab, multiline },
    ...{ autoCloseBrackets, allowsSearch, isLocked, diagnostics: located },
  });
  const { layers } = model;
  const inputRef = useMemo(() => mergeRefs(layers.input, ref), [layers.input, ref]);
  const caretRef = useRef<HTMLSpanElement>(null);
  const textWidth = useElementSize(layers.input, {
    box: 'client',
    enabled: lineNumbers || shown.length > 0,
  })?.width;
  const listId = completions ? `${baseId}-completions` : undefined;

  useLayoutEffect(() => alignLayers(layers), [layers, value, wrap, lineNumbers, textWidth]);

  const locks = { isReadOnly, isDisabled, isRequired };
  const data = describeSurface(configuration, { wrap, isInvalid });
  return {
    ...configuration,
    dataProps,
    data,
    model,
    inputRef,
    caretRef,
    textWidth,
    listId,
    problems,
    located,
    locks,
    props,
    baseId,
    wrap,
    multiline,
    diagnosticsId,
    lineNumbers,
    firstLineNumber,
  };
}
