// Drawer cases for opening on mount, a guarded outside press, physical sides in a right-to-left
// page, and each swipe direction a drawer may take.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import {
  Drawer,
  type DrawerPosition,
  type DrawerSwipeDirection,
  DrawerTrigger,
} from '../../src/components/drawer/drawer.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection } from './chrome/index.js';

/** A drawer mounted on demand that opens at once, alone and with its trigger. */
function OpenOnMount() {
  const [isMounted, setMounted] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const log = (source: string) => (isOpen: boolean) =>
    setEvents((list) => [...list, `${source} ${isOpen ? 'opened' : 'closed'}`]);
  return (
    <div data-lab-demo="default-open">
      <Button size="sm" onPress={() => setMounted((mounted) => !mounted)}>
        {isMounted ? 'Unmount the drawers' : 'Mount the drawers'}
      </Button>
      {isMounted ? (
        <>
          <Drawer
            defaultOpen
            onOpenChange={log('drawer')}
            title="Welcome"
            showCloseButton
            data-lab-drawer="default-open"
          >
            <p>Opened by defaultOpen when it mounted.</p>
          </Drawer>
          <DrawerTrigger defaultOpen={false} onOpenChange={log('trigger')}>
            <Button size="sm">Open the tips</Button>
            <Drawer title="Tips" showCloseButton>
              <p>A trigger that starts closed.</p>
            </Drawer>
          </DrawerTrigger>
        </>
      ) : null}
      <p data-lab-output="default-open">Events: {events.join(', ') || 'none'}</p>
    </div>
  );
}

/** Outside presses close the drawer unless its draft holds changes, which the guard refuses. */
function GuardedOutside() {
  const [hasChanges, setHasChanges] = useState(false);
  const [answer, setAnswer] = useState('none');
  const [closes, setCloses] = useState(0);
  return (
    <div data-lab-demo="guarded">
      <DrawerTrigger onOpenChange={(isOpen) => isOpen || setCloses((count) => count + 1)}>
        <Button size="sm">Edit the label</Button>
        <Drawer
          title="Label"
          showCloseButton
          data-lab-drawer="guarded"
          shouldCloseOnInteractOutside={() => {
            setAnswer(hasChanges ? 'refused' : 'allowed');
            return !hasChanges;
          }}
        >
          <Checkbox isSelected={hasChanges} onChange={setHasChanges}>
            The label has unsaved changes
          </Checkbox>
        </Drawer>
      </DrawerTrigger>
      <p data-lab-output="guarded">
        Last outside press: {answer}; closed {closes} times
      </p>
    </div>
  );
}

const physicalPositions: readonly DrawerPosition[] = ['left', 'right', 'start', 'end'];

/** In a right-to-left page, start and end swap sides while left and right stay put. */
function PhysicalSides() {
  return (
    <UiProvider locale="he-IL">
      <div dir="rtl" data-lab-demo="physical">
        {physicalPositions.map((position) => (
          <DrawerTrigger key={position}>
            <Button size="sm">{position}</Button>
            <Drawer
              position={position}
              title={`From ${position}`}
              showCloseButton
              data-lab-drawer={`rtl-${position}`}
            >
              <p>Position {position} in a right-to-left page.</p>
            </Drawer>
          </DrawerTrigger>
        ))}
      </div>
    </UiProvider>
  );
}

const swipeDirections: readonly DrawerSwipeDirection[] = [
  'right',
  'horizontal',
  'left',
  'vertical',
];

/** A drawer at the end edge under each swipe direction: which swipes dismiss it. */
function SwipeChoices() {
  const [direction, setDirection] = useState<DrawerSwipeDirection>('vertical');
  const [result, setResult] = useState('');
  return (
    <div data-lab-demo="swipe-directions">
      <div role="group" aria-label="Swipe direction">
        {swipeDirections.map((option) => (
          <Button
            key={option}
            size="sm"
            variant="secondary"
            isSelected={direction === option}
            onPress={() => setDirection(option)}
          >
            {option}
          </Button>
        ))}
      </div>
      <DrawerTrigger
        onOpenChange={(isOpen) => setResult(isOpen ? 'open' : `dismissed (${direction})`)}
      >
        <Button size="sm">Open the basket</Button>
        <Drawer
          position="end"
          swipeDirection={direction}
          title="Basket"
          showCloseButton
          data-lab-drawer="swipe-direction"
        >
          <p>Swipe it toward either side and see which swipes dismiss it.</p>
        </Drawer>
      </DrawerTrigger>
      <p data-lab-output="swipe-directions">
        swipeDirection {direction}: {result || 'closed'}
      </p>
    </div>
  );
}

export function DrawerCoverageSections() {
  return (
    <>
      <LabSection
        title="Open on mount"
        description="defaultOpen opens an uncontrolled Drawer as soon as it mounts; a DrawerTrigger with defaultOpen false starts closed. Mount them to see the welcome drawer open; onOpenChange is listed."
      >
        <OpenOnMount />
      </LabSection>
      <LabSection
        title="Guarded outside presses"
        description="shouldCloseOnInteractOutside answers each outside press: allowed while the label has no unsaved changes, refused once the box is checked. Escape and the close button still close it."
      >
        <GuardedOutside />
      </LabSection>
      <LabSection
        title="Physical sides"
        description="In a right-to-left page, start opens from the right and end from the left, while left and right keep their physical sides."
      >
        <PhysicalSides />
      </LabSection>
      <LabSection
        title="Swipe directions"
        description="A drawer at the end edge under each swipeDirection. With right, its own edge, or horizontal, a swipe to the right dismisses it; with vertical only a swipe down does; with left, which points away from the edge it sits on, no swipe dismisses it. The result line reports each dismissal."
      >
        <SwipeChoices />
      </LabSection>
    </>
  );
}
