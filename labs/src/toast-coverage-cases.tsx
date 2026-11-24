// Toast cases for the swipe that dismisses a toast (direction, threshold, reading direction, in a
// list or a region) and for updates that keep, restart or stop a toast's timer.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { Switch } from '../../src/components/switch/switch.js';
import {
  createToastQueue,
  ToastList,
  ToastRegion,
  type ToastSwipeDirection,
} from '../../src/components/toast/toast.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const swipeQueue = createToastQueue({ defaultTimeout: 0 });
const directions: readonly ToastSwipeDirection[] = ['start', 'end', 'left', 'right', 'up', 'down'];

/** Adds toasts to a list in place or a region, swiped away in the chosen direction. */
function SwipeSettings() {
  const [direction, setDirection] = useState<ToastSwipeDirection>('end');
  const [threshold, setThreshold] = useState(120);
  const [isRtl, setRtl] = useState(false);
  const [inRegion, setInRegion] = useState(false);
  const [closed, setClosed] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const settings = { swipeDirection: direction, swipeThreshold: threshold };
  return (
    <div data-lab-demo="toast-swipe">
      <div role="group" aria-label="Swipe direction">
        {directions.map((option) => (
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
      <NumberField
        label="Swipe threshold (px)"
        size="sm"
        minValue={10}
        step={10}
        value={threshold}
        onChange={(value) => setThreshold(value ?? 50)}
      />
      <Switch isSelected={isRtl} onChange={setRtl}>
        Right to left
      </Switch>{' '}
      <Switch isSelected={inRegion} onChange={setInRegion}>
        In a region
      </Switch>{' '}
      <Button
        size="sm"
        onPress={() => {
          const number = count + 1;
          setCount(number);
          swipeQueue.add(
            { title: `Crate ${String(number)} packed`, description: 'Swipe it away.' },
            { onClose: () => setClosed((list) => [...list, `crate ${String(number)}`]) },
          );
        }}
      >
        Add a toast
      </Button>
      <UiProvider locale={isRtl ? 'he-IL' : 'en-US'}>
        <div dir={isRtl ? 'rtl' : 'ltr'} style={{ width: 320 }}>
          {inRegion ? (
            <ToastRegion queue={swipeQueue} {...settings} data-lab-region="swipe" />
          ) : (
            <ToastList queue={swipeQueue} {...settings} data-lab-list="swipe" />
          )}
        </div>
      </UiProvider>
      <LabOutput name="Swipe settings">
        {direction}, {threshold}px, {isRtl ? 'right to left' : 'left to right'},{' '}
        {inRegion ? 'region' : 'list'}
      </LabOutput>
      <LabOutput name="Swiped away">{closed.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

const timerQueue = createToastQueue({ defaultTimeout: 3000 });

/** A three-second toast whose updates keep its timer, restart it or stop it. */
function TimerUpdates() {
  const [key, setKey] = useState<string | null>(null);
  const [result, setResult] = useState('none');
  const update = (label: string, options?: { timeout: number }) => {
    if (key) timerQueue.update(key, { title: 'Upload', description: label }, options);
  };
  return (
    <div data-lab-demo="toast-timer">
      <Button
        size="sm"
        onPress={() => {
          const start = performance.now();
          setResult('open');
          setKey(
            timerQueue.add(
              { title: 'Upload', description: 'Started; closes in 3 s.' },
              {
                onClose: () => {
                  const seconds = Math.round((performance.now() - start) / 500) / 2;
                  setResult(`closed after ${String(seconds)} s`);
                  setKey(null);
                },
              },
            ),
          );
        }}
      >
        Add a 3 s toast
      </Button>{' '}
      <Button size="sm" variant="secondary" isDisabled={!key} onPress={() => update('Half done.')}>
        Update, keep the timer
      </Button>{' '}
      <Button
        size="sm"
        variant="secondary"
        isDisabled={!key}
        onPress={() => update('Restarted: 5 s from now.', { timeout: 5000 })}
      >
        Update, restart at 5 s
      </Button>{' '}
      <Button
        size="sm"
        variant="secondary"
        isDisabled={!key}
        onPress={() => update('Kept until dismissed.', { timeout: 0 })}
      >
        Update, keep it open
      </Button>
      <ToastList queue={timerQueue} data-lab-list="timer" />
      <LabOutput name="Timer result">{result}</LabOutput>
    </div>
  );
}

function ToastBatch() {
  const [queue] = useState(() => createToastQueue({ defaultTimeout: 0 }));
  const [actions, setActions] = useState(0);
  const [closes, setCloses] = useState(0);
  return (
    <div data-lab-demo="toast-batch">
      <Button
        size="sm"
        onPress={() => {
          queue.clear();
          for (let number = 1; number <= 18; number += 1) {
            queue.add({ title: `Notification ${String(number)}` });
          }
        }}
      >
        Add 18 notifications
      </Button>{' '}
      <Button
        size="sm"
        onPress={() => {
          queue.add(
            {
              title: 'File archived',
              action: { label: 'Undo archive', onAction: () => setActions((count) => count + 1) },
            },
            { onClose: () => setCloses((count) => count + 1) },
          );
        }}
      >
        Show archive notification
      </Button>{' '}
      <Button size="sm" variant="secondary" onPress={() => queue.clear()}>
        Clear notifications
      </Button>
      <ToastRegion aria-label="Batch notifications" queue={queue} />
      <LabOutput name="Undo count">{actions}</LabOutput>
      <LabOutput name="Archive dismissal count">{closes}</LabOutput>
    </div>
  );
}

export function ToastCoverageSections() {
  return (
    <>
      <LabSection
        title="Swipe direction and threshold"
        description="swipeDirection and swipeThreshold on a ToastList in place, or on a ToastRegion with In a region. start and end follow the reading direction (Right to left switches the locale), left, right, up and down are physical; each toast shows its resolved direction in data-swipe-direction. A drag shorter than the threshold springs back; a longer one closes the toast and calls its onClose, listed below."
      >
        <SwipeSettings />
      </LabSection>
      <LabSection
        title="Updates and timers"
        description="update(key, content) changes the toast in place and keeps its running timer; update(key, content, { timeout }) restarts it with a new lifetime counted from the update, and timeout 0 keeps it until dismissed. The result says how long after it was added the toast closed."
      >
        <TimerUpdates />
      </LabSection>
      <LabSection
        title="Notification batches"
        description="Focus the notification region with F6, then Tab to reach older notifications. The list scrolls when the viewport cannot fit the stack. Undo archive runs once, even when pressed again before the notification leaves."
      >
        <ToastBatch />
      </LabSection>
    </>
  );
}
