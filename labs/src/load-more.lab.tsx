import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { LoadMore } from '../../src/components/load-more/load-more.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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

function PagedList() {
  const [loaded, setLoaded] = useState(pageSize);
  const [waiting, setWaiting] = useState(false);
  const deliver = useRef<(() => void) | null>(null);
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
          onLoadMore={() =>
            new Promise<void>((resolve) => {
              deliver.current = () => {
                setLoaded((count) => Math.min(fruit.length, count + pageSize));
                resolve();
              };
              setWaiting(true);
            })
          }
        />
      ) : (
        <p data-lab-output="done">All fruit loaded.</p>
      )}{' '}
      <Button
        size="sm"
        variant="tertiary"
        data-lab-action="deliver"
        isDisabled={!waiting}
        onPress={() => {
          deliver.current?.();
          deliver.current = null;
          setWaiting(false);
        }}
      >
        Deliver page
      </Button>
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
  const [waiting, setWaiting] = useState(false);
  const deliver = useRef<(() => void) | null>(null);
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
            onLoadMore={() =>
              new Promise<void>((resolve) => {
                deliver.current = () => {
                  setLoaded((count) => Math.min(cities.length, count + cityPage));
                  resolve();
                };
                setWaiting(true);
              })
            }
          />
        ) : (
          <p data-lab-output="done">All cities loaded.</p>
        )}
      </div>
      <Button
        size="sm"
        variant="tertiary"
        data-lab-action="deliver-cities"
        isDisabled={!waiting}
        onPress={() => {
          deliver.current?.();
          deliver.current = null;
          setWaiting(false);
        }}
      >
        Deliver page
      </Button>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States and counts"
      description="Idle, pending and disabled, with and without a count."
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
      description="Small and secondary by default; any Button size and variant."
    >
      <StateMatrix
        axes={{ variant: ['secondary', 'ghost'], size: ['xs', 'sm', 'md', 'lg'] }}
        render={({ variant, size }) => <LoadMore variant={variant} size={size} />}
      />
    </LabSection>
    <LabSection
      title="Paging"
      description="Each press requests four more fruit and stays pending until Deliver page answers the request; the control disappears when the list is complete."
    >
      <PagedList />
    </LabSection>
    <LabSection
      title="Loading on view"
      description="With autoLoad, scrolling the control into view inside the frame requests the next eight cities; it stays pending until Deliver page answers, and remains a button for keyboard users."
    >
      <EndlessList demo="endless" />
    </LabSection>
    <LabSection
      title="Loading ahead"
      description="With scrollOffset={0.5}, the last eight cities are requested once the control is within half a frame height below the visible area, before it scrolls into view."
    >
      <EndlessList demo="ahead" scrollOffset={0.5} initial={cityPage * 2} />
    </LabSection>
  </>,
);
