import { useRef, useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Outline, type OutlineHeading } from '../../src/components/outline/outline.js';
import { ScrollRegion } from '../../src/components/scroll-region/scroll-region.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const guide: readonly OutlineHeading[] = [
  { id: 'guide-welcome', label: 'Welcome', level: 2 },
  { id: 'guide-arriving', label: 'Arriving', level: 2 },
  { id: 'guide-train', label: 'By train', level: 3 },
  { id: 'guide-air', label: 'By air', level: 3 },
  { id: 'guide-districts', label: 'Districts', level: 2 },
  { id: 'guide-old-town', label: 'Old town', level: 3 },
  { id: 'guide-harbour', label: 'Harbour', level: 3 },
  { id: 'guide-hills', label: 'Hills', level: 3 },
  { id: 'guide-viewpoints', label: 'Viewpoints', level: 4 },
  { id: 'guide-food', label: 'Food', level: 2 },
  { id: 'guide-markets', label: 'Markets', level: 3 },
  { id: 'guide-bakeries', label: 'Bakeries', level: 3 },
  { id: 'guide-notes', label: 'Practical notes', level: 2 },
];

const sample: readonly OutlineHeading[] = [
  { id: 'apples', label: 'Apples', level: 1 },
  { id: 'apples-sweet', label: 'Sweet apples', level: 2 },
  { id: 'apples-tart', label: 'Tart apples', level: 2 },
  { id: 'pears', label: 'Pears', level: 1 },
  { id: 'pears-autumn', label: 'Autumn pears', level: 2 },
];

const states = ['current', 'collapsed below 2', 'loading', 'empty'] as const;

// Lab-only frames: the outline column and the scrolled document.
const columns: CSSProperties = { display: 'flex', gap: 16, alignItems: 'flex-start' };
const frame: CSSProperties = { width: 360, height: 260, display: 'flex', flexDirection: 'column' };
const stickyHeader: CSSProperties = {
  position: 'sticky',
  top: 0,
  height: 32,
  margin: 0,
  background: 'var(--ref-surface, Canvas)',
};

function StateCell({ state, isNumbered }: { state: (typeof states)[number]; isNumbered: boolean }) {
  const isEmpty = state === 'loading' || state === 'empty';
  return (
    <div style={{ width: 220 }}>
      <Outline
        aria-label={`Fruit, ${isNumbered ? 'numbered' : 'plain'}, ${state}`}
        headings={isEmpty ? [] : sample}
        currentId="apples-tart"
        isNumbered={isNumbered}
        collapseBelowLevel={state === 'collapsed below 2' ? 1 : undefined}
        isPending={state === 'loading'}
        emptyMessage="No headings yet."
      />
    </div>
  );
}

/** A guide scrolled in a region; the outline follows it below the sticky header. */
function Reader() {
  const viewport = useRef<HTMLDivElement>(null);
  const [followed, setFollowed] = useState('nothing yet');
  return (
    <div style={columns} data-lab-demo="reader">
      <div style={{ width: 220 }}>
        <Outline
          aria-label="Guide"
          headings={guide}
          viewportRef={viewport}
          trackingOffset={40}
          isNumbered
          onNavigate={(id) => setFollowed(id)}
        />
        <p>
          Followed: <output data-lab-followed="">{followed}</output>
        </p>
      </div>
      <div style={frame}>
        <ScrollRegion ref={viewport} role="region" aria-label="Guide text" tabIndex={0}>
          <p style={stickyHeader}>City guide</p>
          {guide.map((heading) => {
            const Heading = `h${heading.level + 1}` as 'h3' | 'h4' | 'h5';
            return (
              <section key={heading.id} style={{ minHeight: 140, scrollMarginTop: 40 }}>
                <Heading id={heading.id} tabIndex={-1} style={{ scrollMarginTop: 40 }}>
                  {heading.label}
                </Heading>
                <p>Notes on {heading.label.toLowerCase()} for a first visit.</p>
              </section>
            );
          })}
        </ScrollRegion>
      </div>
    </div>
  );
}

const sections = guide.filter((heading, index) => (guide[index + 1]?.level ?? 0) > heading.level);

/** Expand all and Collapse all control the expanded sections; the log shows every change. */
function ControlledSections() {
  const [keys, setKeys] = useState<Set<Key>>(() => new Set(['guide-districts']));
  return (
    <div data-lab-demo="controlled">
      <Button size="sm" onPress={() => setKeys(new Set(sections.map((heading) => heading.id)))}>
        Expand all
      </Button>{' '}
      <Button size="sm" onPress={() => setKeys(new Set())}>
        Collapse all
      </Button>
      <div style={{ width: 260 }}>
        <Outline
          aria-label="Guide sections"
          headings={guide}
          currentId="guide-viewpoints"
          expandedKeys={keys}
          onExpandedChange={setKeys}
          numberOptions={{ styles: ['upper-roman', 'lower-alpha', 'decimal'] }}
          isNumbered
        />
      </div>
      <p>
        Expanded: <output data-lab-expanded="">{[...keys].join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Plain and numbered, with Tart apples current: expanded, collapsed below level 1 (the collapsed Apples holds the current heading), loading and empty."
    >
      <StateMatrix
        axes={{ numbering: ['plain', 'numbered'], state: states }}
        render={({ numbering, state }) => (
          <StateCell state={state} isNumbered={numbering === 'numbered'} />
        )}
      />
    </LabSection>
    <LabSection
      title="Reading a guide"
      description="Scroll the guide: the outline marks the section under the 40px sticky header. Follow an entry to jump to its heading, which takes focus."
    >
      <Reader />
    </LabSection>
    <LabSection
      title="Controlled sections"
      description="The caller holds the expanded sections, numbered in Roman numerals, then letters, then digits."
    >
      <ControlledSections />
    </LabSection>
  </>,
);
