// A PDF viewer lab case in which the caller follows the reader: it reads page text before the pages
// render, drops pins where the reader clicks, notes finished selections and tracks the top of the
// view. Lab-only presentation is inline.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  type PdfDocumentAccess,
  type PdfPagePoint,
  type PdfSelection,
  PdfViewer,
  type PdfVisiblePosition,
} from '../../src/components/pdf-viewer/pdf-viewer.js';
import { loadEngine, otherCopyUrl, sampleUrl, workerSrc } from './pdf-viewer-cases.js';

interface Pin extends PdfPagePoint {
  id: number;
}

function PinMark({ pin, scale }: { pin: Pin; scale: number }) {
  return (
    <span
      data-lab-pin={pin.id}
      style={{
        position: 'absolute',
        left: pin.point.left * scale - 5,
        top: pin.point.top * scale - 5,
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: 'rgb(200 80 0)',
      }}
    />
  );
}

const describePosition = (position: PdfVisiblePosition | null) =>
  position ? `page ${position.pageIndex + 1}, ${Math.round(position.top)} pt down` : '—';

/** Reads the last page's text through the document handle, without scrolling to it. */
function useLastPageText(access: PdfDocumentAccess | null) {
  const [text, setText] = useState('');
  const read = () => {
    if (!access) return;
    access.getPageText(access.pageCount - 1).then(
      (page) => setText(page.text.split('\n')[0] ?? ''),
      (error: unknown) => setText(error instanceof Error ? error.message : String(error)),
    );
  };
  return { text, read, clear: () => setText('') };
}

/** Pins dropped by clicking a page, notes taken from finished selections, and the reading place. */
export function ReadingNotes() {
  const [source, setSource] = useState(sampleUrl);
  const [access, setAccess] = useState<PdfDocumentAccess | null>(null);
  const [pins, setPins] = useState<readonly Pin[]>([]);
  const [selection, setSelection] = useState<PdfSelection | null>(null);
  const [notes, setNotes] = useState<readonly string[]>([]);
  const [position, setPosition] = useState<PdfVisiblePosition | null>(null);
  const lastPage = useLastPageText(access);
  const openOtherCopy = () => {
    setSource((current) => (current === sampleUrl ? otherCopyUrl : sampleUrl));
    setPins([]);
    lastPage.clear();
  };
  return (
    <div data-lab-case="reading">
      <p>
        <Button size="sm" variant="secondary" isDisabled={!access} onPress={lastPage.read}>
          Read the last page
        </Button>{' '}
        <Button size="sm" variant="ghost" onPress={openOtherCopy}>
          Open the other copy
        </Button>
      </p>
      <div style={{ height: 480, maxWidth: 1000 }}>
        <PdfViewer
          aria-label="Report with reading notes"
          source={source}
          loadEngine={loadEngine}
          workerSrc={workerSrc}
          onDocumentChange={setAccess}
          onPageClick={(target) => setPins((list) => [...list, { ...target, id: list.length + 1 }])}
          onSelectionChange={setSelection}
          onVisiblePositionChange={setPosition}
          renderPageOverlay={({ pageIndex, viewport }) =>
            pins
              .filter((pin) => pin.pageIndex === pageIndex)
              .map((pin) => <PinMark key={pin.id} pin={pin} scale={viewport.scale} />)
          }
        />
      </div>
      <dl>
        <dt>Document</dt>
        <dd>
          <output data-lab-output="pages">{access ? `${access.pageCount} pages` : 'closed'}</output>
        </dd>
        <dt>Last page starts with</dt>
        <dd>
          <output data-lab-output="last-page">{lastPage.text}</output>
        </dd>
        <dt>Top of the view</dt>
        <dd>
          <output data-lab-output="position">{describePosition(position)}</output>
        </dd>
        <dt>Pins</dt>
        <dd>
          <output data-lab-output="pins">
            {pins.map((pin) => `page ${pin.pageIndex + 1}`).join(', ')}
          </output>
        </dd>
        <dt>Selection</dt>
        <dd>
          <output data-lab-output="selection">{selection?.text ?? ''}</output>{' '}
          <Button
            size="sm"
            variant="ghost"
            isDisabled={!selection}
            onPress={() => selection && setNotes((list) => [...list, selection.text.trim()])}
          >
            Note the selection
          </Button>
        </dd>
        <dt>Notes</dt>
        <dd>
          <output data-lab-output="notes">{notes.join(' · ')}</output>
        </dd>
      </dl>
    </div>
  );
}
