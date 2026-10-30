import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Tree } from '../../src/components/tree/tree.js';
import { LabOutput } from './lab-output.js';

interface Task {
  id: string;
  name: string;
}

const TASKS: Task[] = [
  { id: 'draft', name: 'Draft' },
  { id: 'review', name: 'Review' },
  { id: 'publish', name: 'Publish' },
];

/** A row locked while its name field is open closes the field unrenamed. */
export function LockedRenameTree() {
  const [items, setItems] = useState(TASKS);
  const [locked, setLocked] = useState<readonly string[]>([]);
  const [last, setLast] = useState('none');
  const lockSoon = () => window.setTimeout(() => setLocked(['review']), 1500);
  return (
    <div data-lab-locked-rename>
      <Button size="sm" onPress={lockSoon}>
        Lock Review in 1.5 seconds
      </Button>
      <Button size="sm" onPress={() => setLocked([])}>
        Unlock
      </Button>
      <Tree
        aria-label="Rename tasks"
        items={items}
        getTextValue={(task) => task.name}
        disabledKeys={locked}
        onRename={(task, name) => {
          setLast(`${task.name} to ${name}`);
          setItems((current) =>
            current.map((entry) => (entry.id === task.id ? { ...entry, name } : entry)),
          );
        }}
      />
      <LabOutput name="Locked">{locked.join(', ') || 'none'}</LabOutput>
      <LabOutput name="Last rename">{last}</LabOutput>
    </div>
  );
}
