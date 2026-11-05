// Cases of the PDF viewer lab in which the caller adds to the viewer: content over the pages, menu
// entries, navigation, find and toolbar placement. Lab-only presentation is inline.

import type * as Pdfjs from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  findBoxAtPoint,
  type PdfPagePoint,
  type PdfPageRect,
  type PdfSearchControls,
  type PdfSearchOptions,
  type PdfSelection,
  PdfViewer,
} from '../../src/components/pdf-viewer/pdf-viewer.js';
import {
  ProjectionOutlet,
  ProjectionProvider,
} from '../../src/components/projection/projection.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { CopyGlyph, EditGlyph } from '../../src/core/glyphs.js';
import { LabOutput } from './lab-output.js';
import { createAccentPdf } from './pdf-accent-sample.js';

// The labs build copies the sample, the engine and its worker next to the bundles
// (scripts/build-labs.mjs); the engine is loaded by URL, as a host would load its own copy.
export const sampleUrl = 'build/samples/seasonal-report.pdf';
/** The same sample behind the password `orchard`. */
export const lockedUrl = 'build/samples/seasonal-report-locked.pdf';
export const workerSrc = 'build/vendor/pdf.worker.min.mjs';
/** The same sample at another address, so a viewer opens it as a new document. */
export const otherCopyUrl = `${sampleUrl}?copy=2`;
const engineUrl = new URL('build/vendor/pdf.min.mjs', document.baseURI).href;
export const loadEngine = () => import(engineUrl) as Promise<typeof Pdfjs>;

interface Mark extends PdfPageRect {
  id: string;
  label: string;
}

const presetMarks: readonly Mark[] = [
  {
    id: 'heading',
    label: 'Markets heading',
    pageIndex: 2,
    left: 44,
    top: 56,
    width: 92,
    height: 26,
  },
];

const contents = ['Seasonal Report', 'Varieties', 'Markets'];

function MarkBox({ mark, scale }: { mark: Mark; scale: number }) {
  return (
    <div
      data-lab-mark={mark.id}
      style={{
        position: 'absolute',
        left: mark.left * scale,
        top: mark.top * scale,
        width: mark.width * scale,
        height: mark.height * scale,
        boxSizing: 'border-box',
        border: '2px solid rgb(0 140 100)',
        borderRadius: 3,
        background: 'rgb(0 160 120 / 0.18)',
      }}
    />
  );
}

/** A note field drawn over the first page: Home, End and the page keys edit it, not the document. */
function PageNote({ scale }: { scale: number }) {
  return (
    <input
      aria-label="Page note"
      defaultValue="Check the harvest totals"
      style={{ position: 'absolute', left: 44 * scale, top: 120 * scale, pointerEvents: 'auto' }}
    />
  );
}

