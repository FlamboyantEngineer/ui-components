// Menu cases for link items routed through the provider, typeahead text on rich labels, a custom
// empty filtered state, an uncontrolled preselection, controlled and initially open triggers, a
// tuned popover position and the built-in action icon helper.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import type { IconSource } from '../../src/components/icon/icon.js';
import {
  Menu,
  MenuItem,
  MenuPopover,
  MenuTrigger,
  resolveActionIcon,
  type MenuActionIcons,
} from '../../src/components/menu/index.js';
import {
  ChevronDownGlyph,
  CopyGlyph,
  DeleteGlyph,
  EditGlyph,
  RestoreGlyph,
} from '../../src/core/glyphs.js';
import type { Selection } from '../../src/core/props.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { useOverlayGeometry } from './overlay-geometry-controls.js';

const list = (keys: Selection) => (keys === 'all' ? 'all' : [...keys].map(String).join(', '));

/** Link items navigate through the provider's `navigate`; rich labels name their typeahead text. */
function LinksAndRichLabels() {
  const [route, setRoute] = useState('none');
  const [last, setLast] = useState('none');
  return (
    <UiProvider navigate={setRoute}>
      <div data-lab-demo="links">
        <MenuTrigger>
          <Button endIcon={ChevronDownGlyph}>Go to</Button>
          <MenuPopover>
            <Menu aria-label="Go to" onAction={(key) => setLast(String(key))}>
              <MenuItem id="pears" href="/orchard/pears">
                Pears page
              </MenuItem>
              <MenuItem id="plums" href="/orchard/plums">
                Plums page
              </MenuItem>
              <MenuItem id="starred" textValue="Starred">
                <span>
                  <span aria-hidden="true">★ </span>
                  <strong>Starred</strong> crates
                </span>
              </MenuItem>
              <MenuItem id="ripe" textValue="Ripe">
                <span>
                  <em>Ripe</em> this week
                </span>
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
        <LabOutput name="Route">{route}</LabOutput>
        <LabOutput name="Go to action">{last}</LabOutput>
      </div>
    </UiProvider>
  );
}

const crates = ['Apples', 'Pears', 'Plums', 'Quinces', 'Cherries', 'Apricots'].map((label) => ({
  id: label.toLowerCase(),
  label,
}));

/** A filterable menu that draws its own content when nothing matches. */
function CustomEmptyState() {
  return (
    <MenuTrigger>
      <Button endIcon={ChevronDownGlyph}>Find a crate</Button>
      <MenuPopover>
        <Menu
          aria-label="Find a crate"
          filterable
          items={crates}
          renderEmptyState={() => (
            <span data-lab-empty="">No crate holds that fruit. Try another spelling.</span>
          )}
        />
      </MenuPopover>
    </MenuTrigger>
  );
}

/** A standalone menu that starts with two choices checked and reports each change. */
function Preselected() {
  const [checked, setChecked] = useState('wrap, ruler (initial)');
  return (
    <div data-lab-demo="preselected">
      <Menu
        aria-label="View options"
        selectionMode="multiple"
        defaultSelectedKeys={['wrap', 'ruler']}
        onSelectionChange={(keys) => setChecked(list(keys) || 'none')}
        items={[
          { id: 'wrap', label: 'Wrap lines' },
          { id: 'ruler', label: 'Show ruler' },
          { id: 'minimap', label: 'Show minimap' },
        ]}
      />
      <LabOutput name="Checked">{checked}</LabOutput>
    </div>
  );
}

const fruitItems = [
  { id: 'apples', label: 'Apples' },
  { id: 'pears', label: 'Pears' },
];

