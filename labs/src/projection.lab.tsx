import { useState } from 'react';
import {
  ProjectionContent,
  ProjectionOutlet,
  ProjectionProvider,
  useProjectedContent,
} from '../../src/components/projection/projection.js';
import { ProjectionHostCases } from './projection-host-cases.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { DraftTakeover } from './projection-drafts.js';

const declarations = ['none', 'one', 'two'] as const;

function StateCell({ count, fallback }: { count: number; fallback: boolean }) {
  return (
    <ProjectionProvider>
      <div data-lab-outlet="">
        Toolbar:{' '}
        <ProjectionOutlet slot="tools" fallback={fallback ? <em>No tools</em> : undefined} />
      </div>
      <div data-lab-origin="">
        {count >= 1 ? (
          <ProjectionContent slot="tools">
            <button type="button">Crop</button>
          </ProjectionContent>
        ) : null}
        {count >= 2 ? (
          <ProjectionContent slot="tools">
            <button type="button">Rotate</button>
          </ProjectionContent>
        ) : null}
      </div>
    </ProjectionProvider>
  );
}

function MapPage() {
  const [zoom, setZoom] = useState(1);
  return (
    <section aria-label="Map page">
      <p data-lab-zoom="">Zoom level {zoom}</p>
      <ProjectionContent slot="page-tools">
        <button type="button" onClick={() => setZoom((value) => value + 1)}>
          Zoom in ({zoom})
        </button>
      </ProjectionContent>
    </section>
  );
}

function PhotosPage() {
  const [photo, setPhoto] = useState(1);
  return (
    <section aria-label="Photos page">
      <p>Photo {photo} of 9</p>
      <ProjectionContent slot="page-tools">
        <button type="button" onClick={() => setPhoto((value) => (value % 9) + 1)}>
          Next photo
        </button>
      </ProjectionContent>
    </section>
  );
}

function SharedToolbar() {
  const [page, setPage] = useState<'map' | 'photos' | null>('map');
  const [overlay, setOverlay] = useState(false);
  return (
    <ProjectionProvider>
      <div data-lab-toolbar="">
        <strong>Page tools:</strong>{' '}
        <ProjectionOutlet slot="page-tools" fallback={<em>Choose a page</em>} />
      </div>
      <p>
        <button type="button" aria-pressed={page === 'map'} onClick={() => setPage('map')}>
          Map
        </button>{' '}
        <button type="button" aria-pressed={page === 'photos'} onClick={() => setPage('photos')}>
          Photos
        </button>{' '}
        <button type="button" aria-pressed={page === null} onClick={() => setPage(null)}>
          No page
        </button>{' '}
        <label>
          <input
            type="checkbox"
            checked={overlay}
            onChange={(event) => setOverlay(event.target.checked)}
          />{' '}
          Show overlay tools
        </label>
      </p>
      {page === 'map' ? <MapPage /> : null}
      {page === 'photos' ? <PhotosPage /> : null}
      {overlay ? (
        <ProjectionContent slot="page-tools">
          <button type="button" onClick={() => setOverlay(false)}>
            Close overlay
          </button>
        </ProjectionContent>
      ) : null}
    </ProjectionProvider>
  );
}

/** A caption that renders only while its slot has content. */
function Caption() {
  const caption = useProjectedContent('caption');
  return caption === undefined ? null : <figcaption data-lab-caption="">{caption}</figcaption>;
}

/**
 * A panel owns a private `caption` slot through a scoped provider; its `page-title` content still
 * reaches the outer provider's outlet.
 */
function ScopedPanel() {
  const [captioned, setCaptioned] = useState(true);
  return (
    <ProjectionProvider>
      <div data-lab-title="">
        <strong>Page title:</strong> <ProjectionOutlet slot="page-title" fallback={<em>None</em>} />
      </div>
      <ProjectionProvider slots={['caption']}>
        <figure data-lab-figure="">
          <p>A bowl of cherries.</p>
          <Caption />
        </figure>
        <ProjectionContent slot="page-title">Still life</ProjectionContent>
        {captioned ? <ProjectionContent slot="caption">Cherries, 1890</ProjectionContent> : null}
        <label>
          <input
            type="checkbox"
            checked={captioned}
            onChange={(event) => setCaptioned(event.target.checked)}
          />{' '}
          Caption
        </label>
      </ProjectionProvider>
    </ProjectionProvider>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="The outlet shows the most recent declaration, or its fallback when there is none."
    >
      <StateMatrix
        axes={{ declarations, fallback: ['without fallback', 'with fallback'] }}
        render={({ declarations: count, fallback }) => (
          <StateCell count={declarations.indexOf(count)} fallback={fallback === 'with fallback'} />
        )}
      />
    </LabSection>
    <LabSection
      title="Shared toolbar"
      description="Each page declares its own tools; the toolbar renders them while the page keeps their state. Overlay tools stack on top."
    >
      <SharedToolbar />
    </LabSection>
    <LabSection
      title="Scoped provider"
      description="An inner provider owns only the caption slot, read with useProjectedContent so the caption element exists only while it has content; the page title passes through to the outer outlet."
    >
      <ScopedPanel />
    </LabSection>
    <LabSection
      title="Taking over a slot"
      description="Edit the draft note, then let the review note take over: it starts from its own text, and the draft note comes back from its own text when the review note leaves."
    >
      <DraftTakeover />
    </LabSection>
    <ProjectionHostCases />
  </>,
);
