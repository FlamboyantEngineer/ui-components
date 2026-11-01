'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { downloadPdf, printPdf, toPdfFileName } from './pdf-commands.js';
import type { PdfDocument, PdfSource, PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { PdfCommands } from './pdf-viewer-toolbar.js';
import type { LoadedPdf } from './use-pdf-document.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { useLatest } from '../../utils/use-latest.js';

/** A command of the toolbar's menu that can fail: printing or saving the document. */
export type PdfCommandName = 'print' | 'download';

interface UsePdfCommandsOptions<V extends PdfViewport, C extends PdfTextContent> {
  view: LoadedPdf<V, C> | null;
  rotate: PdfCommands['rotate'];
  source: PdfSource | null;
  label: string;
  /** An element of the viewer, whose document prints. */
  scrollerRef: RefObject<HTMLElement | null>;
  onCommandError?: ((command: PdfCommandName, error: Error) => void) | undefined;
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause));
}

/**
 * The pending print: a new print replaces it, and another document or the viewer's unmount
 * cancels it, which releases what it drew. Returns the signal of a new print.
 */
function usePendingPrint(document: PdfDocument<PdfViewport, PdfTextContent> | undefined) {
  const pending = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      pending.current?.abort();
      pending.current = null;
    },
    [document],
  );
  return useMemo(
    () => () => {
      pending.current?.abort();
      const controller = new AbortController();
      pending.current = controller;
      return controller.signal;
    },
    [],
  );
}

/**
 * The commands of the toolbar's menu, on the open document. A print or a save that fails calls
 * `onCommandError`; a print cancelled by a newer one, another document or the unmount does not.
 */
export function usePdfCommands<V extends PdfViewport, C extends PdfTextContent>(
  options: UsePdfCommandsOptions<V, C>,
): PdfCommands {
  const latest = useLatest(options);
  const { rotate } = options;
  const startPrint = usePendingPrint(options.view?.document);
  return useMemo(() => {
    const report = (command: PdfCommandName, signal?: AbortSignal) => (cause: unknown) => {
      if (!signal?.aborted) latest.current.onCommandError?.(command, toError(cause));
    };
    return {
      rotate,
      print() {
        const { view, scrollerRef } = latest.current;
        if (!view) return;
        const signal = startPrint();
        printPdf(view, getOwnerDocument(scrollerRef.current), signal).catch(
          report('print', signal),
        );
      },
      download() {
        const { view, source, label } = latest.current;
        if (view) downloadPdf(view, toPdfFileName(source, label)).catch(report('download'));
      },
    };
  }, [latest, rotate, startPrint]);
}
