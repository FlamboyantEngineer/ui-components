import { type ReactNode, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { PdfViewer, type PdfViewerProps } from '../../src/components/pdf-viewer/pdf-viewer.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { createLongPdf, longSampleMarkedPage } from './pdf-long-sample.js';
import {
  AccentFind,
  AnnotatedReader,
  CallerOwnedFind,
  loadEngine,
  lockedUrl,
  ProjectedToolbar,
  sampleUrl,
  SidebarReader,
  workerSrc,
} from './pdf-viewer-cases.js';
import { FailingPage } from './pdf-viewer-failure-cases.js';
import { ReadingNotes } from './pdf-viewer-reading-cases.js';

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

/** A 250-page report, opened on demand so the rest of the lab loads first; it times the opening. */
function LongDocument() {
  const [source, setSource] = useState<{ bytes: Uint8Array; start: number } | null>(null);
  const [openedIn, setOpenedIn] = useState<number | null>(null);
  return (
    <div data-lab-case="long">
      <Button
        size="sm"
        isDisabled={source !== null}
        onPress={() => setSource({ bytes: createLongPdf(250), start: performance.now() })}
      >
        Open the long report
      </Button>
      <LabOutput name="Opened in">
        {openedIn === null ? '—' : `${Math.round(openedIn)} ms`}
      </LabOutput>
      {source ? (
        <div style={{ height: 480, maxWidth: 720 }}>
          <PdfViewer
            aria-label="Long report"
            source={source.bytes}
            loadEngine={loadEngine}
            workerSrc={workerSrc}
            onDocumentChange={(document) => {
              if (document) setOpenedIn(performance.now() - source.start);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Rendering ahead follows the viewport height while a narrow reader grows or shrinks. */
function ViewportHeight() {
  const [isTall, setTall] = useState(true);
  return (
    <div data-lab-case="viewport-height">
      <Switch isSelected={isTall} onChange={setTall}>
        Tall viewport
      </Switch>
      <Frame height={isTall ? 1100 : 500}>
        <PdfViewer
          aria-label="Report in a resizable viewport"
          source={sampleUrl}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          defaultZoom={100}
        />
      </Frame>
    </div>
  );
}

function Reader() {
  const [zoom, setZoom] = useState<number | null>(null);
  const [shares, setShares] = useState(0);
  const [failedCommand, setFailedCommand] = useState<string | null>(null);
  return (
    <div data-lab-case="reader">
      <p>
        Enter or leave the page field to navigate; Escape restores the current page without moving
        it.
      </p>
      <div style={{ height: 560, maxWidth: 1000 }}>
        <PdfViewer
          aria-label="Seasonal report"
          source={sampleUrl}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          documentOptions={documentOptions}
          onZoomChange={setZoom}
          onCommandError={(command) => setFailedCommand(command)}
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
        <output data-lab-output="shares">{shares}</output>; failed command:{' '}
        <output data-lab-output="failed-command">{failedCommand ?? 'none'}</output>
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

/** A URL made by a same-origin frame's own `URL`, as a host rendering into a popup would pass. */
function frameUrl(): URL {
  const frame = document.body.appendChild(document.createElement('iframe'));
  try {
    const view = frame.contentWindow as Window & typeof globalThis;
    return new view.URL(sampleUrl, document.baseURI);
  } finally {
    frame.remove();
  }
}

function FrameUrlSource() {
  const [source, setSource] = useState<URL | null>(null);
  return (
    <div data-lab-case="frame-url">
      <Button onPress={() => setSource(frameUrl())}>Open a URL from a frame</Button>
      <div style={{ height: 360, maxWidth: 1000 }}>
        <PdfViewer
          aria-label="Report from a frame's URL"
          source={source}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          defaultZoom={50}
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
    <LabSection
      title="Tall and short viewports"
      description="Pages within one viewport height above or below the visible area render ahead. Switch the narrow reader between tall and short viewports to change that distance."
    >
      <ViewportHeight />
    </LabSection>
    <LabSection
      title="Opening zoom"
      description="Fit the page width, fit the whole page, or 50%. Fitting uses the widest and tallest page, including in large documents."
    >
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
      description="Zoom (buttons, slider, Ctrl + wheel, Ctrl + plus (including Shift + equals), minus and 0, pinch (cancelled if the document closes)), fit modes, page navigation (Home, End), find with Enter and Shift + Enter, Ctrl + F and the find options, text selection, links on the first page, rotating, printing and saving from the menu (a failed print or save is reported below the reader), and a caller action at the end of the toolbar. Scrolling follows the current page and zoom keeps the reading position, including in an embedded window. The sample is requested with a header of the caller's."
    >
      <Reader />
    </LabSection>
    <LabSection
      title="Long document"
      description={`A 250-page report built in the lab. The viewer asks for at most 8 pages or page texts at a time, renders only the pages near the view, and finds the word quinceberry on page ${longSampleMarkedPage}.`}
    >
      <LongDocument />
    </LabSection>
    <LabSection
      title="URL from another window"
      description="The button makes the sample's URL with a same-origin frame's own URL constructor, as a host rendering into another window would, and the viewer opens it like any URL. Pressing it again makes a new URL object for the same address, which keeps the open document."
    >
      <FrameUrlSource />
    </LabSection>
    <LabSection
      title="Annotations switched off"
      description="The pages draw without their annotations and links until the switch turns them on."
    >
      <AnnotationsSwitch />
    </LabSection>
    <LabSection
      title="Bytes source, sidebar and destinations"
      description="The bytes are fetched first: the viewer loads while the source is null, then opens its own copy at its second page. The sidebar opens on the outline beside thumbnails, and the buttons go to destinations the document names. Only the latest navigation counts: a destination still being looked up is dropped once the reader follows another one or goes to a page, or the caller asks for the first page."
    >
      <SidebarReader />
    </LabSection>
    <LabSection
      title="Overlays and context menu"
      description="Marks drawn over the pages in page coordinates. Right-click selected text to copy it or mark it (Copy with a host icon, Mark selection with its own), right-click a mark to remove it (an entry without an icon), and reveal a mark from the list. The note field on the first page keeps Home, End and the page keys for its own text."
    >
      <AnnotatedReader />
    </LabSection>
    <LabSection
      title="Following the reader"
      description="The caller reads the last page's text before it renders, drops a pin where the reader clicks a page, keeps the finished selection to note it, and shows the page and offset at the top of the view. Opening the other copy closes the first document's handle."
    >
      <ReadingNotes />
    </LabSection>
    <LabSection
      title="A page that fails to draw"
      description="The third page's first drawing fails, as unsupported content would. Scrolled to, it shows the failure with a retry while the other pages and the page navigation keep working; the retry draws it."
    >
      <FailingPage />
    </LabSection>
    <LabSection
      title="Caller-owned find"
      description="The caller holds the query, the current match and the find options and draws its own find controls in the toolbar: Same case, Any accent, Whole words and Mark every match set the options. Phrases can span text runs, and every occurrence can be highlighted on a page."
    >
      <CallerOwnedFind />
    </LabSection>
    <LabSection
      title="Accents and whole words"
      description="A page built in the lab writes café with a composed accent, with a separate combining accent and without one, beside cafeteria and cafes. The caller's find controls toggle each find option; the table gives the matches each query and option set finds. Mark every match is on by default; off, only the current match is marked."
    >
      <AccentFind />
    </LabSection>
    <LabSection
      title="Toolbar elsewhere"
      description="The toolbar is projected above a contents panel beside the document, with a leading action; the contents set the page and follow the reader, and the other copy of the report opens at that page."
    >
      <ProjectedToolbar />
    </LabSection>
  </>,
);
