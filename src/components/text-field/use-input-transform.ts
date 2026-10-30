'use client';

import { useCallback, useLayoutEffect, useReducer, useRef, type CompositionEvent } from 'react';

type TextControl = HTMLInputElement | HTMLTextAreaElement;

interface InputTransformOptions {
  /** Rewrites the control's text after an edit; without it every edit goes through as typed. */
  transform: ((text: string) => string) | undefined;
  /** The value before the edit: an edit the transform reduces to it changes nothing. */
  value: string;
  /** Takes the edited value. */
  setValue: (value: string) => void;
}

export interface InputTransform {
  /** Publishes the control, whose caret the transform keeps. */
  ref: (node: TextControl | null) => void;
  /** Takes the control's text after each edit. */
  onChange: (text: string) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (event: CompositionEvent<TextControl>) => void;
}

/**
 * Runs each typed, pasted or dropped edit through `transform` before it becomes the value, and puts
 * the caret after the same accepted characters: the transform of the text before the caret. An
 * input method composition goes through untouched and is transformed once it ends.
 */
export function useInputTransform({
  transform,
  value,
  setValue,
}: InputTransformOptions): InputTransform {
  const control = useRef<TextControl | null>(null);
  const isComposing = useRef(false);
  const caret = useRef<number | null>(null);
  // A rewritten edit renders again, even when the value stays, so the caret can be put back.
  const [revision, renderAgain] = useReducer((count: number) => count + 1, 0);

  useLayoutEffect(() => {
    const at = caret.current;
    caret.current = null;
    if (at !== null) control.current?.setSelectionRange(at, at);
  }, [revision]);

  const accept = (text: string) => {
    if (!transform || isComposing.current) {
      setValue(text);
      return;
    }
    const next = transform(text);
    if (next !== text) {
      // Inputs without a caret (such as `email`) report no selection and keep none.
      const end = control.current?.selectionStart;
      if (typeof end === 'number') {
        caret.current = Math.min(next.length, transform(text.slice(0, end)).length);
      }
      renderAgain();
    }
    if (next !== value) setValue(next);
  };

  const ref = useCallback((node: TextControl | null) => {
    control.current = node;
  }, []);

  return {
    ref,
    onChange: accept,
    onCompositionStart: () => {
      isComposing.current = true;
    },
    onCompositionEnd: (event: CompositionEvent<TextControl>) => {
      isComposing.current = false;
      if (transform) accept(event.currentTarget.value);
    },
  };
}
