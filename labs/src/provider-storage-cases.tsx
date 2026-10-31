import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Link } from '../../src/components/link/link.js';
import { Switch } from '../../src/components/switch/switch.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { numberCodec } from '../../src/core/index.js';
import { UiProvider, usePersistentState } from '../../src/core/provider.js';
import { createMemoryStorage } from '../../src/core/storage.js';

function StoredCounter({ storageKey }: { storageKey: string }) {
  const [count, setCount] = usePersistentState(storageKey, 0, { codec: numberCodec });
  return <Button onPress={() => setCount((value) => value + 1)}>Stored count {count}</Button>;
}

/** Each adapter and key keeps its own counter, including after switching away and back. */
export function StorageSwitch() {
  const [stores] = useState(() => [
    createMemoryStorage({ primary: '2', secondary: '4' }),
    createMemoryStorage({ primary: '10', secondary: '20' }),
  ]);
  const [store, setStore] = useState(0);
  const [key, setKey] = useState('primary');
  return (
    <div data-lab-case="storage">
      <Button onPress={() => setStore((value) => 1 - value)}>Switch storage</Button>
      <Button onPress={() => setKey(key === 'primary' ? 'secondary' : 'primary')}>
        Switch storage key
      </Button>
      <p>
        Storage {store + 1}, key {key}
      </p>
      <UiProvider storage={stores[store]}>
        <StoredCounter storageKey={key} />
      </UiProvider>
    </div>
  );
}

/** Turning the locale and client routing on and off keeps the draft below the provider. */
export function OptionalOptions() {
  const [isFrench, setFrench] = useState(false);
  const [isRouted, setRouted] = useState(false);
  const [route, setRoute] = useState('none');
  return (
    <div data-lab-case="options">
      <Switch isSelected={isFrench} onChange={setFrench}>
        French locale
      </Switch>
      <Switch isSelected={isRouted} onChange={setRouted}>
        Client routing
      </Switch>
      <UiProvider
        locale={isFrench ? 'fr-FR' : undefined}
        navigate={isRouted ? (href) => setRoute(href) : undefined}
      >
        <TextField label="Draft note" />
        <NumberField label="Amount" defaultValue={1234.5} />
        <Link href="#options">Options</Link>
      </UiProvider>
      <p>
        Last route: <output data-lab-output="route">{route}</output>
      </p>
    </div>
  );
}
