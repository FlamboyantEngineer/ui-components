import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Menu, MenuPopover, MenuTrigger } from '../../src/components/menu/menu.js';
import type { Selection } from '../../src/core/props.js';

/** A menu whose IDs remain distinct after the primitive creates DOM references. */
export function MenuKeyCase() {
  const [selected, setSelected] = useState<Selection>(new Set([1]));
  const [action, setAction] = useState('none');
  return (
    <div data-lab-demo="typed-keys">
      <MenuTrigger>
        <Button>Typed choices</Button>
        <MenuPopover>
          <Menu
            aria-label="Typed choices"
            items={[
              { id: 1, label: 'Numeric option' },
              { id: '1', label: 'Text option' },
              { id: 'a b', label: 'Spaced option' },
              { id: 'ab', label: 'Compact option' },
            ]}
            selectionMode="multiple"
            selectedKeys={selected}
            onSelectionChange={setSelected}
            disabledKeys={['a b']}
            onAction={(key) => setAction(`${typeof key}: ${key}`)}
          />
        </MenuPopover>
      </MenuTrigger>
      <p role="status">Action: {action}</p>
    </div>
  );
}
