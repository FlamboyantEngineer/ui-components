import { type CSSProperties, type ReactNode, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ContextMenu, ContextMenuTrigger } from '../../src/components/context-menu/context-menu.js';
import { useMenuController } from '../../src/components/context-menu/index.js';
import {
  Menu,
  type MenuEntry,
  MenuItem,
  MenuPopover,
  MenuSeparator,
  type MenuSize,
  SubmenuTrigger,
} from '../../src/components/menu/menu.js';
import { PlusGlyph } from '../../src/core/glyphs.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { ContextMenuCoverageSections } from './context-menu-coverage-cases.js';

const sizes = ['sm', 'md', 'lg'] as const;

// Lab-only presentation; the library draws none of it.
const area: CSSProperties = {
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  width: 200,
  height: 80,
  border: '1px dashed currentColor',
  borderRadius: 6,
  userSelect: 'none',
};

function FileMenu({ size, onAction }: { size?: MenuSize; onAction: (key: Key) => void }) {
  return (
    <Menu size={size} onAction={onAction}>
      <MenuItem id="open" icon={PlusGlyph} shortcut="Ctrl+O">
        Open
      </MenuItem>
      <MenuItem id="rename">Rename</MenuItem>
      <MenuItem id="locked" isDisabled>
        Locked
      </MenuItem>
      <SubmenuTrigger>
        <MenuItem id="share">Share</MenuItem>
        <MenuPopover>
          <Menu onAction={onAction}>
            <MenuItem id="mail">Mail</MenuItem>
            <MenuItem id="link">Copy link</MenuItem>
          </Menu>
        </MenuPopover>
      </SubmenuTrigger>
      <MenuSeparator />
      <MenuItem id="delete" tone="danger">
        Delete
      </MenuItem>
    </Menu>
  );
}

