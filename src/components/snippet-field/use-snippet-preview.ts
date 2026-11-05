'use client';

import { useEffect, useRef, useState } from 'react';
import type { SnippetRequest } from './snippet-request.js';

/** What the host's loader found: the code, or why there is none. */
export type SnippetLoad =
  { ok: true; code: string; language?: string | undefined } | { ok: false; message: string };

/**
 * Loads the code a request names. The field aborts `signal` when the reader asks for another
 * preview, cancels, or the field unmounts; a result after that is ignored.
 */
export type SnippetLoader = (
  request: SnippetRequest,
  options: { signal: AbortSignal },
) => Promise<SnippetLoad>;

/** A preview and the request it is for. */
export type SnippetPreview =
  | { status: 'idle' }
  | { status: 'loading'; request: SnippetRequest }
  | { status: 'ready'; request: SnippetRequest; code: string; language: string | undefined }
  | { status: 'error'; request: SnippetRequest; message: string };

const idle: SnippetPreview = { status: 'idle' };

/**
 * One preview at a time: each load aborts the one before it, and only the latest load's answer,
 * while it is still wanted, becomes the preview. A loader that throws reports its error message.
 */
export function useSnippetPreview(loadSnippet: SnippetLoader) {
  const [preview, setPreview] = useState<SnippetPreview>(idle);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  const drop = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setPreview(idle);
  };
  const load = (request: SnippetRequest) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setPreview({ status: 'loading', request });
    const settle = (next: SnippetPreview) => {
      if (controllerRef.current !== controller || controller.signal.aborted) return;
      controllerRef.current = null;
      setPreview(next);
    };
    loadSnippet(request, { signal: controller.signal }).then(
      (found) =>
        settle(
          found.ok
            ? { status: 'ready', request, code: found.code, language: found.language }
            : { status: 'error', request, message: found.message },
        ),
      (error: unknown) =>
        settle({
          status: 'error',
          request,
          message: error instanceof Error ? error.message : String(error),
        }),
    );
  };
  return { preview, load, drop };
}
