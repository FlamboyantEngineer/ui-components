// Context Menu cases for text controls inside a target, element anchoring at another placement,
// a point menu whose trigger scrolls, and a controller made outside React and observed from it.

import { useRef, useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ContextMenu, ContextMenuTrigger } from '../../src/components/context-menu/context-menu.js';
import {
  createMenuController,
  useMenuController,
  useMenuControllerState,
  type MenuAnchor,
} from '../../src/components/context-menu/index.js';
import { Menu, MenuItem } from '../../src/components/menu/menu.js';
import { Switch } from '../../src/components/switch/switch.js';
import type { Key } from '../../src/core/props.js';
import { LabSection } from './chrome/index.js';

// Lab-only presentation; the library draws none of it.
const box: CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 12,
  border: '1px dashed currentColor',
  borderRadius: 6,
  maxWidth: 360,
};

function EditMenu({ onAction }: { onAction: (key: Key) => void }) {
  return (
    <Menu onAction={onAction}>
      <MenuItem id="cut">Cut</MenuItem>
      <MenuItem id="copy">Copy</MenuItem>
      <MenuItem id="paste">Paste</MenuItem>
    </Menu>
  );
}

/** Text controls inside a target keep the browser's menu unless `opensInsideText` is set. */
function TextControlTargets() {
  const [opensInsideText, setOpensInsideText] = useState(false);
  const [action, setAction] = useState('none');
  return (
    <div data-lab-demo="inside-text">
      <Switch isSelected={opensInsideText} onChange={setOpensInsideText}>
        Open inside text controls
      </Switch>
      <ContextMenuTrigger opensInsideText={opensInsideText} aria-label="Note menu">
        <div style={box} data-lab-target="text">
          <span>Right-click here, or in a control below</span>
          <input aria-label="Title" defaultValue="Orchard notes" />
          <textarea aria-label="Body" defaultValue="Pick the pears on Friday." />
          <div contentEditable suppressContentEditableWarning role="textbox" aria-label="Caption">
            Ripe and ready
          </div>
        </div>
        <EditMenu onAction={(key) => setAction(String(key))} />
      </ContextMenuTrigger>
      <p data-lab-output="inside-text">
        opensInsideText: {String(opensInsideText)}; last action: {action}
      </p>
    </div>
  );
}

/** Shift+F10 on the target opens its menu against the target, above it and to its end. */
function PlacedTarget() {
  const [action, setAction] = useState('none');
  return (
    <div data-lab-demo="placed">
      <ContextMenuTrigger placement="top end" aria-label="Crate menu">
        <button type="button" style={{ ...box, display: 'block' }} data-lab-target="placed">
          Crate 12 (Shift+F10 opens above, at its end)
        </button>
        <EditMenu onAction={(key) => setAction(String(key))} />
      </ContextMenuTrigger>
      <p data-lab-output="placed">Last action: {action}</p>
    </div>
  );
}

/** A point menu that belongs to a row in a scrolling list: scrolling the list closes it. */
function ScrollingOwner() {
  const controller = useMenuController();
  const row = useRef<HTMLDivElement>(null);
  const { isOpen } = useMenuControllerState(controller);
  return (
    <div data-lab-demo="scroll-owner">
      <div
        data-lab-scroller
        tabIndex={0}
        role="region"
        aria-label="Crates"
        style={{ height: 120, overflow: 'auto', border: '1px solid currentColor' }}
      >
        <div style={{ height: 40 }} />
        <div ref={row} data-lab-target="row" style={{ padding: 8 }}>
          Crate of plums
        </div>
        <div style={{ height: 400 }} />
      </div>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          const rect = row.current?.getBoundingClientRect();
          if (rect) controller.open({ x: rect.left + 16, y: rect.bottom });
        }}
      >
        Open at the row
      </Button>
      <p data-lab-output="scroll-owner">Open: {String(isOpen)}</p>
      <ContextMenu controller={controller} triggerRef={row} isNonModal aria-label="Row menu">
        <EditMenu onAction={() => controller.close()} />
      </ContextMenu>
    </div>
  );
}

/** Made once, outside any component, as a host's own module would. */
const sharedController = createMenuController();

function describeAnchor(anchor: MenuAnchor | null): string {
  if (!anchor) return 'none';
  if (anchor instanceof Element) return anchor.getAttribute('data-lab-anchor') ?? 'element';
  return `point ${String(Math.round(anchor.x))},${String(Math.round(anchor.y))}`;
}

/**
 * Reads the shared controller's state reactively while a host script opens the non-modal menu at
 * one word, moves it to the other and closes it. A press outside would close the menu, so the
 * script runs on timers rather than through buttons pressed while it is open.
 */
function ExternalController() {
  const { isOpen, anchor } = useMenuControllerState(sharedController);
  const first = useRef<HTMLSpanElement>(null);
  const second = useRef<HTMLSpanElement>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const tour = () => {
    if (!first.current || !second.current) return;
    const [pears, plums] = [first.current, second.current];
    setSteps([]);
    const unsubscribe = sharedController.subscribe(() => {
      const snapshot = sharedController.getSnapshot();
      setSteps((list) => [
        ...list,
        snapshot.isOpen ? `open at ${describeAnchor(snapshot.anchor)}` : 'closed',
      ]);
      if (!snapshot.isOpen) unsubscribe();
    });
    sharedController.open(pears);
    setTimeout(() => sharedController.move(plums), 700);
    setTimeout(() => sharedController.close(), 1400);
  };
  return (
    <div data-lab-demo="external-controller">
      <p>
        <span ref={first} data-lab-anchor="pears">
          Pears
        </span>{' '}
        and{' '}
        <span ref={second} data-lab-anchor="plums">
          Plums
        </span>
      </p>
      <Button size="sm" variant="secondary" onPress={tour}>
        Open, move and close
      </Button>
      <p data-lab-output="external-controller">
        isOpen: {String(isOpen)}; anchor: {describeAnchor(anchor)}
      </p>
      <p data-lab-output="external-steps">Steps: {steps.join(', ') || 'none yet'}</p>
      <ContextMenu
        controller={sharedController}
        placement="end top"
        isNonModal
        aria-label="Fruit menu"
      >
        <EditMenu onAction={() => sharedController.close()} />
      </ContextMenu>
    </div>
  );
}

export function ContextMenuCoverageSections() {
  return (
    <>
      <LabSection
        title="Inside text controls"
        description="By default a right-click, long touch, Shift+F10 or Context Menu key in the title, body or caption keeps the browser's own menu; outside them the target's menu opens. With opensInsideText the target's menu opens from the controls too."
      >
        <TextControlTargets />
      </LabSection>
      <LabSection
        title="Element anchor placement"
        description="placement top end: a keyboard opening (Shift+F10 or the Context Menu key) places the menu above the target, aligned to its end, instead of below its start."
      >
        <PlacedTarget />
      </LabSection>
      <LabSection
        title="Point menu owner"
        description="Open at the row opens a non-modal point menu whose triggerRef is the row inside the scrolling list: scrolling the list closes it, while scrolling elsewhere leaves it open. (A modal menu locks scrolling instead.)"
      >
        <ScrollingOwner />
      </LabSection>
      <LabSection
        title="Controller made outside React"
        description="createMenuController makes the controller once at module level; useMenuControllerState reports its open state and anchor, and a subscription logs each step, as the button opens the non-modal menu at Pears (placed at its end), moves it to Plums and closes it."
      >
        <ExternalController />
      </LabSection>
    </>
  );
}
