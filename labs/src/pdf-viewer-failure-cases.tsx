// A case of the PDF viewer lab in which one page fails to draw: the engine is wrapped so the third
// page's first drawing fails, as unsupported content would, and later drawings succeed.

import type * as Pdfjs from 'pdfjs-dist';
import { useState } from 'react';
import { PdfViewer } from '../../src/components/pdf-viewer/pdf-viewer.js';
import { loadEngine, sampleUrl, workerSrc } from './pdf-viewer-cases.js';
import { LabOutput } from './lab-output.js';

type PdfjsDocument = Pdfjs.PDFDocumentProxy;

const failingPageNumber = 3;

/** Makes the first drawing of the failing page reject. */
function failFirstDrawing(document: PdfjsDocument) {
  let failures = 1;
  const getPage = document.getPage.bind(document);
  document.getPage = async (pageNumber) => {
    const page = await getPage(pageNumber);
    if (pageNumber !== failingPageNumber) return page;
    const render = page.render.bind(page);
    page.render = (params) => {
      if (failures === 0) return render(params);
      failures -= 1;
      const failed = {
        promise: Promise.reject(new Error('The page cannot be drawn.')),
        cancel() {},
      };
      return failed as unknown as ReturnType<typeof render>;
    };
    return page;
  };
}

async function loadFailingEngine(): Promise<typeof Pdfjs> {
  const engine = await loadEngine();
  return {
    ...engine,
    getDocument: (params: Parameters<typeof engine.getDocument>[0]) => {
      const task = engine.getDocument(params);
      // Registered before the viewer's own, so the document is wrapped before it reads a page.
      void task.promise.then(failFirstDrawing, () => undefined);
      return task;
    },
  };
}

/** A reader whose third page fails to draw once: the page offers a retry and the others read on. */
export function FailingPage() {
  const [failed, setFailed] = useState<number[]>([]);
  return (
    <div data-lab-case="failing-page">
      <div style={{ width: 340, height: 360 }}>
        <PdfViewer
          aria-label="Report with a failing page"
          source={sampleUrl}
          loadEngine={loadFailingEngine}
          workerSrc={workerSrc}
          onPageError={(pageIndex) => setFailed((pages) => [...pages, pageIndex + 1])}
        />
      </div>
      <LabOutput name="Failed pages">{failed.length ? failed.join(', ') : 'none'}</LabOutput>
    </div>
  );
}