/** Marks drawn over the pages, made from a selection's menu, removed from a mark's menu, revealed. */
export function AnnotatedReader() {
  const [marks, setMarks] = useState<readonly Mark[]>(presetMarks);
  const [revealRect, setRevealRect] = useState<PdfPageRect | null>(null);
  const [rendered, setRendered] = useState<readonly number[]>([]);
  const count = useRef(0);
  const addMark = ({ pageIndex, rect, text }: PdfSelection) => {
    count.current += 1;
    const mark = { id: `mark-${count.current}`, label: text.trim(), pageIndex, ...rect };
    setMarks((list) => [...list, mark]);
  };
  const getPageMenuItems = ({ pageIndex, point }: PdfPagePoint) => {
    const mark = findBoxAtPoint(
      marks.filter((entry) => entry.pageIndex === pageIndex),
      point,
    );
    if (!mark) return [];
    const remove = () => setMarks((list) => list.filter((entry) => entry !== mark));
    return [{ id: 'remove', label: 'Remove mark', onAction: remove }];
  };
  return (
    <div data-lab-case="annotated">
      <div style={{ height: 480, maxWidth: 1000 }}>
        <PdfViewer
          aria-label="Annotated report"
          source={sampleUrl}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          revealRect={revealRect}
          // A reader who moves on may ask for the same mark again.
          onPageChange={() => setRevealRect(null)}
          onPageViewports={(viewports) => setRendered([...viewports.keys()])}
          renderPageOverlay={({ pageIndex, viewport }) => (
            <>
              {marks
                .filter((mark) => mark.pageIndex === pageIndex)
                .map((mark) => (
                  <MarkBox key={mark.id} mark={mark} scale={viewport.scale} />
                ))}
              {pageIndex === 0 ? <PageNote scale={viewport.scale} /> : null}
            </>
          )}
          // Copy takes a host icon (none by default), Mark selection brings its own.
          menuIcons={{ copy: CopyGlyph }}
          getSelectionMenuItems={(selection) => [
            {
              id: 'mark',
              label: 'Mark selection',
              icon: EditGlyph,
              onAction: () => addMark(selection),
            },
          ]}
          getPageMenuItems={getPageMenuItems}
        />
      </div>
      <p>
        Pages rendering:{' '}
        <output data-lab-output="viewports">
          {rendered.map((pageIndex) => pageIndex + 1).join(', ')}
        </output>
      </p>
      <ul>
        {marks.map((mark) => (
          <li key={mark.id} data-lab-mark-entry={mark.id}>
            <Button size="sm" variant="ghost" onPress={() => setRevealRect({ ...mark })}>
              {`Reveal ${mark.label}`}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function describeMatches(search: PdfSearchControls): string {
  if (search.isPending) return 'Searching…';
  if (!search.query.trim()) return '';
  return search.total > 0 ? `${search.current + 1} of ${search.total}` : 'None';
}

function CallerFindControls({ search }: { search: PdfSearchControls }) {
  const { options, setOptions } = search;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <SearchField
        label="Find everywhere"
        placeholder="Find everywhere"
        size="sm"
        value={search.query}
        onChange={search.setQuery}
      />
      <output aria-label="Text state">{search.status}</output>
      {search.results.map((result, index) => (
        <Button
          key={index}
          size="sm"
          onPress={() => search.selectResult(index)}
        >{`Page ${result.pageIndex + 1}: ${result.text.slice(result.start, result.end)}`}</Button>
      ))}
      <output aria-label="Matches" data-lab-output="matches">
        {describeMatches(search)}
      </output>
      <Button
        size="sm"
        variant="ghost"
        isDisabled={search.total === 0}
        onPress={search.findPrevious}
      >
        Back
      </Button>
      <Button size="sm" variant="ghost" isDisabled={search.total === 0} onPress={search.findNext}>
        Forward
      </Button>
      <Button
        size="sm"
        variant="ghost"
        isSelected={options.matchCase}
        onChange={(matchCase) => setOptions({ ...options, matchCase })}
      >
        Same case
      </Button>
      <Button
        size="sm"
        variant="ghost"
        isSelected={options.ignoreAccents}
        onChange={(ignoreAccents) => setOptions({ ...options, ignoreAccents })}
      >
        Any accent
      </Button>
      <Button
        size="sm"
        variant="ghost"
        isSelected={options.wholeWords}
        onChange={(wholeWords) => setOptions({ ...options, wholeWords })}
      >
        Whole words
      </Button>
      <Button
        size="sm"
        variant="ghost"
        isSelected={options.highlightAll}
        onChange={(highlightAll) => setOptions({ ...options, highlightAll })}
      >
        Mark every match
      </Button>
    </span>
  );
}

/** The caller owns the query and the current match and draws its own find controls. */
export function CallerOwnedFind() {
  const [query, setQuery] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [matchRevealRequest, setMatchRevealRequest] = useState(0);
  const [searchOptions, setSearchOptions] = useState<PdfSearchOptions>({});
  return (
    <div data-lab-case="find">
      <p>
        <Button size="sm" onPress={() => setQuery('pear')}>
          Find pears
        </Button>{' '}
        <Button size="sm" onPress={() => setMatchRevealRequest((request) => request + 1)}>
          Reveal current match
        </Button>{' '}
        Query: <output data-lab-output="query">{query}</output>; match:{' '}
        <output data-lab-output="match">{matchIndex}</output>; case:{' '}
        <output data-lab-output="case">{searchOptions.matchCase ? 'same' : 'any'}</output>
      </p>
      <div style={{ height: 420, maxWidth: 1000 }}>
        <PdfViewer
          aria-label="Report with its own find"
          zoomLevels={[25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400]}
          source={sampleUrl}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          searchQuery={query}
          onSearchQueryChange={setQuery}
          matchIndex={matchIndex}
          matchRevealRequest={matchRevealRequest}
          onMatchIndexChange={setMatchIndex}
          searchOptions={searchOptions}
          onSearchOptionsChange={setSearchOptions}
          renderSearch={(search) => <CallerFindControls search={search} />}
        />
      </div>
    </div>
  );
}

const accentSample = createAccentPdf();

/** Queries for the accent sample and the matches each set of options finds in it. */
const accentCounts = [
  ['café', 'none', 3],
  ['café', 'Any accent', 7],
  ['café', 'Any accent, Whole words', 5],
  ['cafe', 'Whole words', 1],
  ['Café', 'Same case', 2],
  ['Café', 'Same case, Any accent', 3],
] as const;

/**
 * A one-page sample with café written composed, decomposed and without an accent, beside longer
 * words that hold it, searched with the caller's find controls and every find option.
 */
export function AccentFind() {
  const [query, setQuery] = useState('café');
  const [searchOptions, setSearchOptions] = useState<PdfSearchOptions>({});
  return (
    <div data-lab-case="accents">
      <table>
        <caption>Expected matches</caption>
        <thead>
          <tr>
            <th scope="col">Query</th>
            <th scope="col">Options</th>
            <th scope="col">Matches</th>
          </tr>
        </thead>
        <tbody>
          {accentCounts.map(([text, options, count]) => (
            <tr key={`${text} ${options}`}>
              <td>{text}</td>
              <td>{options}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <LabOutput name="options">
        {Object.entries(searchOptions)
          .filter(([, isOn]) => isOn)
          .map(([option]) => option)
          .join(', ') || 'none'}
      </LabOutput>
      <div style={{ height: 420, maxWidth: 1000 }}>
        <PdfViewer
          aria-label="Menu with accents"
          source={accentSample}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          searchQuery={query}
          onSearchQueryChange={setQuery}
          searchOptions={searchOptions}
          onSearchOptionsChange={setSearchOptions}
          renderSearch={(search) => <CallerFindControls search={search} />}
        />
      </div>
    </div>
  );
}

/**
 * The toolbar spans a contents panel beside the document; the contents drive the page, which the
 * other copy of the report opens at too.
 */
export function ProjectedToolbar() {
  const [isContentsOpen, setContentsOpen] = useState(true);
  const [page, setPage] = useState(0);
  const [source, setSource] = useState(sampleUrl);
  return (
    <ProjectionProvider>
      <div
        data-lab-case="projected"
        style={{
          display: 'grid',
          gridTemplateColumns: isContentsOpen ? '160px minmax(0, 1fr)' : 'minmax(0, 1fr)',
          gridTemplateRows: 'auto 420px',
          maxWidth: 1000,
        }}
      >
        <div data-lab-band="" style={{ gridColumn: '1 / -1' }}>
          <ProjectionOutlet slot="report-tools" />
        </div>
        {isContentsOpen ? (
          <nav aria-label="Contents">
            <ol>
              {contents.map((title, pageIndex) => (
                <li key={title}>
                  <Button size="sm" variant="ghost" onPress={() => setPage(pageIndex)}>
                    {title}
                  </Button>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <PdfViewer
          aria-label="Report beside its contents"
          source={source}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          toolbarSlot="report-tools"
          page={page}
          onPageChange={setPage}
          leadingActions={
            <Button size="sm" variant="ghost" onPress={() => setContentsOpen((open) => !open)}>
              {isContentsOpen ? 'Hide contents' : 'Show contents'}
            </Button>
          }
        />
      </div>
      <p>
        Page: <output data-lab-output="page">{page + 1}</output>{' '}
        <Button
          size="sm"
          variant="ghost"
          onPress={() => setSource((current) => (current === sampleUrl ? otherCopyUrl : sampleUrl))}
        >
          Open the other copy
        </Button>
      </p>
    </ProjectionProvider>
  );
}

/**
 * A source fetched as bytes, opening at its second page with the sidebar open on the outline, named
 * destinations, and a caller page that wins over a destination still being looked up.
 */
export function SidebarReader() {
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  // The caller takes the page over once it asks for the first page, and follows the reader then.
  const [requestedPage, setRequestedPage] = useState<number | undefined>(undefined);
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
      <p>
        Drag the sidebar separator or focus it and use arrow keys, Home or End to resize it. Closing
        and reopening remembers its width.
      </p>
      <p>
        <Button size="sm" onPress={() => setDestination('markets')}>
          Go to markets
        </Button>{' '}
        <Button size="sm" onPress={() => setDestination('varieties')}>
          Go to varieties
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={() => setRequestedPage(0)}>
          Back to the first page
        </Button>{' '}
        Page: <output data-lab-output="page">{page + 1}</output>
      </p>
      <div style={{ height: 460, maxWidth: 1000 }}>
        <PdfViewer
          aria-label="Report from bytes"
          source={bytes}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          defaultSidebarOpen
          defaultPage={1}
          destination={destination}
          page={requestedPage}
          onPageChange={(pageIndex) => {
            setPage(pageIndex);
            setRequestedPage((current) => (current === undefined ? undefined : pageIndex));
            // A reader who moves on may ask for the same destination again.
            setDestination(null);
          }}
        />
      </div>
    </div>
  );
}
