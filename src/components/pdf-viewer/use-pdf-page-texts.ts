'use client';

import { useEffect, useState } from 'react';
import { mapBounded } from './map-bounded.js';
import { createPageText, type PdfPageText } from './pdf-search.js';
import { type LoadedPdf, pdfRequestLimit } from './use-pdf-document.js';

type TextDocument = Pick<LoadedPdf, 'pages' | 'getTextContent'>;
interface ExtractedTexts {
  loaded: TextDocument;
  texts: PdfPageText[];
  hasError: boolean;
}
const emptyText: PdfPageText = { text: '', starts: [], lengths: [] };

/** Extracts once per document, retaining partial results and failure provenance. */
export function usePdfPageTexts(loaded: TextDocument | null, isNeeded: boolean) {
  const [extracted, setExtracted] = useState<ExtractedTexts | null>(null);
  const result = extracted?.loaded === loaded ? extracted : null;
  useEffect(() => {
    if (!loaded || !isNeeded || result) return undefined;
    let isCancelled = false;
    let hasError = false;
    void mapBounded(
      loaded.pages.length,
      (pageIndex) =>
        loaded.getTextContent(pageIndex).then(createPageText, () => {
          hasError = true;
          return emptyText;
        }),
      { limit: pdfRequestLimit, isCancelled: () => isCancelled },
    ).then((texts) => {
      if (!isCancelled) setExtracted({ loaded, texts, hasError });
    });
    return () => {
      isCancelled = true;
    };
  }, [loaded, isNeeded, result]);
  return result;
}
