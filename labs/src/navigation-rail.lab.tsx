import { FolderGlyph, UsersGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import { NavigationRail } from '../../src/components/navigation-rail/navigation-rail.js';
import { Disclosure } from '../../src/components/disclosure/disclosure.js';
import { ExpandToggle } from '../../src/components/expand-toggle/expand-toggle.js';
import {
  NavigationRailGroup,
  NavigationRailItem,
  NavigationRailSection,
} from '../../src/components/navigation-rail/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  KitchenRail,
  NavigatingKitchenRail,
  kitchenPages,
  type KitchenPage,
} from './navigation-rail-cases.js';

/** A group whose panel holds a toggle and a disclosure of its own, beside a nested group. */
function GroupToggles() {
  return (
    <div style={{ display: 'flex', height: 320 }} data-lab-demo="group-toggles">
      <NavigationRail aria-label="Tools navigation">
        <NavigationRailSection title="Workspace">
          <NavigationRailGroup label="Tools" defaultExpanded>
            <li>
              <ExpandToggle label="Details" defaultExpanded={false} />
            </li>
            <li>
              <Disclosure title="Shortcuts">
                <p>Press G then I to open the inbox.</p>
              </Disclosure>
            </li>
            <NavigationRailGroup label="Lists" defaultExpanded>
              <NavigationRailItem label="Groceries" href="#groceries" />
            </NavigationRailGroup>
          </NavigationRailGroup>
        </NavigationRailSection>
      </NavigationRail>
    </div>
  );
}

/**
 * A rail with a header and a footer whose collapsed state and width persist across reloads, beside
 * the page it navigates to.
 */
function KitchenWorkspace() {
  const [current, setCurrent] = useState<KitchenPage>('inbox');
  const [width, setWidth] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', height: 520 }} data-lab-demo="workspace">
      <KitchenRail
        aria-label="Kitchen navigation"
        current={current}
        onNavigate={setCurrent}
        header={<span>Kitchen</span>}
        footer={<Avatar name="Maria Santos" size="sm" />}
        isResizable
        persistKey="lab-kitchen-rail"
        onWidthChange={setWidth}
      />
      <div style={{ padding: 16 }}>
        <p data-lab-page="">Showing {kitchenPages[current]}</p>
        <p data-lab-width="">{width === null ? 'Not resized yet' : `Resized to ${width}px`}</p>
      </div>
    </div>
  );
}

/**
 * A rail the page collapses one second into a drag of its edge: the unfinished width is dropped,
 * so expanding it again shows the width it had before the drag.
 */
function CollapsedMidDrag() {
  const [current, setCurrent] = useState<KitchenPage>('inbox');
  const [isCollapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  return (
    <div
      style={{ display: 'flex', height: 360 }}
      data-lab-demo="collapsed-mid-drag"
      onPointerDownCapture={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[role="separator"]')) window.setTimeout(() => setCollapsed(true), 1000);
      }}
    >
      <KitchenRail
        aria-label="Pantry navigation"
        current={current}
        onNavigate={setCurrent}
        isResizable
        isCollapsed={isCollapsed}
        onCollapsedChange={setCollapsed}
        onWidthChange={setWidth}
      />
      <div style={{ padding: 16 }}>
        <p data-lab-output="committed width">
          {width === null ? 'No width committed' : `Committed ${width}px`}
        </p>
      </div>
    </div>
  );
}

const bounds = { narrow: [160, 260], wide: [220, 360] } as const;
type Bounds = keyof typeof bounds;

/**
 * An uncontrolled rail that starts at 200px within bounds the reader picks, and a group the page
 * opens and closes.
 */
