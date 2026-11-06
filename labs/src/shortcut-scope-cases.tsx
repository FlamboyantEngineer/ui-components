import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  Shortcut,
  type ShortcutChord,
  ShortcutScope,
  type ShortcutSequence,
  useShortcut,
} from '../../src/components/shortcut/shortcut.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

interface ScopedActionProps {
  label: string;
  shortcut: ShortcutChord | ShortcutSequence;
  onRun: (label: string) => void;
}

/** A button that runs on its shortcut too, from the one declaration its hints are drawn from. */
function ScopedAction({ label, shortcut, onRun }: ScopedActionProps) {
  useShortcut(shortcut, () => onRun(label));
  return (
    <span>
      <Button
        size="sm"
        shortcut={typeof shortcut === 'string' ? shortcut : undefined}
        onPress={() => onRun(label)}
      >
        {label}
      </Button>{' '}
      <Shortcut chord={shortcut} />
    </span>
  );
}

function ScopedShortcuts() {
  const [ran, setRan] = useState('none');
  const [isPaused, setPaused] = useState(false);
  return (
    <div data-lab-demo="shortcut-scopes">
      <ScopedAction label="Show help" shortcut="Shift+?" onRun={setRan} />
      <ScopedAction label="Go to inbox" shortcut={['G', 'I']} onRun={setRan} />
      <ShortcutScope data-lab-scope="notes">
        <h3>Notes</h3>
        <ScopedAction label="New note" shortcut="N" onRun={setRan} />
        <ScopedAction label="Archive note" shortcut="E" onRun={setRan} />
        <label>
          Title <input defaultValue="Weekly plan" />
        </label>
      </ShortcutScope>
      <ShortcutScope data-lab-scope="tasks" isDisabled={isPaused}>
        <h3>Tasks</h3>
        <ScopedAction label="New task" shortcut="N" onRun={setRan} />
        <label>
          <input type="checkbox" checked={isPaused} onChange={() => setPaused(!isPaused)} /> Pause
          task shortcuts
        </label>
      </ShortcutScope>
      <LabOutput name="shortcut-ran">{ran}</LabOutput>
    </div>
  );
}

export function ShortcutScopeCases() {
  return (
    <LabSection
      title="Scoped shortcuts"
      description="Focus a button in Notes or Tasks and press N: the scope holding focus answers. Shift+? and the sequence G then I answer anywhere outside a field; typing in the title field types. Pausing the task shortcuts silences N there."
    >
      <ScopedShortcuts />
    </LabSection>
  );
}
