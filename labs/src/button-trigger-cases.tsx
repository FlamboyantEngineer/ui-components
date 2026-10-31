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
      <MenuPopover>
        <Menu aria-label="Commands" onAction={onRun}>
          <MenuItem id="run">Run</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

/** Buttons that open a menu: a focusable disabled one keeps its tooltip and never opens it. */
export function ButtonTriggerCases() {
  const [runs, setRuns] = useState(0);
  const run = () => setRuns((count) => count + 1);
  return (
    <div data-lab-family="button-trigger-cases">
      <LabSection
        title="Menu triggers"
        description="Both buttons open a menu. The locked one is disabled but focusable: hover or tab to it to read why, and neither a click, Enter, Space nor the arrow keys open its menu."
      >
        <CommandsMenu isDisabled={false} onRun={run} /> <CommandsMenu isDisabled onRun={run} />
        <LabOutput name="Runs">{runs}</LabOutput>
      </LabSection>
    </div>
  );
}
