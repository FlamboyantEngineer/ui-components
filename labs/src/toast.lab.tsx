import { useRef } from 'react';
import { Button } from '../../src/components/button/button.js';
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
    ...(content === 'custom icon' ? { icon: 'help' as const } : {}),
  };
}

const liveQueue = createToastQueue({ maxVisibleToasts: 4 });

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
        <Button size="sm" variant="ghost" onPress={() => liveQueue.clear()}>
          Clear all
        </Button>
      </p>
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
      title="Live region"
      description="Push toasts into the region at the end of the page. Hover or focus the stack to pause their five-second lifetime."
    >
      <LiveDemo />
    </LabSection>
  </>,
);
