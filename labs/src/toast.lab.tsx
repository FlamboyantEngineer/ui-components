import { HelpGlyph } from '../../src/core/glyphs.js';
import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Drawer, DrawerTrigger } from '../../src/components/drawer/drawer.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import { PortalContainerProvider } from '../../src/components/portal/portal.js';
import {
  ToastList,
  ToastRegion,
  createToastQueue,
  type ToastContent,
  type ToastQueue,
  type ToastTone,
} from '../../src/components/toast/toast.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const tones: ToastTone[] = ['info', 'success', 'warning', 'danger'];
const contents = ['title', 'description', 'action', 'custom icon'] as const;

const titles: Record<ToastTone, string> = {
  info: 'Draft saved',
  success: 'Report.pdf uploaded',
  warning: 'Storage almost full',
  danger: 'Upload failed',
};

const previewQueues = new Map<string, ToastQueue>();

/** One queue per matrix cell, holding a single persistent toast drawn in place. */
function previewQueue(key: string, content: ToastContent): ToastQueue {
  let queue = previewQueues.get(key);
  if (!queue) {
    queue = createToastQueue({ defaultTimeout: 0 });
    queue.add(content);
    previewQueues.set(key, queue);
  }
  return queue;
}

function previewContent(tone: ToastTone, content: (typeof contents)[number]): ToastContent {
  return {
    tone,
    title: titles[tone],
    ...(content !== 'title' ? { description: 'Changes to the city list were kept.' } : {}),
    ...(content === 'action' ? { action: { label: 'Undo', onAction: () => {} } } : {}),
    ...(content === 'custom icon' ? { icon: HelpGlyph } : {}),
  };
}

const liveQueue = createToastQueue({ maxVisibleToasts: 4 });

function ProgressControls() {
  const upload = useRef<{ key: string; step: number } | null>(null);
  const settle = useRef<{ resolve: () => void; reject: () => void } | null>(null);
  return (
    <p>
      <Button
        size="sm"
        data-lab-push="pending"
        onPress={() => {
          upload.current = {
            step: 1,
            key: liveQueue.add({ title: 'Uploading 1 of 3', isPending: true }),
          };
        }}
      >
        Push pending
      </Button>{' '}
      <Button
        size="sm"
        data-lab-action="advance"
        onPress={() => {
          const current = upload.current;
          if (!current) return;
          current.step += 1;
          liveQueue.update(
            current.key,
            current.step < 3
              ? { title: `Uploading ${current.step} of 3`, isPending: true }
              : { tone: 'success', title: 'Three files uploaded' },
          );
        }}
      >
        Advance upload
      </Button>{' '}
      <Button
        size="sm"
        data-lab-push="promise"
        onPress={() => {
          liveQueue.promise(
            new Promise<number>((resolve, reject) => {
              settle.current = { resolve: () => resolve(12), reject: () => reject(new Error()) };
            }),
            {
              pending: { title: 'Saving recipes' },
              success: (count) => ({ title: `${count} recipes saved` }),
              error: { title: 'Recipes not saved', description: 'Check your connection.' },
            },
          );
        }}
      >
        Push promise
      </Button>{' '}
      <Button size="sm" data-lab-action="resolve" onPress={() => settle.current?.resolve()}>
        Resolve
      </Button>{' '}
      <Button size="sm" data-lab-action="reject" onPress={() => settle.current?.reject()}>
        Reject
      </Button>
    </p>
  );
}

/** Adds a toast that stays until dismissed, with an action, from inside an open overlay. */
function PushFromOverlay({ from }: { from: 'drawer' | 'dialog' }) {
  return (
    <Button
      size="sm"
      data-lab-push={from}
      onPress={() =>
        liveQueue.add(
          {
            title: `Pushed from the ${from}`,
            description: 'The toast stays above it.',
            action: { label: 'Undo', onAction: () => {} },
          },
          { timeout: 0 },
        )
      }
    >
      Push a toast
    </Button>
  );
}

