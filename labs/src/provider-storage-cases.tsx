import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { UiProvider, usePersistentState } from '../../src/core/provider.js';
import { createMemoryStorage } from '../../src/core/storage.js';

function StoredCounter({ storageKey }: { storageKey: string }) {
  const [count, setCount] = usePersistentState(storageKey, 0);
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
