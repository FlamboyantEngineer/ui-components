import type * as Pdfjs from 'pdfjs-dist';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { PdfViewer, type PdfViewerProps } from '../../src/components/pdf-viewer/pdf-viewer.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

// The labs build copies the sample, the engine and its worker next to the bundles
// (scripts/build-labs.mjs); the engine is loaded by URL, as a host would load its own copy.
const sampleUrl = 'build/samples/seasonal-report.pdf';
const workerSrc = 'build/vendor/pdf.worker.min.mjs';
const engineUrl = new URL('build/vendor/pdf.min.mjs', document.baseURI).href;
const loadEngine = () => import(engineUrl) as Promise<typeof Pdfjs>;
const notAPdf = new TextEncoder().encode('This file is not a PDF.');

const states = ['loading', 'ready', 'error'] as const;
const zooms = ['page-width', 'page-fit', '50%'] as const;

const stateSource: Record<(typeof states)[number], PdfViewerProps['source']> = {
  loading: null,
  ready: sampleUrl,
  error: notAPdf,
};

function Frame({ height = 360, children }: { height?: number; children: ReactNode }) {
  return <div style={{ width: 340, height }}>{children}</div>;
}

function Reader() {
  const [zoom, setZoom] = useState<number | null>(null);
  const [downloads, setDownloads] = useState(0);
  return (
    <div data-lab-case="reader">
      <div style={{ height: 560, maxWidth: 820 }}>
        <PdfViewer
          aria-label="Seasonal report"
          source={sampleUrl}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          onZoomChange={setZoom}
          actions={
            <Button size="sm" variant="ghost" onPress={() => setDownloads((count) => count + 1)}>
              Download
            </Button>
          }
        />
      </div>
      <p>
        Applied zoom:{' '}
        <output data-lab-output="zoom">{zoom === null ? '—' : Math.round(zoom)}</output>; downloads:{' '}
        <output data-lab-output="downloads">{downloads}</output>
      </p>
    </div>
  );
}

function BytesSource() {
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  useEffect(() => {
    let isCurrent = true;
    void fetch(sampleUrl)
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        if (isCurrent) setBytes(buffer);
      });
    return () => {
      isCurrent = false;
    };
  }, []);
  return (
    <div data-lab-case="bytes">
      <Frame height={420}>
        <PdfViewer
          aria-label="Report from bytes"
          source={bytes}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          defaultZoom="page-fit"
        />
      </Frame>
    </div>
  );
}

function FailingSource() {
  const [errors, setErrors] = useState<string[]>([]);
  return (
    <Frame>
      <PdfViewer
        aria-label="Broken file"
        source={stateSource.error}
        loadEngine={loadEngine}
        workerSrc={workerSrc}
        onError={(error) => setErrors((entries) => [...entries, error.name])}
      />
      <output data-lab-output="errors">{errors.length}</output>
    </Frame>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="A pending source stays loading; a file the engine cannot open shows the error with a retry."
    >
      <StateMatrix
        axes={{ state: states }}
        render={({ state }) =>
          state === 'error' ? (
            <FailingSource />
          ) : (
            <Frame>
              <PdfViewer
                aria-label={`Report ${state}`}
                source={stateSource[state]}
                loadEngine={loadEngine}
                workerSrc={workerSrc}
              />
            </Frame>
          )
        }
      />
    </LabSection>
    <LabSection title="Opening zoom" description="Fit the page width, fit the whole page, or 50%.">
      <StateMatrix
        axes={{ zoom: zooms }}
        render={({ zoom }) => (
          <Frame>
            <PdfViewer
              aria-label={`Report at ${zoom}`}
              source={sampleUrl}
              loadEngine={loadEngine}
              workerSrc={workerSrc}
              defaultZoom={zoom === '50%' ? 50 : zoom}
            />
          </Frame>
        )}
      />
    </LabSection>
    <LabSection
      title="Reader"
      description="Zoom (buttons, slider, Ctrl + wheel), fit modes, page navigation, find with Enter and Shift + Enter, text selection, and a caller action at the end of the toolbar."
    >
      <Reader />
    </LabSection>
    <LabSection
      title="Bytes source"
      description="The bytes are fetched first: the viewer loads while the source is null, then opens its own copy."
    >
      <BytesSource />
    </LabSection>
  </>,
);
