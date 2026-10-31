import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Drawer, DrawerTrigger, type DrawerProps } from '../../src/components/drawer/drawer.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const positions = ['start', 'end', 'top', 'bottom'] as const;
const sizes = ['sm', 'md', 'lg'] as const;
const dismissals = ['outside presses refused', 'Escape refused', 'dismissal prevented'] as const;
const swipes = ['swipe either way', 'snap points'] as const;

/** A trigger button and the drawer it opens. */
function Opener({ label, ...props }: DrawerProps & { label: string }) {
  return (
    <DrawerTrigger>
      <Button size="sm">{label}</Button>
      <Drawer {...props} />
    </DrawerTrigger>
  );
}

/** A field whose Escape clears its draft first, handling the key, and lets the next one pass. */
function DraftField({ label }: { label: string }) {
  return (
    <label>
      {label}{' '}
      <input
        data-lab-draft=""
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || event.currentTarget.value === '') return;
          event.currentTarget.value = '';
          event.preventDefault();
        }}
      />
    </label>
  );
}

/** Footer actions; Apply closes the drawer through React Aria's close slot. */
const footer = (
  <>
    <Button size="sm" slot="close">
      Cancel
    </Button>
    <Button size="sm" variant="primary" slot="close">
      Apply
    </Button>
  </>
);

function dismissalProps(dismissal: (typeof dismissals)[number]): Partial<DrawerProps> {
  switch (dismissal) {
    case 'outside presses refused':
      return { isDismissable: false };
    case 'Escape refused':
      return { isKeyboardDismissDisabled: true };
    default:
      return { isDismissDisabled: true };
  }
}

function swipeProps(swipe: (typeof swipes)[number]): Partial<DrawerProps> {
  return swipe === 'snap points'
    ? { position: 'bottom', size: 'lg', snapPoints: ['50%', '100%'] }
    : { swipeDirection: 'horizontal' };
}

/** A drawer that opens a second one from its body. */
function Nested() {
  return (
    <Opener label="Edit the trip" title="Trip to Oslo" showCloseButton data-lab-drawer="outer">
      <p>Four days in October.</p>
      <DrawerTrigger>
        <Button size="sm">Choose a hotel</Button>
        <Drawer
          title="Hotels"
          position="end"
          size="sm"
          showCloseButton
          footer={footer}
          data-lab-drawer="inner"
        >
          <p>Harbour view, old town or near the station.</p>
        </Drawer>
      </DrawerTrigger>
    </Opener>
  );
}

/** A drawer the page opens itself, with a body that closes it. */
function Controlled() {
  const [isOpen, setOpen] = useState(false);
  const [choice, setChoice] = useState('none');
  return (
    <div>
      <Button size="sm" data-lab-open="controlled" onPress={() => setOpen(true)}>
        Pick a city
      </Button>
      <p>
        Open: <output data-lab-output="controlled">{isOpen ? 'open' : 'closed'}</output>, picked:{' '}
        <output data-lab-output="choice">{choice}</output>
      </p>
      <Drawer
        isOpen={isOpen}
        onOpenChange={setOpen}
        position="start"
        title="Cities"
        showCloseButton
        data-lab-drawer="controlled"
      >
        {({ close }) =>
          ['Lisbon', 'Oslo', 'Kyoto'].map((city) => (
            <p key={city}>
              <Button
                size="sm"
                onPress={() => {
                  setChoice(city);
                  close();
                }}
              >
                {city}
              </Button>
            </p>
          ))
        }
      </Drawer>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Positions and sizes"
      description="Each cell opens a drawer from that edge at that size. Escape, the close button, Cancel, Apply, a press on the backdrop or a swipe toward the edge closes it, and focus returns to the button."
    >
      <StateMatrix
        axes={{ position: positions, size: sizes }}
        render={({ position, size }) => (
          <Opener
            label="Filters"
            position={position}
            size={size}
            title="Filters"
            showCloseButton
            footer={footer}
            data-lab-drawer={`${position}-${size}`}
          >
            <label>
              City <input defaultValue="Lisbon" />
            </label>
            <p>Within 50 km, open this weekend.</p>
          </Opener>
        )}
      />
    </LabSection>
    <LabSection
      title="Dismissal"
      description="A drawer that ignores presses outside it, one that ignores Escape, and one that refuses every dismissal and closes only from its footer."
    >
      <StateMatrix
        axes={{ dismissal: dismissals }}
        render={({ dismissal }) => (
          <Opener
            label={dismissal}
            title="Draft"
            showCloseButton
            footer={
              <Button size="sm" variant="primary" slot="close">
                Send
              </Button>
            }
            data-lab-drawer={dismissal}
            {...dismissalProps(dismissal)}
          >
            <p>Your postcard is not sent yet.</p>
          </Opener>
        )}
      />
    </LabSection>
    <LabSection
      title="Swiping and snap points"
      description="A drawer that swipes away to either side, and a bottom drawer that opens at half its height and swipes up to its full height."
    >
      <StateMatrix
        axes={{ swipe: swipes }}
        render={({ swipe }) => (
          <Opener
            label={swipe}
            title="Itinerary"
            showCloseButton
            data-lab-drawer={swipe}
            {...swipeProps(swipe)}
          >
            {['Day 1: old town', 'Day 2: museums', 'Day 3: islands', 'Day 4: markets'].map(
              (day) => (
                <p key={day}>{day}</p>
              ),
            )}
          </Opener>
        )}
      />
    </LabSection>
    <LabSection
      title="Nested drawers"
      description="A drawer opened from a drawer stacks above it; Escape closes only the top one and focus returns inside the one beneath."
    >
      <Nested />
    </LabSection>
    <LabSection
      title="Escape handled inside"
      description="Type in Search, then press Escape: the field clears its draft and the drawer stays open; the next Escape closes it."
    >
      <Opener label="Search drawer" title="Search" data-lab-drawer="handled">
        <DraftField label="Search" />
      </Opener>
    </LabSection>
    <LabSection
      title="Controlled drawer"
      description="The page opens the drawer; picking a city closes it through the body's close function."
    >
      <Controlled />
    </LabSection>
  </>,
);
