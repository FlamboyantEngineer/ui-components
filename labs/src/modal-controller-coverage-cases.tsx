// Modal Controller cases for an entry drawn by its own `render`, and a host that subscribes to the
// controller's list of open modals.

import { useState, useSyncExternalStore } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Modal } from '../../src/components/modal/modal.js';
import {
  createModalController,
  type ModalEntry,
  type ModalEntryRenderProps,
  type ModalHandle,
  ModalHost,
} from '../../src/components/modal-controller/modal-controller.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const controller = createModalController();

const firstColours = ['Teal', 'Plum'] as const;
const moreColours = ['Teal', 'Plum', 'Amber', 'Olive'] as const;

/** A host composition drawn by `render`: a colour picker that answers with a typed result. */
function ColourPicker({
  isOpen,
  onOpenChange,
  close,
  handle,
  colours,
}: ModalEntryRenderProps<string> & { colours: readonly string[] }) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`Pick a colour (${String(colours.length)} shown)`}
      data-lab-modal="render"
    >
      <p>Entry {handle.id}, drawn by its own render function.</p>
      {colours.map((colour) => (
        <Button key={colour} size="sm" onPress={() => close(colour)}>
          {colour}
        </Button>
      ))}{' '}
      {colours.length < moreColours.length ? (
        <Button
          size="sm"
          variant="secondary"
          onPress={() =>
            handle.update({
              render: (props) => <ColourPicker {...props} colours={moreColours} />,
            })
          }
        >
          Show more colours
        </Button>
      ) : null}
    </Modal>
  );
}

/** Whether a modal with this hook is still on the page one frame after its result settles. */
async function onPageAfterClose(handle: ModalHandle<unknown>, name: string) {
  await handle.result;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector(`[data-lab-modal="${name}"]`) ? 'still on the page' : 'gone';
}

/** Opens a `render` entry, and a content entry beside it, to compare how each leaves. */
function RenderEntry() {
  const [result, setResult] = useState('none');
  const [leaving, setLeaving] = useState<string[]>([]);
  const [exits, setExits] = useState(0);
  return (
    <div data-lab-demo="render-entry">
      <Button
        size="sm"
        onPress={async () => {
          const handle = controller.open<string>({
            render: (props) => <ColourPicker {...props} colours={firstColours} />,
          });
          const [colour, place] = await Promise.all([
            handle.result,
            onPageAfterClose(handle, 'render'),
          ]);
          setResult(colour ?? 'dismissed');
          setLeaving((list) => [...list, `render entry: ${place}`]);
        }}
      >
        Pick a colour
      </Button>{' '}
      <Button
        size="sm"
        variant="secondary"
        onPress={async () => {
          const handle = controller.open({
            title: 'A content entry',
            content: <p>Drawn by the host from content; it runs its exit before leaving.</p>,
            'data-lab-modal': 'content',
            onExitComplete: () => setExits((count) => count + 1),
            primaryAction: { label: 'Done', onPress: (close) => close() },
          });
          const place = await onPageAfterClose(handle, 'content');
          setLeaving((list) => [...list, `content entry: ${place}`]);
        }}
      >
        Open a content entry
      </Button>
      <LabOutput name="Picked colour">{result}</LabOutput>
      <LabOutput name="After closing">{leaving.join(', ') || 'none'}</LabOutput>
      <LabOutput name="Content exits">{exits}</LabOutput>
    </div>
  );
}

function describe(entries: readonly ModalEntry[]): string[] {
  return entries.map((entry) =>
    'render' in entry.options ? 'custom' : String(entry.options.title),
  );
}

/** The open modals, read with `useSyncExternalStore` from `subscribe` and `getSnapshot`. */
function OpenList() {
  const entries = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const titles = describe(entries);
  return (
    <LabOutput name="Open modals">
      {String(entries.length)}
      {titles.length ? `: ${titles.join(', ')}` : ''}
    </LabOutput>
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Opens two modals, updates and closes the top one, then closes all. A blocking modal makes the
 * page inert, so the steps run on timers; every change the subscription sees is logged.
 */
function Subscription() {
  const [changes, setChanges] = useState<string[]>([]);
  const run = async () => {
    setChanges([]);
    const unsubscribe = controller.subscribe(() => {
      const titles = describe(controller.getSnapshot());
      setChanges((list) => [...list, titles.join(' and ') || 'none']);
    });
    controller.open({ title: 'Apples', content: <p>First.</p> });
    await wait(400);
    const top = controller.open({ title: 'Pears', content: <p>Second.</p> });
    await wait(400);
    top.update({ title: 'Ripe pears' });
    await wait(400);
    top.close();
    await wait(400);
    controller.closeAll();
    unsubscribe();
  };
  return (
    <div data-lab-demo="subscription">
      <Button size="sm" onPress={run}>
        Open, update and close
      </Button>
      <OpenList />
      <LabOutput name="Subscription log">{changes.join('; ') || 'none yet'}</LabOutput>
    </div>
  );
}

export function ModalControllerCoverageSections() {
  return (
    <>
      <LabSection
        title="Drawn by render"
        description="open({ render }) draws a host composition with isOpen, onOpenChange, close and handle: pick a colour to close it with a typed result, or Show more colours to replace its renderer through handle.update. A render entry leaves the page as soon as it closes; a content entry stays until its Modal ends its exit, counted by onExitComplete."
      >
        <RenderEntry />
      </LabSection>
      <LabSection
        title="Subscribing to the controller"
        description="useSyncExternalStore reads getSnapshot through subscribe to list the open modals. The button opens Apples, then Pears above it, renames Pears, closes it and then closes all, while a subscription logs the open modals after each change."
      >
        <Subscription />
      </LabSection>
      <ModalHost controller={controller} />
    </>
  );
}
