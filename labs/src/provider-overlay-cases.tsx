// A provider lab case: a page-wide keyboard shortcut that pauses while a menu or a field's popup is
// open, read from the provider's overlay presence. Lab-only presentation is inline.

import { useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { DateTimeField } from '../../src/components/date-time-field/date-time-field.js';
import {
  Menu,
  MenuItem,
  MenuPopover,
  MenuTrigger,
  SubmenuTrigger,
} from '../../src/components/menu/menu.js';
import { SelectField } from '../../src/components/select-field/select-field.js';
import { Tooltip } from '../../src/components/tooltip/tooltip.js';
import { useIsOverlayActive, useOverlayPresence } from '../../src/core/overlay-presence.js';
import { UiProvider } from '../../src/core/provider.js';

const sizes = [
  { id: 'small', label: 'Small' },
  { id: 'large', label: 'Large' },
];

/** Adds a note on N anywhere on the page, unless an interactive overlay is open. */
function NoteShortcut() {
  const presence = useOverlayPresence();
  const isActive = useIsOverlayActive();
  const [notes, setNotes] = useState(0);
  const [skipped, setSkipped] = useState(0);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'n' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (presence.isActive()) setSkipped((count) => count + 1);
      else setNotes((count) => count + 1);
    };
    // In the capture phase, as a page-wide shortcut sees keys before a widget's typeahead does.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [presence]);
  return (
    <p>
      Overlay open: <output data-lab-output="overlay">{isActive ? 'yes' : 'no'}</output>; notes:{' '}
      <output data-lab-output="notes">{notes}</output>; paused presses:{' '}
      <output data-lab-output="skipped">{skipped}</output>
    </p>
  );
}

/** Press N to add a note; it pauses while the menu, the select or the calendar is open. */
export function PausedShortcut() {
  return (
    <UiProvider>
      <div data-lab-case="shortcut" style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
        <NoteShortcut />
        <MenuTrigger>
          <Button>Insert</Button>
          <MenuPopover>
            <Menu aria-label="Insert">
              <MenuItem id="note">Note</MenuItem>
              <SubmenuTrigger>
                <MenuItem id="shape">Shape</MenuItem>
                <MenuPopover>
                  <Menu
                    aria-label="Shape"
                    items={[
                      { id: 'circle', label: 'Circle' },
                      { id: 'square', label: 'Square' },
                    ]}
                  />
                </MenuPopover>
              </SubmenuTrigger>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
        <SelectField label="Size" options={sizes} />
        <DateTimeField label="Due" defaultValue="2026-04-13" />
        <Tooltip content="Notes are added with N">
          <Button>Help</Button>
        </Tooltip>
      </div>
    </UiProvider>
  );
}
