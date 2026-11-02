import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { CommandPalette } from '../../src/components/command-palette/command-palette.js';
import type { MenuEntry } from '../../src/components/menu/menu.js';
import type { Key } from '../../src/core/props.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const kitchenCommands: MenuEntry[] = [
  { id: 'preheat', label: 'Preheat the oven' },
  { id: 'timer', label: 'Start a timer' },
  { id: 'scale', label: 'Scale the recipe' },
];

/** An uncontrolled palette the reader mounts open; its own chord opens it again afterwards. */
function MountedOpen() {
  const [mount, setMount] = useState(0);
  const [isOpen, setOpen] = useState(false);
  const [last, setLast] = useState('none');
  return (
    <div data-lab-demo="mounted-open">
      <Button
        size="sm"
        onPress={() => {
          setMount((count) => count + 1);
          setOpen(true);
        }}
      >
        Mount the palette open
      </Button>
      {mount > 0 ? (
        <CommandPalette
          key={mount}
          defaultOpen
          shortcut="Ctrl+Shift+L"
          items={kitchenCommands}
          onOpenChange={setOpen}
          onAction={(key: Key) => setLast(String(key))}
          data-lab-palette="mounted-open"
        />
      ) : null}
      <LabOutput name="palette">{isOpen ? 'open' : 'closed'}</LabOutput>
      <LabOutput name="ran">{last}</LabOutput>
    </div>
  );
}

export function CommandPaletteMountCases() {
  return (
    <LabSection
      title="Open on mount"
      description="defaultOpen opens an uncontrolled palette as it mounts, with focus in its search field, so nothing covers the page until asked. Type, run a command or press Escape to close it; Control+Shift+L (Command+Shift+L on macOS) opens it again, empty."
    >
      <MountedOpen />
    </LabSection>
  );
}