function Feedback({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}

function Targets() {
  const [last, setLast] = useState('none');
  return (
    <>
      <StateMatrix
        axes={{ target: ['focusable', 'text', 'disabled'], size: sizes }}
        render={({ target, size }) => (
          <ContextMenuTrigger isDisabled={target === 'disabled'}>
            {target === 'text' ? (
              <p style={area} data-lab-target="">
                Right-click this text
              </p>
            ) : (
              <div tabIndex={0} role="button" style={area} data-lab-target="">
                {target === 'disabled' ? 'Browser menu here' : 'Report.pdf'}
              </div>
            )}
            <FileMenu size={size} onAction={(key) => setLast(`${String(key)} (${size})`)} />
          </ContextMenuTrigger>
        )}
      />
      <Feedback name="Action">{last}</Feedback>
    </>
  );
}

function Nested() {
  const [last, setLast] = useState('none');
  return (
    <>
      <ContextMenuTrigger>
        <div
          tabIndex={0}
          role="group"
          aria-label="Folder"
          style={{ ...area, width: 320, height: 140 }}
        >
          <ContextMenuTrigger>
            <div tabIndex={0} role="group" aria-label="Notes.txt" style={area} data-lab-inner="">
              Notes.txt{' '}
              <Button size="sm" onPress={() => setLast('file preview')}>
                Preview
              </Button>
            </div>
            <Menu aria-label="File" onAction={(key: Key) => setLast(`file ${String(key)}`)}>
              <MenuItem id="open">Open file</MenuItem>
            </Menu>
          </ContextMenuTrigger>
        </div>
        <Menu aria-label="Folder" onAction={(key: Key) => setLast(`folder ${String(key)}`)}>
          <MenuItem id="new">New folder</MenuItem>
        </Menu>
      </ContextMenuTrigger>
      <Feedback name="Nested action">{last}</Feedback>
    </>
  );
}

/** A target whose badge handles its own secondary click and long touch. */
function Handled() {
  const [last, setLast] = useState('none');
  return (
    <>
      <ContextMenuTrigger>
        <div tabIndex={0} role="group" aria-label="Report row" style={{ ...area, width: 320 }}>
          Report.pdf <input aria-label="Report note" defaultValue="Draft" />{' '}
          <Button size="sm" onPress={() => setLast('row preview')}>
            Preview
          </Button>{' '}
          <span
            data-lab-badge=""
            onContextMenu={(event) => {
              event.preventDefault();
              setLast('badge handled it');
            }}
            onPointerDown={(event) => {
              if (event.pointerType === 'touch') event.preventDefault();
            }}
          >
            [Locked]
          </span>
        </div>
        <Menu aria-label="Row" onAction={(key: Key) => setLast(`row ${String(key)}`)}>
          <MenuItem id="open">Open row</MenuItem>
        </Menu>
      </ContextMenuTrigger>
      <Feedback name="Handled action">{last}</Feedback>
    </>
  );
}

const fruitEntries: MenuEntry[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
  { id: 'more', label: 'More', items: [{ id: 'plum', label: 'Plum' }] },
];

function Controller() {
  const controller = useMenuController();
  const [last, setLast] = useState('none');
  const items: MenuEntry[] = fruitEntries.map((entry) =>
    entry.type === undefined || entry.type === 'item'
      ? { ...entry, onAction: () => setLast(entry.label) }
      : entry,
  );
  return (
    <>
      <div
        data-lab-canvas=""
        style={{ ...area, width: 320, height: 120 }}
        onClick={(event) => controller.open({ x: event.clientX, y: event.clientY }, { items })}
      >
        Click anywhere here
      </div>
      <p>
        <Button
          data-lab-open-below=""
          onPress={(event) => controller.open(event.target, { items })}
        >
          Open below this button
        </Button>{' '}
        <Button
          data-lab-open-move=""
          onPress={() => {
            controller.open({ x: 40, y: 240 }, { items });
            setTimeout(() => controller.move({ x: 240, y: 360 }), 400);
          }}
        >
          Open, then move
        </Button>
      </p>
      <Feedback name="Controller action">{last}</Feedback>
      <ContextMenu controller={controller} data-lab-controlled="" />
    </>
  );
}

function SelectedText() {
  const [last, setLast] = useState('none');
  return (
    <>
      <StateMatrix
        axes={{ mode: ['modal', 'non-modal'] }}
        render={({ mode }) => (
          <ContextMenuTrigger isNonModal={mode === 'non-modal'}>
            <p>Selected text remains readable.</p>
            <Menu
              aria-label="Selection actions"
              onAction={() => setLast(window.getSelection()?.toString() ?? '')}
            >
              <MenuItem id="copy">Copy selection</MenuItem>
            </Menu>
          </ContextMenuTrigger>
        )}
      />
      <Feedback name="Selected text">{last}</Feedback>
    </>
  );
}

function Layers() {
  const dropdown = useMenuController();
  const context = useMenuController();
  return (
    <>
      <Button
        data-lab-open-both=""
        onPress={() => {
          dropdown.open({ x: 80, y: 300 }, { items: [{ id: 'a', label: 'Dropdown layer menu' }] });
          context.open({ x: 140, y: 315 }, { items: [{ id: 'b', label: 'Context menu layer' }] });
        }}
      >
        Open on two layers
      </Button>
      <ContextMenu controller={dropdown} layer="dropdown" aria-label="Dropdown layer" />
      <ContextMenu controller={context} aria-label="Context menu layer" />
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Targets by size"
      description="Right-click a target, long-press it on a touch screen, or focus it and press Shift+F10 or the Context Menu key. Disabled targets leave the browser menu alone and cancel a pending long press. Focus returns to a focusable target."
    >
      <Targets />
    </LabSection>
    <LabSection
      title="Nested targets"
      description="The innermost target opens its own menu only, also from a long touch on its Preview button."
    >
      <Nested />
    </LabSection>
    <LabSection
      title="Requests handled inside the target"
      description="The Locked badge handles its own secondary click and long touch and cancels them, so the row's menu stays closed there; anywhere else on the row opens it, a long touch on the Preview button included. In the note, Shift+F10 and the Context Menu key stay with the text."
    >
      <Handled />
    </LabSection>
    <LabSection
      title="Controller"
      description="Something outside the menu opens it at a point or below an element, and can move it while it is open."
    >
      <Controller />
    </LabSection>
    <LabSection
      title="Selected text"
      description="Select a word, then right-click it. A non-modal menu preserves the selection and leaves the page reachable; the default modal menu blocks the page."
    >
      <SelectedText />
    </LabSection>
    <LabSection
      title="Layers"
      description="Two controlled menus at once: the context-menu layer stacks above the dropdown layer."
    >
      <Layers />
    </LabSection>
    <ContextMenuCoverageSections />
  </>,
);
