import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Link } from '../../src/components/link/link.js';
import { List, ListRow } from '../../src/components/list-row/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { Switch } from '../../src/components/switch/switch.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { createJsonCodec } from '../../src/core/index.js';
import { type UiLinkRenderer, UiProvider, usePersistentState } from '../../src/core/provider.js';
import { createMemoryStorage, type UiStorage } from '../../src/core/storage.js';

/**
 * A host link renderer, as a router's Link component: it marks the anchors it draws and routes a
 * plain click itself unless the library already handled it (React Aria links call navigate).
 */
function routerLink(marker: string, onRoute: (entry: string) => void): UiLinkRenderer {
  return function RouterLink({ ref, onClick, ...props }) {
    return (
      <a
        ref={ref}
        {...props}
        data-lab-link-renderer={marker}
        onClick={(event) => {
          onClick?.(event);
          const isPlain = !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
          if (event.defaultPrevented || !isPlain || event.button !== 0) return;
          event.preventDefault();
          onRoute(`${props.href} (renderLink ${marker})`);
        }}
      />
    );
  };
}

/** Router hrefs mapped to native hash hrefs, as a router mounted under a base path would. */
const toNativeHref = (href: string) => `#/app${href}`;

/**
 * An outer provider with a router (navigate and useHref) and a link renderer, and an inner one that
 * replaces only the renderer.
 */
export function RoutedLinks() {
  const [routes, setRoutes] = useState<string[]>([]);
  const route = (entry: string) => setRoutes((all) => [...all, entry]);
  const [outerLink] = useState(() => routerLink('outer', route));
  const [innerLink] = useState(() => routerLink('inner', route));
  return (
    <div data-lab-case="routed-links">
      <UiProvider
        navigate={(href) => route(`${href} (navigate)`)}
        useHref={toNativeHref}
        renderLink={outerLink}
      >
        <div data-lab-scope="outer">
          <Link href="/garden">Garden (React Aria link)</Link>
          <List aria-label="Outer pages">
            <ListRow title="Orchard (list row link)" href="/orchard" />
          </List>
        </div>
        <UiProvider renderLink={innerLink}>
          <div data-lab-scope="inner">
            <Link href="/pond">Pond (React Aria link)</Link>
            <List aria-label="Inner pages">
              <ListRow title="Meadow (list row link)" href="/meadow" />
            </List>
          </div>
        </UiProvider>
      </UiProvider>
      <p>
        Routes: <output data-lab-output="routes">{routes.join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

const textCodec = createJsonCodec((value): string => {
  if (typeof value !== 'string') throw new TypeError('Not stored text');
  return value;
});

/** A note persisted after a delay, with the flush its hook returns. */
function DelayedDraft({ storageKey, writeDelay }: { storageKey: string; writeDelay: number }) {
  const [note, setNote, flush] = usePersistentState(storageKey, '', {
    codec: textCodec,
    writeDelay,
  });
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
      <TextField label="Draft" value={note} onChange={setNote} />
      <Button size="sm" onPress={flush}>
        Flush
      </Button>
      <p>
        In memory: <output data-lab-output="memory">{JSON.stringify(note)}</output>
      </p>
    </div>
  );
}

const delays = { '0': 'No delay', '500': '500 ms', '3000': '3 s' } as const;
type Delay = keyof typeof delays;
const isDelay = (value: unknown): value is Delay =>
  typeof value === 'string' && Object.hasOwn(delays, value);

/**
 * A delayed draft over a store that logs every write. Change the delay, the key, or unmount the
 * draft while a write waits; corrupt the stored value to see the codec fall back.
 */
export function PersistenceLifecycle() {
  const [log, setLog] = useState<string[]>([]);
  const [backing] = useState(() => createMemoryStorage());
  const [storage] = useState<UiStorage>(() => ({
    getItem: (key) => backing.getItem(key),
    setItem: (key, value) => {
      backing.setItem(key, value);
      setLog((all) => [...all, `set ${key} = ${value}`]);
    },
    removeItem: (key) => {
      backing.removeItem(key);
      setLog((all) => [...all, `remove ${key}`]);
    },
  }));
  const [delay, setDelay] = useState<Delay>('3000');
  const [key, setKey] = useState('draft-a');
  const [isMounted, setMounted] = useState(true);
  const [, setReads] = useState(0);
  return (
    <div data-lab-case="persistence">
      <SegmentedChoice
        aria-label="Write delay"
        size="sm"
        sizing="content"
        options={Object.entries(delays).map(([value, label]) => ({ value, label }))}
        value={delay}
        onChange={(value) => {
          if (isDelay(value)) setDelay(value);
        }}
      />{' '}
      <Button
        size="sm"
        variant="secondary"
        onPress={() => setKey(key === 'draft-a' ? 'draft-b' : 'draft-a')}
      >
        Switch key
      </Button>{' '}
      <Switch isSelected={isMounted} onChange={setMounted}>
        Mounted
      </Switch>{' '}
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          backing.setItem(key, '42');
          setReads((count) => count + 1);
        }}
      >
        Corrupt the stored value
      </Button>
      <UiProvider storage={storage}>
        {isMounted ? <DelayedDraft storageKey={key} writeDelay={Number(delay)} /> : null}
      </UiProvider>
      <p>
        Key: <output data-lab-output="key">{key}</output>. Stored:{' '}
        <output data-lab-output="stored">{backing.getItem(key) ?? 'nothing'}</output>
      </p>
      <ol aria-label="Storage writes" data-lab-output="writes">
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}
