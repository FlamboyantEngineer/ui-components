'use client';

import { useDeferredValue, useId, useLayoutEffect, useMemo, useState } from 'react';
import { getOwnerWindow, getTreeRoot } from '../../utils/owner-window.js';
import { useLatest } from '../../utils/use-latest.js';
import { useFieldFormOwner } from '../field/field.js';
import type { RichTextDocument } from './rich-text-document.js';

/** Replaces the field's temporary entry in place, preserving other controls with the same name. */
function writeDocument(formData: FormData, input: HTMLInputElement, value: RichTextDocument) {
  const entries = [...formData.entries()];
  const index = entries.findIndex(([name, entry]) => name === input.name && entry === input.value);
  if (index < 0) return;
  for (const name of new Set(entries.map(([name]) => name))) formData.delete(name);
  const json = JSON.stringify(value);
  entries.forEach(([name, entry], position) =>
    formData.append(name, position === index ? json : entry),
  );
}

/**
 * Large documents serialize in a deferred render. If a form reads sooner, a unique temporary
 * value identifies this input's entry and the native formdata event supplies the committed JSON.
 */
export function RichTextFormValue({
  name,
  value,
  isDisabled,
}: {
  name: string;
  value: RichTextDocument;
  isDisabled: boolean;
}) {
  const form = useFieldFormOwner();
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const marker = `ui-rich-text-editor-${useId()}`;
  const valueRef = useLatest(value);
  const deferred = useDeferredValue(value);
  const supportsFormData =
    input !== null && typeof getOwnerWindow(input).FormDataEvent === 'function';
  const source = supportsFormData ? deferred : value;
  const json = useMemo(() => JSON.stringify(source), [source]);

  useLayoutEffect(() => {
    if (!input || !supportsFormData) return;
    const root = getTreeRoot(input);
    const read = (event: Event) => {
      if (
        event.target !== input.form ||
        input.value !== marker ||
        input.matches(':disabled') ||
        !('formData' in event)
      )
        return;
      writeDocument((event as FormDataEvent).formData, input, valueRef.current);
    };
    root.addEventListener('formdata', read, true);
    return () => root.removeEventListener('formdata', read, true);
  }, [input, marker, supportsFormData, valueRef]);

  return (
    <input
      ref={setInput}
      type="hidden"
      name={name}
      value={source === value ? json : marker}
      disabled={isDisabled}
      form={form}
    />
  );
}
