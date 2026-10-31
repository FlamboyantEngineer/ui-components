import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Menu, MenuItem, MenuPopover, MenuTrigger } from '../../src/components/menu/menu.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** A menu behind a button that is available, or disabled but focusable to explain why. */
function CommandsMenu({ isDisabled, onRun }: { isDisabled: boolean; onRun: () => void }) {
  return (
    <MenuTrigger>
      <Button
        isDisabled={isDisabled}
        focusableWhenDisabled
        tooltip={isDisabled ? 'Unavailable while saving' : undefined}
      >
        {isDisabled ? 'Locked commands' : 'Commands'}
      </Button>
      <CommandsPopover onRun={onRun} />
    </MenuTrigger>
  );
}

function CommandsPopover({ onRun }: { onRun: () => void }) {
  return (
    <MenuPopover>
      <Menu aria-label="Commands" onAction={onRun}>
        <MenuItem id="run">Run</MenuItem>
      </Menu>
    </MenuPopover>
  );
}

/** A menu button that syncs for three seconds first, showing pending only after two. */
function SyncingMenu({ onRun }: { onRun: () => void }) {
  return (
    <MenuTrigger>
      <Button
        pendingDelay={2000}
        onPress={() => new Promise<void>((resolve) => window.setTimeout(resolve, 3000))}
      >
        Sync then choose
      </Button>
      <CommandsPopover onRun={onRun} />
    </MenuTrigger>
  );
}

/** Buttons that open a menu, refusing to while disabled or while their own action runs. */
export function ButtonTriggerCases() {
  const [runs, setRuns] = useState(0);
  const run = () => setRuns((count) => count + 1);
  return (
    <div data-lab-family="button-trigger-cases">
      <LabSection
        title="Menu triggers"
        description="Each button opens a menu. The locked one is disabled but focusable: hover or tab to it to read why, and neither a click, Enter, Space nor the arrow keys open its menu. Sync then choose opens its menu as it starts a three-second sync and refuses to open it again until the sync ends, also during the two seconds before it shows pending."
      >
        <CommandsMenu isDisabled={false} onRun={run} /> <CommandsMenu isDisabled onRun={run} />{' '}
        <SyncingMenu onRun={run} />
        <LabOutput name="Runs">{runs}</LabOutput>
      </LabSection>
    </div>
  );
}
