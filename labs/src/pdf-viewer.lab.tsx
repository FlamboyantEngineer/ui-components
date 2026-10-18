import { useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { PdfViewer, type PdfViewerProps } from '../../src/components/pdf-viewer/pdf-viewer.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  AnnotatedReader,
  CallerOwnedFind,
  ProjectedToolbar,
  SidebarReader,
  loadEngine,
  lockedUrl,
  sampleUrl,
  workerSrc,
} from './pdf-viewer-cases.js';

const notAPdf = new TextEncoder().encode('This file is not a PDF.');

const states = ['loading', 'ready', 'error', 'locked'] as const;
const zooms = ['page-width', 'page-fit', '50%'] as const;

const stateSource: Record<(typeof states)[number], PdfViewerProps['source']> = {
  loading: null,
  ready: sampleUrl,
  error: notAPdf,
  locked: lockedUrl,
};

function Frame({ height = 360, children }: { height?: number; children: ReactNode }) {
  return <div style={{ width: 340, height }}>{children}</div>;
}

// Sent with the sample's requests, as a host would send its credentials.
const documentOptions = { httpHeaders: { 'X-Lab-Sample': 'seasonal-report' } };

function Reader() {
  const [zoom, setZoom] = useState<number | null>(null);
  const [shares, setShares] = useState(0);
  return (
    <div data-lab-case="reader">
      <div style={{ height: 560, maxWidth: 1000 }}>
        <PdfViewer
          aria-label="Seasonal report"
          source={sampleUrl}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          documentOptions={documentOptions}
          onZoomChange={setZoom}
          actions={
            <Button size="sm" variant="ghost" onPress={() => setShares((count) => count + 1)}>
              Share
            </Button>
          }
        />
      </div>
      <p>
        Applied zoom:{' '}
        <output data-lab-output="zoom">{zoom === null ? '—' : Math.round(zoom)}</output>; shares:{' '}
        <output data-lab-output="shares">{shares}</output>
      </p>
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

/** A reader whose annotations and links a switch turns on and off; they start off. */
function AnnotationsSwitch() {
  const [showAnnotations, setShowAnnotations] = useState(false);
  return (
    <div data-lab-case="annotations">
      <Switch isSelected={showAnnotations} onChange={setShowAnnotations}>
        Show annotations
      </Switch>
      <div style={{ height: 420, maxWidth: 1000 }}>
        <PdfViewer
          aria-label="Report without annotations"
          source={sampleUrl}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          defaultZoom={100}
          showAnnotations={showAnnotations}
        />
      </div>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="A pending source stays loading; a file the engine cannot open shows the error with a retry; a protected file asks for its password (orchard)."
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
      description="Zoom (buttons, slider, Ctrl + wheel, Ctrl + plus, minus and 0, pinch), fit modes, page navigation (Home, End), find with Enter and Shift + Enter, Ctrl + F and the find options, text selection, links on the first page, rotating, printing and saving from the menu, and a caller action at the end of the toolbar. The sample is requested with a header of the caller's."
    >
      <Reader />
    </LabSection>
    <LabSection
      title="Annotations switched off"
      description="The pages draw without their annotations and links until the switch turns them on."
    >
      <AnnotationsSwitch />
    </LabSection>
    <LabSection
      title="Bytes source, sidebar and destinations"
      description="The bytes are fetched first: the viewer loads while the source is null, then opens its own copy at its second page. The sidebar opens on the outline beside thumbnails, and the buttons go to destinations the document names."
    >
      <SidebarReader />
    </LabSection>
    <LabSection
      title="Overlays and context menu"
      description="Marks drawn over the pages in page coordinates. Right-click selected text to copy it or mark it, right-click a mark to remove it, and reveal a mark from the list."
    >
      <AnnotatedReader />
    </LabSection>
    <LabSection
      title="Caller-owned find"
      description="The caller holds the query and the current match and draws its own find controls in the toolbar."
    >
      <CallerOwnedFind />
    </LabSection>
    <LabSection
      title="Toolbar elsewhere"
      description="The toolbar is projected above a contents panel beside the document, with a leading action; the contents set the page and follow the reader."
    >
      <ProjectedToolbar />
    </LabSection>
  </>,
);