function OverlayDemo() {
  return (
    <p data-lab-demo="overlays">
      <DrawerTrigger>
        <Button size="sm" data-lab-open="drawer">
          Open drawer
        </Button>
        <Drawer title="City list" size="lg" showCloseButton data-lab-drawer="toast">
          <PushFromOverlay from="drawer" />
        </Drawer>
      </DrawerTrigger>{' '}
      <ModalTrigger>
        <Button size="sm" data-lab-open="dialog">
          Open dialog
        </Button>
        <Modal title="Edit city" data-lab-modal="toast">
          <PushFromOverlay from="dialog" />
        </Modal>
      </ModalTrigger>
    </p>
  );
}

const frameQueue = createToastQueue({ defaultTimeout: 0 });

/** A region whose container is the body of a same-origin frame, another window's element. */
function FrameDemo() {
  const [body, setBody] = useState<HTMLElement | null>(null);
  return (
    <div data-lab-demo="frame">
      <Button size="sm" onPress={() => frameQueue.add({ title: 'Saved in the frame' })}>
        Push into the frame
      </Button>
      <iframe
        title="Toast frame"
        srcDoc='<!doctype html><html lang="en"><title>Frame</title><main aria-label="Frame page"><h1>Frame page</h1></main></html>'
        style={{ display: 'block', width: 420, height: 160, marginTop: 8 }}
        onLoad={(event) => setBody(event.currentTarget.contentDocument?.body ?? null)}
      />
      <PortalContainerProvider container={body}>
        <ToastRegion queue={frameQueue} />
      </PortalContainerProvider>
    </div>
  );
}

const shownAgainQueue = createToastQueue({ maxVisibleToasts: 1 });

/**
 * One toast at a time: a timed toast covered by a newer one, or hidden with its list, runs on with
 * the time that remained once it shows again.
 */
function ShownAgainDemo() {
  const [isListShown, setListShown] = useState(true);
  const cover = useRef('');
  return (
    <div data-lab-demo="shown-again">
      <p>
        <Button
          size="sm"
          data-lab-push="timed"
          onPress={() => shownAgainQueue.add({ title: 'Export ready' }, { timeout: 4000 })}
        >
          Push four-second toast
        </Button>{' '}
        <Button
          size="sm"
          data-lab-push="cover"
          onPress={() => {
            cover.current = shownAgainQueue.add({ title: 'Covering toast' }, { timeout: 0 });
          }}
        >
          Cover it
        </Button>{' '}
        <Button
          size="sm"
          data-lab-action="uncover"
          onPress={() => shownAgainQueue.close(cover.current)}
        >
          Close the cover
        </Button>{' '}
        <Button size="sm" data-lab-action="toggle-list" onPress={() => setListShown(!isListShown)}>
          {isListShown ? 'Hide list' : 'Show list'}
        </Button>
      </p>
      <div style={{ width: 360, minHeight: 80 }}>
        {isListShown ? <ToastList queue={shownAgainQueue} data-lab-list="shown-again" /> : null}
      </div>
    </div>
  );
}

const leavingQueue = createToastQueue({ defaultTimeout: 0 });

/**
 * A page that owns its toast list: the toast's action leaves the page in the same press that closes
 * the toast, and the toast's onClose still runs once.
 */
function LeavingPageDemo() {
  const [page, setPage] = useState<'list' | 'trash'>('list');
  const [closedCount, setClosedCount] = useState(0);
  return (
    <div data-lab-demo="leaving-page">
      <p>
        <Button
          size="sm"
          data-lab-push="leaving"
          onPress={() => {
            setPage('list');
            leavingQueue.add(
              {
                title: 'Row deleted',
                action: { label: 'Open trash', onAction: () => setPage('trash') },
              },
              { onClose: () => setClosedCount((count) => count + 1) },
            );
          }}
        >
          Delete a row
        </Button>{' '}
        <span data-lab-output="closed">Toasts closed: {closedCount}</span>
      </p>
      <div style={{ width: 360, minHeight: 80 }}>
        {page === 'list' ? <ToastList queue={leavingQueue} /> : <p>Trash opened.</p>}
      </div>
    </div>
  );
}

const listQueue = createToastQueue({ defaultTimeout: 0 });
for (const [index, tone] of tones.entries()) {
  listQueue.add({
    tone,
    title: titles[tone],
    description: index === 1 ? 'Changes to the city list were kept.' : undefined,
    action: index === 3 ? { label: 'Retry', onAction: () => {} } : undefined,
  });
}