function BoundedRail() {
  const [range, setRange] = useState<Bounds>('narrow');
  const [width, setWidth] = useState<number | null>(null);
  const [isListsOpen, setListsOpen] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);
  const [minWidth, maxWidth] = bounds[range];
  return (
    <div data-lab-demo="bounded">
      <div role="group" aria-label="Rail options">
        <SegmentedChoice
          aria-label="Resize bounds"
          sizing="content"
          options={[
            { value: 'narrow', label: '160 to 260px' },
            { value: 'wide', label: '220 to 360px' },
          ]}
          value={range}
          onChange={(value) => {
            setRange((value as Bounds | null) ?? 'narrow');
            setWidth(null);
          }}
        />
        <Switch isSelected={isListsOpen} onChange={setListsOpen}>
          Lists group open
        </Switch>
      </div>
      <div style={{ display: 'flex', height: 320 }}>
        <NavigationRail
          key={range}
          aria-label="Bounded navigation"
          isResizable
          defaultWidth={200}
          minWidth={minWidth}
          maxWidth={maxWidth}
          onWidthChange={setWidth}
        >
          <NavigationRailSection title="Workspace">
            <NavigationRailItem label="Inbox" icon={FolderGlyph} href="#inbox" />
            <NavigationRailGroup
              label="Lists"
              icon={UsersGlyph}
              isExpanded={isListsOpen}
              onExpandedChange={(isOpen) => {
                setListsOpen(isOpen);
                setChanges((current) => [...current, `onExpandedChange(${String(isOpen)})`]);
              }}
            >
              <NavigationRailItem label="Groceries" href="#groceries" />
              <NavigationRailItem label="Errands" href="#errands" />
            </NavigationRailGroup>
          </NavigationRailSection>
        </NavigationRail>
        <div style={{ padding: 16 }}>
          <p>
            Bounds: <output data-lab-output="bounds">{`${minWidth} to ${maxWidth}px`}</output>
          </p>
          <p>
            Committed width:{' '}
            <output data-lab-output="width">
              {width === null ? 'none yet (starts at 200px)' : `${width}px`}
            </output>
          </p>
          <p>
            Group changes: <output data-lab-output="group">{changes.join(', ') || 'none'}</output>
          </p>
        </div>
      </div>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Expanded and collapsed rails, with a fixed width or a resize handle. Collapsed, items show their icon (or initials) and the label in a tooltip; groups open the rail."
    >
      <StateMatrix
        axes={{ rail: ['expanded', 'collapsed'], width: ['fixed', 'resizable'] }}
        render={({ rail, width }) => (
          <div style={{ display: 'flex', height: 480 }}>
            <NavigatingKitchenRail
              aria-label={`Navigation, ${rail}, ${width}`}
              defaultCollapsed={rail === 'collapsed'}
              isResizable={width === 'resizable'}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Items"
      description="Icons, initials for an item without one, counts capped at 99+, and the current page."
    >
      <StateMatrix
        axes={{ rail: ['expanded', 'collapsed'] }}
        render={({ rail }) => (
          <div style={{ display: 'flex', height: 260 }}>
            <NavigationRail aria-label={`Items, ${rail}`} defaultCollapsed={rail === 'collapsed'}>
              <NavigationRailSection title="Lists">
                <NavigationRailItem
                  label="Groceries"
                  href="#groceries"
                  icon={FolderGlyph}
                  isCurrent
                />
                <NavigationRailItem
                  label="Shared lists"
                  href="#shared"
                  icon={UsersGlyph}
                  count={7}
                />
                <NavigationRailItem label="Market days" href="#market" count={250} />
              </NavigationRailSection>
            </NavigationRail>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left page the rail sits on the right and the current page's bar runs down its start edge, on the right."
    >
      <div dir="rtl" style={{ display: 'flex', height: 160 }} data-lab-demo="rtl">
        <NavigationRail aria-label="Lists, right to left">
          <NavigationRailSection title="Lists">
            <NavigationRailItem label="Groceries" href="#groceries" icon={FolderGlyph} isCurrent />
            <NavigationRailItem label="Shared lists" href="#shared" icon={UsersGlyph} />
          </NavigationRailSection>
        </NavigationRail>
      </div>
    </LabSection>
    <LabSection
      title="Workspace"
      description="Press items to move the current page; groups open when the current page moves inside. Collapse the rail or drag its edge, then reload: both persist. Up and Down move between entries."
    >
      <KitchenWorkspace />
    </LabSection>
    <LabSection
      title="Collapsed during a drag"
      description="The page collapses this rail one second after a drag of its edge starts. The drag ends with it: releasing commits nothing, and expanding the rail shows its earlier width."
    >
      <CollapsedMidDrag />
    </LabSection>
    <LabSection
      title="Width bounds and a page-controlled group"
      description="The rail starts at defaultWidth 200px and resizes within the chosen minWidth and maxWidth, by dragging its edge or with the arrow keys, Home and End on the handle. The page owns the Lists group: the switch opens and closes it, and pressing the group reports onExpandedChange, which the page follows."
    >
      <BoundedRail />
    </LabSection>
    <LabSection
      title="Toggles in a group"
      description="The Tools group holds a Details toggle and a Shortcuts disclosure. Both start closed and open on their own, while Tools stays open and its nested Lists group still works."
    >
      <GroupToggles />
    </LabSection>
  </>,
);
