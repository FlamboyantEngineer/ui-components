import { useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import { Table } from '../../src/components/table/table.js';
import { Menu, MenuPopover, MenuTrigger } from '../../src/components/menu/menu.js';
import {
  LoadingCard,
  LoadingOverlay,
  LoadingRegion,
  type LoadingCardProps,
} from '../../src/components/loading-overlay/loading-overlay.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { ShadowRootHost } from './shadow-root-host.js';

const progressStates = ['indeterminate', 'determinate'] as const;
const longHint = 'Measuring the layout of every page in the quarterly report';

function cardProps(progress: (typeof progressStates)[number], extras: string): LoadingCardProps {
  return {
    label: 'Loading report',
    ...(progress === 'determinate'
      ? { progress: { value: 42, valueLabel: 'Estimated progress: 42%' } }
      : {}),
    ...(extras !== 'label only' ? { description: 'Preparing pages and figures.' } : {}),
    ...(extras === 'hint and step' ? { hint: longHint, step: { current: 6, total: 9 } } : {}),
  };
}

/** A region rendered into an open shadow root, as a web component would hold it. */
function ShadowRegionDemo() {
  const [isSaving, setSaving] = useState(false);
  useEffect(() => {
    if (!isSaving) return undefined;
    // Lab-only stand-in for the save finishing.
    const timer = setTimeout(() => setSaving(false), 1500);
    return () => clearTimeout(timer);
  }, [isSaving]);
  const region = (
    <LoadingRegion isLoading={isSaving} label="Saving note">
      <p>
        <label>
          Note <input name="note" defaultValue="Bring the charts" />
        </label>
      </p>
    </LoadingRegion>
  );
  return (
    <>
      <p>
        <Button onPress={() => setSaving(true)}>Save note</Button>
      </p>
      <ShadowRootHost demo="shadow-region">{region}</ShadowRootHost>
    </>
  );
}

function RegionDemo() {
  const [isLoading, setLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  useEffect(() => {
    if (!isSaving) return undefined;
    // Lab-only stand-in for the save finishing.
    const timer = setTimeout(() => setSaving(false), 1500);
    return () => clearTimeout(timer);
  }, [isSaving]);
  return (
    <div data-lab-demo="region">
      <p>
        <Button onPress={() => setLoading((value) => !value)}>
          {isLoading ? 'Stop loading' : 'Start loading'}
        </Button>
      </p>
      <LoadingRegion
        isLoading={isLoading || isSaving}
        label="Saving city"
        hint="Writing to the server"
        step={{ current: 1, total: 2 }}
        data-lab-region="form"
      >
        <div style={{ width: 320, minHeight: 200 }}>
          <p>
            <label>
              City <input name="city" defaultValue="Lisbon" />
            </label>
          </p>
          <p>
            <Button variant="primary" onPress={() => setSaving(true)}>
              Apply
            </Button>
          </p>
        </div>
      </LoadingRegion>
    </div>
  );
}

interface Fruit {
  id: string;
  name: string;
  colour: string;
  origin: string;
  price: string;
}

const fruitRows: Fruit[] = [
  { id: 'apple', name: 'Apple', colour: 'Red', origin: 'Portugal', price: '1.20' },
  { id: 'pear', name: 'Pear', colour: 'Green', origin: 'Spain', price: '1.40' },
  { id: 'plum', name: 'Plum', colour: 'Purple', origin: 'France', price: '2.10' },
  { id: 'fig', name: 'Fig', colour: 'Purple', origin: 'Greece', price: '3.30' },
];

/** A table with a sticky header, pinned columns and column groups under a loading region. */
function PinnedTableDemo() {
  const [isLoading, setLoading] = useState(true);
  return (
    <div data-lab-demo="pinned-table">
      <p>
        <Button onPress={() => setLoading((value) => !value)}>
          {isLoading ? 'Stop loading' : 'Start loading'}
        </Button>
      </p>
      <LoadingRegion isLoading={isLoading} label="Refreshing prices">
        <div style={{ width: 420, height: 200 }}>
          <Table
            aria-label="Fruit prices"
            rows={fruitRows}
            stickyHeader
            size="sm"
            columns={[
              { id: 'name', header: 'Name', pin: 'start', width: 120 },
              { id: 'colour', header: 'Colour', width: 140 },
              { id: 'origin', header: 'Origin', width: 140 },
              { id: 'price', header: 'Price', width: 120, align: 'end', pin: 'end' },
            ]}
            columnGroups={[{ id: 'look', header: 'Look', columns: ['colour', 'origin'] }]}
          />
        </div>
      </LoadingRegion>
    </div>
  );
}

/** Lab-only stand-in for two loads finishing after the given delays. */
function useTimedLoad(): [boolean, (duration: number) => void] {
  const [duration, setDuration] = useState<number | null>(null);
  useEffect(() => {
    if (duration === null) return undefined;
    const timer = setTimeout(() => setDuration(null), duration);
    return () => clearTimeout(timer);
  }, [duration]);
  return [duration !== null, setDuration];
}

function NestedDemo() {
  const [isOuterLoading, startOuter] = useTimedLoad();
  const [isInnerLoading, startInner] = useTimedLoad();
  const save = (outer: number, inner: number) => {
    startOuter(outer);
    startInner(inner);
  };
  return (
    <div data-lab-demo="nested-regions">
      <LoadingRegion isLoading={isOuterLoading} label="Loading panel" data-lab-region="outer">
        <div style={{ width: 360, minHeight: 240, padding: 12 }}>
          <p>Panel</p>
          <LoadingRegion isLoading={isInnerLoading} label="Saving note" data-lab-region="inner">
            <div style={{ minHeight: 140 }}>
              <p>
                <label>
                  Note <input name="note" defaultValue="Plums" />
                </label>
              </p>
              <p>
                <Button onPress={() => save(1600, 800)}>Save, note first</Button>{' '}
                <Button onPress={() => save(800, 1600)}>Save, panel first</Button>
              </p>
            </div>
          </LoadingRegion>
        </div>
      </LoadingRegion>
    </div>
  );
}

function MenuDemo() {
  const [isLoading, startLoading] = useTimedLoad();
  const [isScheduled, setScheduled] = useState(false);
  const [lastAction, setLastAction] = useState('none');
  useEffect(() => {
    if (!isScheduled) return undefined;
    // Lab-only stand-in for a refresh that starts while the menu is open.
    const timer = setTimeout(() => {
      setScheduled(false);
      startLoading(1500);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isScheduled, startLoading]);
  return (
    <div data-lab-demo="menu-in-region">
      <p>
        <Button onPress={() => setScheduled(true)}>Refresh in a second</Button>
      </p>
      <LoadingRegion isLoading={isLoading} label="Refreshing">
        <div style={{ width: 320, minHeight: 120 }}>
          <MenuTrigger>
            <Button>Actions</Button>
            <MenuPopover>
              <Menu
                aria-label="Actions"
                items={[
                  { id: 'run', label: 'Run action' },
                  { id: 'more', label: 'More', items: [{ id: 'copy', label: 'Copy' }] },
                ]}
                onAction={(key) => setLastAction(String(key))}
              />
            </MenuPopover>
          </MenuTrigger>
          <p>Last action: {lastAction}</p>
        </div>
      </LoadingRegion>
    </div>
  );
}

function DelayDemo() {
  const [isLoading, setLoading] = useState(false);
  return (
    <div data-lab-demo="delay">
      <p>
        <Button onPress={() => setLoading((value) => !value)}>
          {isLoading ? 'Stop searching' : 'Start searching'}
        </Button>
      </p>
      <LoadingRegion isLoading={isLoading} delay={500} label="Searching recipes">
        <div style={{ width: 320, height: 160 }}>
          <p>Soups, salads and stews.</p>
          <Button>Open recipe</Button>
        </div>
      </LoadingRegion>
    </div>
  );
}

function FullscreenDemo() {
  const [isLoading, setLoading] = useState(false);
  useEffect(() => {
    if (!isLoading) return undefined;
    // Lab-only stand-in for the work finishing: Escape ends it.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLoading(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isLoading]);
  return (
    <div data-lab-demo="fullscreen">
      <Button onPress={() => setLoading(true)}>Open the cookbook</Button>
      {isLoading ? (
        <LoadingOverlay fullscreen label="Opening the cookbook" data-lab-overlay="fullscreen" />
      ) : null}
    </div>
  );
}

/**
 * A region whose Edit button opens a dialog with a menu. Refresh reloads the list for three
 * seconds while the dialog stays usable; Save closes the dialog and starts the refresh at once.
 */
function DialogFromRegion() {
  const [isLoading, setLoading] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [last, setLast] = useState('none');
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = window.setTimeout(() => setLoading(false), 3000);
    return () => window.clearTimeout(timer);
  }, [isLoading]);
  return (
    <div data-lab-demo="dialog-from-region">
      <LoadingRegion isLoading={isLoading} label="Refreshing the list">
        <Button onPress={() => setOpen(true)}>Edit the list</Button>
        <Modal
          title="Edit the list"
          isOpen={isOpen}
          onOpenChange={setOpen}
          primaryAction={{
            label: 'Save',
            onPress: (close) => {
              close();
              setLoading(true);
            },
          }}
          data-lab-modal="from-region"
        >
          <p>
            <Button onPress={() => setLoading(true)}>Refresh the list</Button>
          </p>
          <MenuTrigger>
            <Button>Sort</Button>
            <MenuPopover>
              <Menu
                aria-label="Sort"
                items={[
                  { id: 'name', label: 'By name' },
                  { id: 'date', label: 'By date' },
                ]}
                onAction={(key) => setLast(String(key))}
              />
            </MenuPopover>
          </MenuTrigger>
        </Modal>
      </LoadingRegion>
      <p>
        Sorted: <output data-lab-output="sorted">{last}</output>
      </p>
    </div>
  );
}

/** A dialog whose Save shows a full-screen cover for two seconds over it. */
function SavingFromDialog() {
  const [isSaving, setSaving] = useState(false);
  useEffect(() => {
    if (!isSaving) return undefined;
    const timer = window.setTimeout(() => setSaving(false), 2000);
    return () => window.clearTimeout(timer);
  }, [isSaving]);
  return (
    <ModalTrigger>
      <Button>Edit the recipe</Button>
      <Modal title="Edit the recipe" cancelAction={null} data-lab-modal="saving">
        <Button onPress={() => setSaving(true)}>Save the recipe</Button>
        {isSaving ? (
          <LoadingOverlay fullscreen label="Saving the recipe" data-lab-overlay="from-dialog" />
        ) : null}
      </Modal>
    </ModalTrigger>
  );
}

mountLab(
  <>
    <LabSection
      title="Card"
      description="The status card drawn in place: indeterminate and measured progress, with optional description, hint and step."
    >
      <StateMatrix
        axes={{ extras: ['label only', 'description', 'hint and step'], progress: progressStates }}
        render={({ extras, progress }) => (
          <div style={{ width: 320 }}>
            <LoadingCard {...cardProps(progress, extras)} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Overlay"
      description="The cover over a bounded 320 × 220 surface: the card on a scrim, or the scrim alone."
    >
      <StateMatrix
        axes={{ presentation: ['card', 'scrim'], progress: progressStates }}
        render={({ presentation, progress }) => (
          <div data-lab-surface="true" style={{ position: 'relative', width: 320, height: 220 }}>
            <p>Surface content under the overlay.</p>
            <LoadingOverlay presentation={presentation} {...cardProps(progress, 'hint and step')} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Region"
      description="Idle and loading regions. While loading, the content is inert and the region is busy."
    >
      <StateMatrix
        axes={{ state: ['idle', 'loading'] }}
        render={({ state }) => (
          <LoadingRegion isLoading={state === 'loading'} label="Loading fruit">
            <div style={{ width: 320, height: 200 }}>
              <p>Apple, pear, plum.</p>
              <Button>Edit fruit</Button>
            </div>
          </LoadingRegion>
        )}
      />
    </LabSection>
    <LabSection
      title="Blocking a form"
      description="Start loading to block the form, then stop it, or press Apply to save for a moment: focus waits on the region and returns to Apply. The cover fades in and out with useEnterExit."
    >
      <RegionDemo />
    </LabSection>
    <LabSection
      title="Blocking pinned content"
      description="A table with a sticky header, pinned first and last columns and a column group, blocked while it refreshes: the cover and its card paint above the pinned header cells and the group row."
    >
      <PinnedTableDemo />
    </LabSection>
    <LabSection
      title="Nested regions"
      description="A note's region inside a panel's region. Each Save blocks both, then ends them in the named order: focus waits on whichever region still blocks and returns to the button once both end."
    >
      <NestedDemo />
    </LabSection>
    <LabSection
      title="Menus opened from the content"
      description="Press Refresh, then open Actions within a second: when the region starts loading the menu closes, focus waits on the region, and it returns to Actions once loading ends."
    >
      <MenuDemo />
    </LabSection>
    <LabSection
      title="Blocking inside a shadow root"
      description="The region lives in an open shadow root, unstyled there. Focus the note, then save it from outside (with a pointer, focus moves to the button): focus in the note waits on the region and returns to the note."
    >
      <ShadowRegionDemo />
    </LabSection>
    <LabSection
      title="Show delay"
      description="With delay={500}, the region blocks only once a search has run for half a second; stop it sooner and nothing flashes."
    >
      <DelayDemo />
    </LabSection>
    <LabSection
      title="Full screen"
      description="A full-screen overlay covers the viewport from the overlay layer until you press Escape."
    >
      <FullscreenDemo />
    </LabSection>
    <LabSection
      title="Dialog opened from a loading region"
      description="Open Edit the list, press Refresh the list, then open Sort: the dialog and its menu stay usable while the list beneath reloads. Press Save instead: the dialog closes as the list reloads, focus waits on the region and returns to Edit the list once it is ready."
    >
      <DialogFromRegion />
    </LabSection>
    <LabSection
      title="Full screen over a dialog"
      description="Open the dialog and press Save the recipe: the full-screen cover shows above the dialog for two seconds, announces its status and blocks presses to the dialog."
    >
      <SavingFromDialog />
    </LabSection>
  </>,
);
