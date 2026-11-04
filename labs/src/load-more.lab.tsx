import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { LoadMore } from '../../src/components/load-more/load-more.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const fruit = [
  'Apple',
  'Apricot',
  'Banana',
  'Cherry',
  'Fig',
  'Grape',
  'Kiwi',
  'Lemon',
  'Mango',
  'Orange',
  'Pear',
  'Plum',
];
const pageSize = 4;

/**
 * A page request the reader answers: Deliver page resolves it with the next page, Fail the request
 * rejects it, and the control hands the rejection to `onError`, shown as the handled error.
 */
function usePageRequest(onDeliver: () => void) {
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('none');
  const settle = useRef<{ resolve: () => void; reject: (reason: Error) => void } | null>(null);
  const answer = (outcome: 'deliver' | 'fail') => {
    const current = settle.current;
    settle.current = null;
    setWaiting(false);
    if (outcome === 'fail') {
      current?.reject(new Error('The server did not answer'));
      return;
    }
    onDeliver();
    current?.resolve();
  };
  const request = () =>
    new Promise<void>((resolve, reject) => {
      settle.current = { resolve, reject };
      setWaiting(true);
    });
  const onError = (reason: unknown) =>
    setError(reason instanceof Error ? reason.message : 'unknown');
  return { waiting, error, request, onError, answer };
}

/** The buttons that answer a pending page request, and the last error the control handled. */
function RequestAnswers({
  waiting,
  error,
  answer,
  deliverAction,
}: Pick<ReturnType<typeof usePageRequest>, 'waiting' | 'error' | 'answer'> & {
  deliverAction: string;
}) {
  return (
    <>
      <Button
        size="sm"
        variant="tertiary"
        data-lab-action={deliverAction}
        isDisabled={!waiting}
        onPress={() => answer('deliver')}
      >
        Deliver page
      </Button>{' '}
      <Button
        size="sm"
        variant="tertiary"
        data-lab-action="fail"
        isDisabled={!waiting}
        onPress={() => answer('fail')}
      >
        Fail the request
      </Button>
      <p>
        Handled error: <output data-lab-output="error">{error}</output>
      </p>
    </>
  );
}

function PagedList() {
  const [loaded, setLoaded] = useState(pageSize);
  const { waiting, error, request, onError, answer } = usePageRequest(() =>
    setLoaded((count) => Math.min(fruit.length, count + pageSize)),
  );
  const remaining = fruit.length - loaded;
  return (
    <div data-lab-demo="paged">
      <ul data-lab-output="items">
        {fruit.slice(0, loaded).map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      {remaining > 0 ? (
        <LoadMore
          data-lab-action="load"
          itemLabel="fruit"
          remainingCount={remaining}
          pendingLabel="Loading fruit"
          onLoadMore={request}
          onError={onError}
        />
      ) : (
        <p data-lab-output="done">All fruit loaded.</p>
      )}{' '}
      <RequestAnswers waiting={waiting} error={error} answer={answer} deliverAction="deliver" />
    </div>
  );
}

const cities = [
  'Amsterdam',
  'Athens',
  'Berlin',
  'Bogota',
  'Cairo',
  'Dublin',
  'Hanoi',
  'Havana',
  'Lima',
  'Lisbon',
  'Madrid',
  'Nairobi',
  'Oslo',
  'Paris',
  'Prague',
  'Quito',
  'Riga',
  'Rome',
  'Seoul',
  'Tokyo',
  'Tunis',
  'Vienna',
  'Warsaw',
  'Zagreb',
];
const cityPage = 8;

function EndlessList({
  demo,
  scrollOffset,
  initial = cityPage,
}: {
  demo: string;
  scrollOffset?: number;
  initial?: number;
}) {
  const [loaded, setLoaded] = useState(initial);
  const { waiting, error, request, onError, answer } = usePageRequest(() =>
    setLoaded((count) => Math.min(cities.length, count + cityPage)),
  );
  const remaining = cities.length - loaded;
  return (
    <div data-lab-demo={demo}>
      {/* Lab-only scrolling frame; the control loads when it scrolls into view inside it. */}
      <div
        data-lab-scroller=""
        role="region"
        aria-label={scrollOffset === undefined ? 'Cities' : 'Cities loaded ahead'}
        tabIndex={0}
        style={{ height: 160, overflow: 'auto', border: '1px solid' }}
      >
        <ul data-lab-output="cities">
          {cities.slice(0, loaded).map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        {remaining > 0 ? (
          <LoadMore
            autoLoad
            scrollOffset={scrollOffset}
            itemLabel="cities"
            remainingCount={remaining}
            onLoadMore={request}
            onError={onError}
          />
        ) : (
          <p data-lab-output="done">All cities loaded.</p>
        )}
      </div>
      <RequestAnswers
        waiting={waiting}
        error={error}
        answer={answer}
        deliverAction="deliver-cities"
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States and counts"
      description="Idle, pending and disabled, with and without a count. Disabled controls ignore presses and visibility reports until enabled again."
    >
      <StateMatrix
        axes={{
          state: ['idle', 'pending', 'disabled'],
          count: ['no count', 'zero', '12 remaining'],
        }}
        render={({ state, count }) => (
          <LoadMore
            itemLabel="messages"
            isPending={state === 'pending'}
            isDisabled={state === 'disabled'}
            remainingCount={count === 'zero' ? 0 : count === '12 remaining' ? 12 : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Variants and sizes"
      description="Small and secondary by default; every Button variant at every size."
    >
      <StateMatrix
        axes={{
          variant: [
            'primary',
            'secondary',
            'tertiary',
            'danger',
            'ghost',
            'accent',
            'chip',
            'link',
            'bare',
          ],
          size: ['xs', 'sm', 'md', 'lg'],
        }}
        render={({ variant, size }) => <LoadMore variant={variant} size={size} />}
      />
    </LabSection>
    <LabSection
      title="Caller label"
      description="A label replaces the provider's Load more text; the remaining count and the item label still follow it."
    >
      <StateMatrix
        axes={{ label: ['default', 'Show older messages'], count: ['no count', '12 remaining'] }}
        render={({ label, count }) => (
          <LoadMore
            label={label === 'default' ? undefined : label}
            itemLabel="messages"
            remainingCount={count === '12 remaining' ? 12 : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Paging"
      description="Each press requests four more fruit and stays pending until Deliver page or Fail the request answers it. A failed request reaches onError, shown as the handled error, and the control is ready to retry; the control disappears when the list is complete."
    >
      <PagedList />
    </LabSection>
    <LabSection
      title="Loading on view"
      description="With autoLoad, scrolling the control into view inside the frame requests the next eight cities; it stays pending until Deliver page or Fail the request answers, and remains a button for keyboard users. A failed request reaches onError and is not repeated on its own: press the control, or scroll away and back, to retry."
    >
      <EndlessList demo="endless" />
    </LabSection>
    <LabSection
      title="Loading ahead"
      description="With scrollOffset={0.5}, the last eight cities are requested once the control is within half a frame height below the visible area, before it scrolls into view. This distance follows the frame's height when resized, independently of its width."
    >
      <EndlessList demo="ahead" scrollOffset={0.5} initial={cityPage * 2} />
    </LabSection>
  </>,
);
