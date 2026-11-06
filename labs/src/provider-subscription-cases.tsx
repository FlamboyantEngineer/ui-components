import { memo, useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { useNow } from '../../src/core/clock.js';
import { CloseGlyph, PauseGlyph } from '../../src/core/glyphs.js';
import { UiProvider, useGlyph, useUiStorage, useUiStrings } from '../../src/core/provider.js';
import { createMemoryStorage } from '../../src/core/storage.js';

/** Counts its own commits into its output without rendering again for it. */
function useCommitCount() {
  const output = useRef<HTMLOutputElement>(null);
  const count = useRef(0);
  useEffect(() => {
    count.current += 1;
    if (output.current) output.current.textContent = String(count.current);
  });
  return output;
}

function ProbeRow({ name, value }: { name: string; value: string }) {
  const output = useCommitCount();
  return (
    <tr>
      <th scope="row">{name}</th>
      <td>{value}</td>
      <td>
        <output ref={output} data-lab-renders={name.toLowerCase()} />
      </td>
    </tr>
  );
}

const GlyphProbe = memo(function GlyphProbe() {
  const icon = useGlyph('close', CloseGlyph);
  return <ProbeRow name="Glyph" value={icon === PauseGlyph ? 'pause' : 'close'} />;
});
const TextProbe = memo(function TextProbe() {
  return <ProbeRow name="Text" value={useUiStrings().close} />;
});
const StorageProbe = memo(function StorageProbe() {
  return <ProbeRow name="Storage" value={useUiStorage().getItem('beds') ?? 'empty'} />;
});
const ClockProbe = memo(function ClockProbe() {
  return <ProbeRow name="Clock" value={useNow()?.toISOString().slice(0, 10) ?? 'pending'} />;
});

const days = ['2026-10-31T12:00:00Z', '2026-11-01T12:00:00Z'];

/** Memoized probes, one per provider service, count the renders each option change causes. */
export function IndependentServices() {
  const [stores] = useState(() => [createMemoryStorage(), createMemoryStorage({ beds: '4' })]);
  const [store, setStore] = useState(0);
  const [day, setDay] = useState(0);
  const [paused, setPaused] = useState(false);
  const [shut, setShut] = useState(false);
  const [getNow, setGetNow] = useState(() => () => new Date(days[0] ?? ''));
  return (
    <div data-lab-case="subscriptions">
      <Button onPress={() => setStore((value) => 1 - value)}>Switch storage</Button>
      <Button
        onPress={() => {
          const next = 1 - day;
          setDay(next);
          setGetNow(() => () => new Date(days[next] ?? ''));
        }}
      >
        Switch clock
      </Button>
      <Button onPress={() => setPaused((value) => !value)}>Switch glyph</Button>
      <Button onPress={() => setShut((value) => !value)}>Switch text</Button>
      <UiProvider
        storage={stores[store]}
        getNow={getNow}
        icons={paused ? { close: PauseGlyph } : undefined}
        messages={shut ? { close: 'Shut' } : undefined}
      >
        <table aria-label="Service renders">
          <thead>
            <tr>
              <th scope="col">Service</th>
              <th scope="col">Value</th>
              <th scope="col">Renders</th>
            </tr>
          </thead>
          <tbody>
            <GlyphProbe />
            <TextProbe />
            <StorageProbe />
            <ClockProbe />
          </tbody>
        </table>
      </UiProvider>
    </div>
  );
}
