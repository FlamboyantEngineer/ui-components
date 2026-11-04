import { PlusGlyph } from '../../src/core/glyphs.js';
import { useId, useRef, useState, type RefObject } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Modal } from '../../src/components/modal/modal.js';
import {
  AnchoredTooltip,
  type AnchoredTooltipRelationship,
} from '../../src/components/tooltip/tooltip.js';

const bars = [
  { label: 'Mon', value: 12 },
  { label: 'Tue', value: 30 },
  { label: 'Wed', value: 22 },
];

/** A modal-owned anchor whose hint shares the overlay container. */
function ModalHint() {
  const anchor = useRef<HTMLSpanElement>(null);
  const [isOpen, setOpen] = useState(false);
  return (
    <div data-lab-demo="anchored-modal">
      <Button onPress={() => setOpen(true)}>Open build details</Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={setOpen}
        title="Build details"
        cancelAction={{ label: 'Close' }}
      >
        <span ref={anchor} role="status" aria-label="Modal build status">
          Passing
        </span>
      </Modal>
      <AnchoredTooltip
        isOpen={isOpen}
        anchor={anchor}
        content="All modal checks passed"
        placement="bottom"
      />
    </div>
  );
}

/** A status chip the page owns, with a hint the page shows and hides. */
function ChipHint() {
  const chipRef = useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div data-lab-demo="anchored-element">
      <span ref={chipRef} role="status" aria-label="Build status">
        Passing
      </span>{' '}
      <Button size="sm" onPress={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Hide the hint' : 'Show the hint'}
      </Button>
      <AnchoredTooltip
        isOpen={isOpen}
        anchor={chipRef}
        content="All 48 checks passed"
        placement="bottom"
      />
    </div>
  );
}

/** Bars of an SVG chart whose hints the chart opens on pointer and focus. */
function ChartHints() {
  const [active, setActive] = useState<{ index: number; bar: SVGRectElement } | null>(null);
  return (
    <div data-lab-demo="anchored-svg">
      <svg width={180} height={80} role="group" aria-label="Visits by day">
        {bars.map((bar, index) => (
          <rect
            key={bar.label}
            x={20 + index * 50}
            y={70 - bar.value * 2}
            width={30}
            height={bar.value * 2}
            tabIndex={0}
            role="img"
            aria-label={bar.label}
            fill="currentColor"
            onPointerEnter={(event) => setActive({ index, bar: event.currentTarget })}
            onFocus={(event) => setActive({ index, bar: event.currentTarget })}
            onPointerLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
          />
        ))}
      </svg>
      <AnchoredTooltip
        isOpen={active !== null}
        anchor={active?.bar}
        content={active ? `${bars[active.index]?.value ?? 0} visits` : null}
      />
    </div>
  );
}

/** A marker drawn in a scrolling box, with no element of its own: the hint follows its rectangle. */
function RegionHint() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const region = {
    getBoundingClientRect: () => {
      const box = boxRef.current?.getBoundingClientRect();
      const scrollTop = boxRef.current?.scrollTop ?? 0;
      return {
        top: (box?.top ?? 0) + 120 - scrollTop,
        left: (box?.left ?? 0) + 40,
        width: 60,
        height: 16,
      };
    },
  };
  return (
    <div data-lab-demo="anchored-region">
      <Button size="sm" onPress={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Hide the region hint' : 'Show the region hint'}
      </Button>
      <div
        ref={boxRef}
        tabIndex={0}
        role="region"
        aria-label="Floor plan"
        data-lab-region=""
        style={{ height: 160, overflow: 'auto', marginTop: 8 }}
      >
        <div style={{ height: 480 }}>Scroll the plan: the hint stays on the meeting room.</div>
      </div>
      <AnchoredTooltip
        isOpen={isOpen}
        anchor={region}
        content="Meeting room"
        variant="info"
        placement="end"
      />
    </div>
  );
}

/** An icon button already named by its label, whose hint only repeats it visually. */
function VisualHint() {
  const [button, setButton] = useState<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div data-lab-demo="anchored-visual">
      <Button
        ref={setButton}
        icon={PlusGlyph}
        label="Add a row"
        onHoverChange={setIsOpen}
        onFocusChange={setIsOpen}
      />
      <AnchoredTooltip isOpen={isOpen} anchor={button} content="Add a row" relationship="none" />
    </div>
  );
}

const slots = ['Draft', 'Review', 'none'] as const;

/** One ref the page keeps while the element it holds is replaced or removed: the hint follows it. */
function SwappedAnchorHint() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [slot, setSlot] = useState<(typeof slots)[number]>('Draft');
  const next = slots[(slots.indexOf(slot) + 1) % slots.length] ?? 'Draft';
  return (
    <div data-lab-demo="anchored-swap">
      {slot === 'none' ? null : (
        <button key={slot} ref={anchorRef} type="button">
          {slot}
        </button>
      )}{' '}
      <Button size="sm" onPress={() => setSlot(next)}>
        {next === 'none' ? 'Remove the stage' : `Show ${next}`}
      </Button>
      <AnchoredTooltip isOpen anchor={anchorRef} content="Current stage" placement="bottom" />
    </div>
  );
}

/** Only this host commits when its context changes; the tooltip sibling stays open. */
function UpdatingAnchor({
  anchor,
  relationship,
}: {
  anchor: RefObject<HTMLButtonElement | null>;
  relationship: AnchoredTooltipRelationship;
}) {
  const id = useId();
  const [context, setContext] = useState(0);
  const tokens = [`${id}-first`, `${id}-second`, `${id}-extra ${id}-second`];
  const label = ['First context', 'Second context', 'Extra context Second context'][context];
  const attribute = relationship === 'label' ? 'aria-labelledby' : 'aria-describedby';
  return (
    <>
      <span id={`${id}-first`} hidden>
        First context
      </span>
      <span id={`${id}-second`} hidden>
        Second context
      </span>
      <span id={`${id}-extra`} hidden>
        Extra context
      </span>
      <button ref={anchor} type="button" {...{ [attribute]: tokens[context] }}>
        {relationship === 'label' ? label : 'Context anchor'}
      </button>{' '}
      <Button size="sm" onPress={() => setContext((context + 1) % tokens.length)}>
        Update context
      </Button>{' '}
    </>
  );
}

function UpdatingRelationshipHint({ relationship }: { relationship: 'description' | 'label' }) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div data-lab-demo={`anchored-${relationship}-updates`}>
      <UpdatingAnchor anchor={anchor} relationship={relationship} />
      <Button size="sm" onPress={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Hide context hint' : 'Show context hint'}
      </Button>
      <AnchoredTooltip
        isOpen={isOpen}
        anchor={anchor}
        relationship={relationship}
        content={`${relationship} hint`}
        placement="bottom"
      />
    </div>
  );
}

export function AnchoredTooltipCases() {
  return (
    <>
      <ChipHint />
      <ModalHint />
      <ChartHints />
      <RegionHint />
      <VisualHint />
      <SwappedAnchorHint />
      <UpdatingRelationshipHint relationship="description" />
      <UpdatingRelationshipHint relationship="label" />
    </>
  );
}
