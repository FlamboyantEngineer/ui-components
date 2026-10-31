import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';
import { OverflowList } from '../../src/components/overflow-list/overflow-list.js';

interface Note {
  id: number;
  name: string;
}

const firstNotes: readonly Note[] = ['Plum', 'Pear', 'Kiwi', 'Lime', 'Date'].map((name, id) => ({
  id,
  name,
}));
const extraNames = ['Fig', 'Yuzu', 'Quince', 'Sloe'];

/** Notes typed into kept items; a reorder, an insert or a delete keeps each with its item. */
export function NoteRow() {
  const [notes, setNotes] = useState(firstNotes);
  const add = () =>
    setNotes((current) => {
      const id = Math.max(-1, ...current.map((note) => note.id)) + 1;
      return [
        { id, name: extraNames[(id - firstNotes.length) % extraNames.length] ?? 'Fig' },
        ...current,
      ];
    });
  return (
    <div data-lab-demo="notes">
      <p>
        <Button size="sm" onPress={() => setNotes((current) => [...current].reverse())}>
          Reverse
        </Button>{' '}
        <Button size="sm" onPress={add}>
          Add first
        </Button>{' '}
        <Button size="sm" onPress={() => setNotes((current) => current.slice(1))}>
          Remove first
        </Button>
      </p>
      <div data-lab-frame="" style={{ width: 600 }}>
        <OverflowList
          role="group"
          aria-label="Notes"
          items={notes}
          getKey={(note) => note.id}
          renderItem={(note) => (
            <label>
              {note.name} <input size={6} />
            </label>
          )}
          renderOverflow={(hidden) => (
            <DropdownMenu
              size="sm"
              label={`${hidden.length} more`}
              aria-label="More notes"
              items={hidden.map((note) => ({ id: note.id, label: note.name }))}
            />
          )}
        />
      </div>
    </div>
  );
}
