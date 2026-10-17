import { useRef, type CSSProperties } from 'react';
import {
  ScrollRegion,
  useScrollRegionHeaderRef,
  type ScrollRegionProps,
} from '../../src/components/scroll-region/scroll-region.js';
import { useScrollStripOverflow } from '../../src/utils/use-scroll-strip-overflow.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const cities = [
  'Amsterdam',
  'Barcelona',
  'Copenhagen',
  'Dublin',
  'Edinburgh',
  'Florence',
  'Geneva',
  'Helsinki',
  'Istanbul',
  'Kyoto',
  'Lisbon',
  'Montreal',
  'Nairobi',
  'Oslo',
  'Porto',
  'Quebec',
  'Reykjavik',
  'Seville',
  'Tallinn',
  'Utrecht',
  'Valencia',
  'Warsaw',
  'Yokohama',
  'Zurich',
];

// Lab-only host frames; the region fills them.
const frame = (width: number, height: number): CSSProperties => ({
  width,
  height,
  display: 'flex',
  flexDirection: 'column',
  outline: '1px dotted currentColor',
});

const markers = [
  { top: 0, height: 20, color: '#1a7f37', priority: 1 },
  { top: 180, height: 40, color: '#cf222e', priority: 0 },
  { top: 400, height: 4, color: '#9a6700', priority: 2 },
  { top: 560, height: 30, color: '#0969da', priority: 1 },
];

const layers = [
  { name: 'changes', markers: markers.slice(0, 2) },
  { name: 'notes', markers: [{ top: 190, height: 60, color: '#8250df', priority: 0 }] },
];

const gridOf: Record<string, Pick<ScrollRegionProps, 'columns' | 'minColumnWidth' | 'align'>> = {
  plain: {},
  'two columns': { columns: 2 },
  'two columns, centred': { columns: 2, align: 'center' },
  fit: { columns: 'fit' },
  'fit, md minimum': { columns: 'fit', minColumnWidth: 'md' },
};

function WideList({ count = 12 }: { count?: number }) {
  return (
    <ol style={{ margin: 0, paddingInlineStart: 28, width: 420 }}>
      {cities.slice(0, count).map((city) => (
        <li key={city}>{city}, a city with a long description that runs past the visible width</li>
      ))}
    </ol>
  );
}

function StickyTable() {
  const headerRef = useScrollRegionHeaderRef();
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead ref={headerRef} style={{ position: 'sticky', top: 0, background: 'Canvas' }}>
        <tr>
          <th style={{ textAlign: 'start', padding: '6px 8px' }}>City</th>
          <th style={{ textAlign: 'start', padding: '6px 8px' }}>Letter</th>
        </tr>
      </thead>
      <tbody>
        {cities.map((city) => (
          <tr key={city}>
            <td style={{ padding: '4px 8px' }}>{city}</td>
            <td style={{ padding: '4px 8px' }}>{city[0]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Strip() {
  const ref = useRef<HTMLDivElement>(null);
  const { overflow, syncOverflow } = useScrollStripOverflow(ref);
  return (
    <div style={{ display: 'grid', gap: 8, width: 360 }}>
      <div
        ref={ref}
        role="group"
        aria-label="City chips"
        tabIndex={0}
        data-lab-strip=""
        data-lab-overflow-start={overflow.start}
        data-lab-overflow-end={overflow.end}
        onScroll={syncOverflow}
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          outline: '1px dotted currentColor',
          padding: 4,
        }}
      >
        {cities.slice(0, 14).map((city) => (
          <button key={city} type="button" style={{ flex: 'none' }}>
            {city}
          </button>
        ))}
      </div>
      <p>
        Hidden before: <output data-lab-output="start">{overflow.start ? 'yes' : 'no'}</output>,
        hidden after: <output data-lab-output="end">{overflow.end ? 'yes' : 'no'}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Axes and scrollbars"
      description="Each scrolling axis with native and overlay scrollbars, in a 220 by 120 pixel host."
    >
      <StateMatrix
        axes={{ axis: ['x', 'y', 'both', 'none'], scrollbar: ['native', 'overlay'] }}
        render={({ axis, scrollbar }) => (
          <div style={frame(220, 120)}>
            <ScrollRegion
              axis={axis}
              scrollbar={scrollbar}
              role="region"
              aria-label={`Cities, ${axis} axis, ${scrollbar} scrollbar`}
              tabIndex={0}
            >
              <WideList />
            </ScrollRegion>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Scroll chaining and grid"
      description="Contained and chained scrolling against plain and grid content (columns, alignment and fit minimum), in a 260 by 120 pixel host."
    >
      <StateMatrix
        axes={{ layout: Object.keys(gridOf), overscroll: ['contain', 'auto'] }}
        render={({ layout, overscroll }) => (
          <div style={frame(260, 120)}>
            <ScrollRegion
              overscroll={overscroll}
              {...gridOf[layout]}
              space="xs"
              role="region"
              aria-label={`Cities, ${layout}, ${overscroll}`}
              tabIndex={0}
            >
              {cities.map((city) => (
                <span key={city}>{city}</span>
              ))}
            </ScrollRegion>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Overlay scrollbars"
      description="Focus a thumb and use the arrow keys, Page Up, Page Down, Home and End, or drag it."
    >
      <div style={frame(360, 200)} data-lab-region="overlay">
        <ScrollRegion
          id="overlay-viewport"
          axis="both"
          scrollbar="overlay"
          role="region"
          aria-label="Cities with overlay scrollbars"
        >
          <WideList count={24} />
        </ScrollRegion>
      </div>
    </LabSection>
    <LabSection
      title="Header inset"
      description="The vertical thumb runs below the table's sticky header."
    >
      <div style={frame(360, 200)} data-lab-region="header">
        <ScrollRegion
          scrollbar="overlay"
          scrollbarInset="header"
          role="region"
          aria-label="Cities table"
        >
          <StickyTable />
        </ScrollRegion>
      </div>
    </LabSection>
    <LabSection
      title="Short wide content"
      description="Content shorter than the region overflows sideways; the horizontal thumb sits under it."
    >
      <div style={frame(360, 200)} data-lab-region="lift">
        <ScrollRegion axis="both" scrollbar="overlay" role="region" aria-label="Three cities">
          <WideList count={3} />
        </ScrollRegion>
      </div>
    </LabSection>
    <LabSection
      title="Right to left"
      description="A right-to-left region starts scrolled to the right; its horizontal thumb starts there."
    >
      <div dir="rtl" style={frame(360, 120)} data-lab-region="rtl">
        <ScrollRegion axis="x" scrollbar="overlay" role="region" aria-label="Cities right to left">
          <WideList count={3} />
        </ScrollRegion>
      </div>
    </LabSection>
    <LabSection
      title="Overview"
      description="Markers painted beside the native vertical scrollbar, as one set and as two mixed layers."
    >
      <StateMatrix
        axes={{ source: ['markers', 'layers'] }}
        render={({ source }) => (
          <div style={frame(260, 160)} data-lab-region={`overview-${source}`}>
            <ScrollRegion
              {...(source === 'markers' ? { overview: markers } : { overviewLayers: layers })}
              role="region"
              aria-label={`Cities with overview ${source}`}
              tabIndex={0}
            >
              <ol style={{ margin: 0 }}>
                {[...cities, ...cities].map((city, index) => (
                  <li key={`${city}-${index}`}>{city}</li>
                ))}
              </ol>
            </ScrollRegion>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Scrolling strip"
      description="A strip of chips that reports hidden content at each edge; the vertical wheel scrolls it sideways."
    >
      <Strip />
    </LabSection>
  </>,
);
