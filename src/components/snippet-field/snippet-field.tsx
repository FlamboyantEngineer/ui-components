'use client';

import { useId, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Input } from '../../primitives/index.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { Button } from '../button/button.js';
import type { CodeTokenizer } from '../code-editor/code-editor.js';
import {
  Field,
  type FieldControlProps,
  type FieldInputProps,
  type FieldTextInputProps,
  useFieldControl,
} from '../field/field.js';
import { snippetFieldHooks as hooks } from './snippet-field-hooks.js';
import { SnippetPreviewPanel, SnippetSaved } from './snippet-field-parts.js';
import {
  isSameSnippetRequest,
  readSnippetLines,
  type SnippetLines,
  toSnippetLinesText,
} from './snippet-request.js';
import { type SnippetLoader, useSnippetPreview } from './use-snippet-preview.js';

/** A saved snippet: where it comes from, and the code it held when it was saved. */
export interface SnippetFieldValue {
  /** The address of the source, as the host names it, such as a path or a URL. */
  source: string;
  /** The lines taken, or `null` for the whole source. */
  lines: SnippetLines | null;
  /** The code as saved. */
  code: string;
  /** The code's language, such as `ts`, as the loader reported it. */
  language?: string | undefined;
}

export interface SnippetFieldProps
  extends FieldInputProps<SnippetFieldValue | null>, Pick<FieldTextInputProps, 'placeholder'> {
  /** Loads the code a source and lines name; the host fetches, authorizes and checks the source. */
  loadSnippet: SnippetLoader;
  /** Splits code into typed tokens for highlighting. */
  tokenize?: CodeTokenizer | undefined;
}

interface SnippetDraft {
  /** The saved value the draft started from: a new saved value starts a new draft. */
  from: SnippetFieldValue | null;
  source: string;
  start: string;
  end: string;
}

function toDraft(value: SnippetFieldValue | null): SnippetDraft {
  return { from: value, source: value?.source ?? '', ...toSnippetLinesText(value?.lines ?? null) };
}

/** The reader's source and lines, started again from the saved value whenever it changes. */
function useSnippetDraft(value: SnippetFieldValue | null) {
  const [draft, setDraft] = useState(() => toDraft(value));
  const current = draft.from === value ? draft : toDraft(value);
  if (current !== draft) setDraft(current);
  return [current, (next: Partial<SnippetDraft>) => setDraft({ ...current, ...next })] as const;
}

/** The field's state, draft, preview and the actions on them. */
function useSnippetField(props: SnippetFieldProps) {
  const sourceRef = useRef<HTMLInputElement>(null);
  const { state, field, rest } = useFieldControl<SnippetFieldValue | null, SnippetFieldProps>(
    props,
    { initialValue: null, emptyValue: null, isEmpty: (value) => value === null },
  );
  const [draft, setDraft] = useSnippetDraft(state.value);
  const { preview, load, drop } = useSnippetPreview(rest.loadSnippet);
  const read = readSnippetLines(draft.start, draft.end);
  const request = read.ok ? { source: draft.source.trim(), lines: read.lines } : null;
  // A preview shows only while it answers what the reader asks now.
  const shown =
    preview.status !== 'idle' && request && isSameSnippetRequest(preview.request, request)
      ? preview
      : null;
  const saved = state.value;
  const isSavedRequest = Boolean(shown && saved && isSameSnippetRequest(shown.request, saved));
  const isUnchanged = shown?.status === 'ready' && isSavedRequest && shown.code === saved?.code;
  const finish = () => {
    drop();
    sourceRef.current?.focus();
  };
  return {
    state,
    field,
    rest,
    sourceRef,
    draft,
    read,
    request,
    shown,
    isUnchanged,
    isStale: shown?.status === 'ready' && isSavedRequest && !isUnchanged,
    edit: (next: Partial<SnippetDraft>) => {
      drop();
      setDraft(next);
    },
    load,
    apply: () => {
      if (shown?.status !== 'ready') return;
      state.setValue({ ...shown.request, code: shown.code, language: shown.language });
      state.commit();
      finish();
    },
    cancel: () => {
      setDraft(toDraft(saved));
      finish();
    },
  };
}

/** The source, first-line and last-line inputs, the Preview button, and a range problem. */
function SnippetRequestInputs({
  model,
  control,
}: {
  model: ReturnType<typeof useSnippetField>;
  control: FieldControlProps;
}) {
  const strings = useUiStrings();
  const rangeErrorId = useId();
  const { state, draft, read, request, edit } = model;
  const setSourceRef = useMergedRefs(model.sourceRef, control.ref);
  const rangeError = read.ok
    ? null
    : read.reason === 'order'
      ? strings.snippetRangeOrder
      : strings.snippetRangeIncomplete;
  return (
    <>
      <div {...hooks.slot('request')}>
        <Input
          ref={setSourceRef}
          {...hooks.slot('source')}
          id={control.id}
          aria-labelledby={control['aria-labelledby']}
          aria-label={control['aria-label']}
          aria-describedby={control['aria-describedby']}
          aria-invalid={control['aria-invalid']}
          aria-required={control['aria-required']}
          readOnly={control.readOnly}
          disabled={control.disabled}
          placeholder={model.rest.placeholder}
          value={draft.source}
          onChange={(event) => edit({ source: event.target.value })}
        />
        {(['start', 'end'] as const).map((end) => (
          <Input
            key={end}
            {...hooks.slot('line')}
            aria-label={end === 'start' ? strings.snippetStartLine : strings.snippetEndLine}
            aria-invalid={rangeError ? true : undefined}
            aria-describedby={rangeError ? rangeErrorId : undefined}
            inputMode="numeric"
            readOnly={control.readOnly}
            disabled={control.disabled}
            value={draft[end]}
            onChange={(event) => edit({ [end]: event.target.value })}
          />
        ))}
        {state.isReadOnly ? null : (
          <Button
            className={hooks.slotClass('preview-button')}
            size="sm"
            isDisabled={state.isDisabled || !request || request.source === ''}
            onPress={() => {
              if (request) model.load(request);
            }}
          >
            {strings.snippetPreview}
          </Button>
        )}
      </div>
      {rangeError ? (
        <span {...hooks.slot('range-error')} id={rangeErrorId}>
          {rangeError}
        </span>
      ) : null}
    </>
  );
}

/**
 * A field holding a code snippet taken from a source: the reader names the source and, optionally,
 * its first and last lines, previews what the host's `loadSnippet` finds there, and saves it with
 * Apply. The saved code changes only through Apply, so a failed, late or stale preview never
 * overwrites it; previewing the saved source again shows whether it changed, and Update saves it.
 */
export function SnippetField(props: SnippetFieldProps) {
  const model = useSnippetField(props);
  const { state, field, shown } = model;
  return (
    <Field
      state={state}
      {...field}
      {...hooks.root({
        className: field.className,
        data: { status: shown?.status ?? null, stale: model.isStale },
      })}
    >
      {(control) => (
        <>
          <SnippetRequestInputs model={model} control={control} />
          <SnippetSaved value={state.value} tokenize={model.rest.tokenize} />
          {shown ? (
            <SnippetPreviewPanel
              preview={shown}
              isUnchanged={model.isUnchanged}
              isStale={model.isStale}
              isDisabled={state.isDisabled || state.isReadOnly}
              tokenize={model.rest.tokenize}
              onApply={model.apply}
              onCancel={model.cancel}
            />
          ) : null}
        </>
      )}
    </Field>
  );
}