/** Four permanent toasts in a narrow list placed in the page: every one shows, none is piled. */
function InPlaceListDemo() {
  return (
    <div data-lab-demo="in-place-list" style={{ width: 280 }}>
      <ToastList queue={listQueue} />
    </div>
  );
}

function LiveDemo() {
  const progress = useRef(0);
  return (
    <div data-lab-demo="live">
      <p>
        {tones.map((tone) => (
          <span key={tone}>
            <Button
              size="sm"
              data-lab-push={tone}
              onPress={() =>
                liveQueue.add({ tone, title: titles[tone], description: 'Pushed from the lab.' })
              }
            >
              Push {tone}
            </Button>{' '}
          </span>
        ))}
      </p>
      <p>
        <Button
          size="sm"
          data-lab-push="action"
          onPress={() =>
            liveQueue.add(
              { title: 'Row deleted', action: { label: 'Undo', onAction: () => {} } },
              { timeout: 0 },
            )
          }
        >
          Push with action
        </Button>{' '}
        <Button
          size="sm"
          data-lab-push="short"
          onPress={() => liveQueue.add({ tone: 'success', title: 'Copied' }, { timeout: 1500 })}
        >
          Push short-lived
        </Button>{' '}
        <Button
          size="sm"
          data-lab-push="replace"
          onPress={() => {
            progress.current = (progress.current % 3) + 1;
            liveQueue.add(
              { title: `Uploading ${progress.current} of 3` },
              { id: 'upload', timeout: 0 },
            );
          }}
        >
          Push replacing
        </Button>{' '}
        <Button
          size="sm"
          data-lab-push="follow-up"
          onPress={() =>
            liveQueue.add(
              { title: 'Import finished' },
              {
                timeout: 0,
                onClose: () => liveQueue.add({ title: 'Review the imported rows' }, { timeout: 0 }),
              },
            )
          }
        >
          Push with follow-up
        </Button>{' '}
        <Button size="sm" variant="ghost" onPress={() => liveQueue.clear()}>
          Clear all
        </Button>
      </p>
      <ProgressControls />
      <ToastRegion queue={liveQueue} data-lab-region="live" />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Tones and content"
      description="Each tone with a title only, a description, an action and a custom icon, drawn in place."
    >
      <StateMatrix
        axes={{ tone: tones, content: contents }}
        render={({ tone, content }) => (
          <div style={{ width: 360 }}>
            <ToastList queue={previewQueue(`${tone}-${content}`, previewContent(tone, content))} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="List in place"
      description="A ToastList with four permanent toasts in a 280-pixel column. A list in place never piles: every toast, its action and its dismiss button show in the flow and take focus in order."
    >
      <InPlaceListDemo />
    </LabSection>
    <LabSection
      title="Live region"
      description="Push toasts into the region at the end of the page: they pile up, and hovering or focusing the pile spreads it out and pauses their five-second lifetime, and the pointer can cross the gaps between spread toasts to reach an older one. Closing the follow-up toast adds the next one from its onClose. Pending toasts update in place, promise toasts settle into success or error, and a drag to the right swipes a toast away. Cancelling a swipe returns the toast to rest."
    >
      <LiveDemo />
    </LabSection>
    <LabSection
      title="Shown again"
      description="A queue that shows one toast at a time. Push the four-second toast, cover it with a newer one or hide the list for a while, then close the cover or show the list again: the toast runs on with the time it had left instead of starting over."
    >
      <ShownAgainDemo />
    </LabSection>
    <LabSection
      title="Leaving the page"
      description="The toast list belongs to a page, and the toast's Open trash action leaves that page in the same press that closes the toast: the toast is removed with the page and its onClose still runs once."
    >
      <LeavingPageDemo />
    </LabSection>
    <LabSection
      title="Inside a frame"
      description="The container is the body of a same-origin frame: the region renders there, on its toast layer, and nothing renders while the frame loads."
    >
      <FrameDemo />
    </LabSection>
    <LabSection
      title="Over drawers and dialogs"
      description="Open the drawer or the dialog and push a toast from inside it: the region sits on the toast overlay layer, so the toast stacks above the open overlay, its Undo and Dismiss buttons take presses where they overlap the drawer, F6 then Tab reach them from the open overlay, and using them leaves the overlay open."
    >
      <OverlayDemo />
    </LabSection>
  </>,
);