/** The host holds the open state: an outside button opens the menu, and every change is logged. */
function ControlledTrigger() {
  const [isOpen, setOpen] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);
  const change = (next: boolean) => {
    setOpen(next);
    setChanges((items) => [...items, next ? 'open' : 'closed']);
  };
  return (
    <div data-lab-demo="controlled">
      <MenuTrigger isOpen={isOpen} onOpenChange={change}>
        <Button endIcon={ChevronDownGlyph}>Controlled fruit</Button>
        <MenuPopover>
          <Menu aria-label="Controlled fruit" items={fruitItems} />
        </MenuPopover>
      </MenuTrigger>{' '}
      <Button size="sm" variant="secondary" onPress={() => change(true)}>
        Open from the host
      </Button>
      <LabOutput name="Controlled open">{String(isOpen)}</LabOutput>
      <LabOutput name="Controlled changes">{changes.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

/** A trigger mounted on demand whose menu opens at once. */
function OpenOnMount() {
  const [isMounted, setMounted] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <div data-lab-demo="default-open">
      <Button size="sm" variant="secondary" onPress={() => setMounted((mounted) => !mounted)}>
        {isMounted ? 'Remove the menu' : 'Add the menu'}
      </Button>{' '}
      {isMounted ? (
        <MenuTrigger
          defaultOpen
          onOpenChange={(open) => setChanges((items) => [...items, open ? 'open' : 'closed'])}
        >
          <Button endIcon={ChevronDownGlyph}>Fruit on mount</Button>
          <MenuPopover>
            <Menu aria-label="Fruit on mount" items={fruitItems} />
          </MenuPopover>
        </MenuTrigger>
      ) : null}
      <LabOutput name="Mount changes">{changes.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

/** A popover that prefers the top, with its offsets, padding and flipping set from the controls. */
function TunedPopover() {
  const { geometry, controls } = useOverlayGeometry({
    offset: 12,
    crossOffset: 16,
    containerPadding: 12,
    shouldFlip: true,
  });
  return (
    <div data-lab-demo="menu-geometry">
      {controls}
      <MenuTrigger>
        <Button endIcon={ChevronDownGlyph}>Placed fruit</Button>
        <MenuPopover placement="top start" {...geometry} data-lab-popover="tuned">
          <Menu aria-label="Placed fruit" items={crates} />
        </MenuPopover>
      </MenuTrigger>
    </div>
  );
}

type CrateAction = 'copy' | 'rename' | 'remove' | 'restore';

const defaultIcons: Record<CrateAction, IconSource> = {
  copy: CopyGlyph,
  rename: undefined,
  remove: DeleteGlyph,
  restore: RestoreGlyph,
};

const actionLabels: Record<CrateAction, string> = {
  copy: 'Copy',
  rename: 'Rename',
  remove: 'Remove',
  restore: 'Restore',
};

/** The host's map: rename gains an icon, remove loses its own, copy and restore keep theirs. */
const hostIcons: MenuActionIcons<CrateAction> = { rename: EditGlyph, remove: null };

function describeIcon(action: CrateAction): string {
  const icon = resolveActionIcon(hostIcons, action, defaultIcons[action]);
  if (icon === null) return 'removed by the host';
  if (icon === undefined) return 'none';
  return icon === defaultIcons[action] ? 'built-in' : "the host's";
}

/** A built-in action menu whose icons are resolved against the host's map. */
function ActionIcons() {
  const actions = Object.keys(defaultIcons) as CrateAction[];
  return (
    <div data-lab-demo="action-icons">
      <Menu
        aria-label="Crate actions"
        items={actions.map((action) => ({
          id: action,
          label: actionLabels[action],
          icon: resolveActionIcon(hostIcons, action, defaultIcons[action]),
        }))}
      />
      <ul data-lab-output="action-icons">
        {actions.map((action) => (
          <li key={action}>
            {action}: {describeIcon(action)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MenuCoverageSections() {
  return (
    <>
      <LabSection
        title="Links and rich labels"
        description="Pears page and Plums page carry href: activating one navigates through the provider's navigate, shown as the route. Starred crates and Ripe this week draw rich labels, so textValue gives their typeahead text: type S or R in the open menu."
      >
        <LinksAndRichLabels />
      </LabSection>
      <LabSection
        title="Custom empty filtered state"
        description="renderEmptyState replaces the provider's no-results text: type a fruit no crate holds."
      >
        <CustomEmptyState />
      </LabSection>
      <LabSection
        title="Initial selection"
        description="defaultSelectedKeys checks Wrap lines and Show ruler; the menu then holds the selection itself and reports each change."
      >
        <Preselected />
      </LabSection>
      <LabSection
        title="Controlled and initially open triggers"
        description="isOpen with onOpenChange: the host opens the menu from its own button and logs every change, including the trigger's and Escape's. defaultOpen opens the menu as soon as its trigger mounts."
      >
        <ControlledTrigger />
        <OpenOnMount />
      </LabSection>
      <LabSection
        title="Popover position"
        description="placement top start with the offset, cross offset, container padding and flipping set below. Scroll the trigger to the top of the window: with flipping on the menu opens below it, with flipping off it stays above, held inside the padding."
      >
        <TunedPopover />
      </LabSection>
      <LabSection
        title="Built-in action icons"
        description="resolveActionIcon picks each built-in action's icon: the host's when its map names the action (rename gains one, and null removes remove's), else the action's own (copy, restore)."
      >
        <ActionIcons />
      </LabSection>
    </>
  );
}
