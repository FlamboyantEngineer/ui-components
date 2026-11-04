// Hover Card cases for position tuning, opening on mount and trigger removal.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { HoverCard, HoverCardTrigger } from '../../src/components/hover-card/hover-card.js';
import { Link } from '../../src/components/link/link.js';
import { LabSection } from './chrome/index.js';
import { useOverlayGeometry } from './overlay-geometry-controls.js';

/**
 * A card that prefers the top. Scroll the link to the top of the window: with flipping on it opens
 * below, with flipping off it stays above, clipped by the padding kept from the edge.
 */
function TunedCard() {
  const { geometry, controls } = useOverlayGeometry({
    offset: 16,
    crossOffset: 24,
    containerPadding: 12,
    shouldFlip: true,
  });
  return (
    <div data-lab-demo="hover-geometry">
      {controls}
      <HoverCardTrigger delay={0} closeDelay={0}>
        <Link href="#bergen">Bergen</Link>
        <HoverCard placement="top" {...geometry} showArrow data-lab-card="tuned">
          <p>
            <strong>Bergen</strong>, Norway
          </p>
          <p>Seven hills and a wharf of wooden houses.</p>
        </HoverCard>
      </HoverCardTrigger>
    </div>
  );
}

/** A trigger mounted on demand whose card opens at once. */
function OpenOnMount() {
  const [isMounted, setMounted] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <div data-lab-demo="hover-default-open">
      <Button size="sm" variant="secondary" onPress={() => setMounted((mounted) => !mounted)}>
        {isMounted ? 'Remove the preview' : 'Add the preview'}
      </Button>{' '}
      {isMounted ? (
        <HoverCardTrigger
          defaultOpen
          onOpenChange={(isOpen) => setChanges((list) => [...list, isOpen ? 'open' : 'closed'])}
        >
          <Link href="#porto">Porto</Link>
          <HoverCard data-lab-card="default-open">
            <p>
              <strong>Porto</strong>, Portugal
            </p>
          </HoverCard>
        </HoverCardTrigger>
      ) : null}
      <p data-lab-output="hover-default-open">Changes: {changes.join(', ') || 'none'}</p>
    </div>
  );
}

function PreviewLifecycle() {
  const [isMounted, setMounted] = useState(false);
  const [isOpen, setOpen] = useState(false);
  return (
    <div data-lab-demo="hover-lifecycle">
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          setMounted(true);
          setOpen(false);
        }}
      >
        Add lifecycle preview
      </Button>{' '}
      {isMounted ? (
        <HoverCardTrigger isOpen={isOpen} onOpenChange={setOpen} closeDelay={100}>
          <Link href="#kyoto">Kyoto</Link>
          <HoverCard aria-label="About Kyoto">
            <p>Kyoto, Japan. Gardens and wooden temples.</p>
            <Button size="sm" onPress={() => setMounted(false)}>
              Remove this preview
            </Button>{' '}
            <Button size="sm" onPress={() => setOpen(false)}>
              Close preview externally
            </Button>
          </HoverCard>
        </HoverCardTrigger>
      ) : null}{' '}
      <HoverCardTrigger delay={600} closeDelay={100}>
        <Link href="#nara">Nara</Link>
        <HoverCard aria-label="About Nara">
          <p>Nara, Japan. A park with free-roaming deer.</p>
        </HoverCard>
      </HoverCardTrigger>
    </div>
  );
}

export function HoverCardCoverageSections() {
  return (
    <>
      <LabSection
        title="Position tuning"
        description="offset moves the card away from the link, crossOffset shifts it along the link's side and containerPadding keeps it that far from the window's edges. The card prefers the top: scroll the link near the top of the window and hover it, and it flips below while flipping is on, or stays above, held inside the padding, while it is off."
      >
        <TunedCard />
      </LabSection>
      <LabSection
        title="Open on mount"
        description="defaultOpen opens an uncontrolled card as soon as its trigger mounts; leaving the link and card closes it as usual. Changes after mounting are listed."
      >
        <OpenOnMount />
      </LabSection>
      <LabSection
        title="Preview lifecycle"
        description="Add a preview and hover Kyoto, then remove its trigger or close it through its controlled state. Nara opens immediately during the 500 ms handoff window; after that it waits its 600 ms delay."
      >
        <PreviewLifecycle />
      </LabSection>
    </>
  );
}
