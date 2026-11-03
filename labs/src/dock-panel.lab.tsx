import {
  CalendarGlyph,
  FolderGlyph,
  HelpGlyph,
  InfoGlyph,
  LinkGlyph,
  LockGlyph,
  RefreshGlyph,
  SearchGlyph,
  UsersGlyph,
  WarningGlyph,
} from '../../src/core/glyphs.js';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { DockPanel, DockPanelPane } from '../../src/components/dock-panel/dock-panel.js';
import type { Key } from '../../src/core/props.js';
import { UiProvider } from '../../src/core/provider.js';
import { requireDefined } from './require-defined.js';
import { FilterDockExample } from './list-filter-examples.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

type Position = 'start' | 'end' | 'bottom';

// Lab-only frames so the panel and the main content are visible with or without a stylesheet.
const frame = (width: number, height: number | undefined, position: Position): CSSProperties => ({
  width,
  height,
  display: 'flex',
  flexDirection: position === 'bottom' ? 'column' : 'row',
  outline: '1px dotted currentColor',
  overflow: 'hidden',
});

const main: CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  minHeight: 0,
  padding: 12,
  overflow: 'auto',
};

/** The frame's main content, before or after the panel as its position puts it. */
function Frame({
  position,
  width,
  height,
  panel,
  children,
  ...data
}: {
  position: Position;
  width: number;
  height?: number | undefined;
  panel: ReactNode;
  children: ReactNode;
  'data-lab-frame'?: string;
}) {
  const content = <div style={main}>{children}</div>;
  return (
    <div style={frame(width, height, position)} {...data}>
      {position === 'start' ? panel : content}
      {position === 'start' ? content : panel}
    </div>
  );
}

const people = ['Maria Santos', 'Kenji Watanabe', 'Amara Okafor'];

function MatrixPanel({ position, state }: { position: Position; state: string }) {
  const name = `${requireDefined(position[0]).toUpperCase()}${position.slice(1)} ${state}`;
  return (
    <DockPanel
      label={name}
      position={position}
      defaultExpanded={state === 'expanded'}
      defaultSize={position === 'bottom' ? 120 : 220}
      minSize={position === 'bottom' ? 80 : 160}
    >
      <DockPanelPane id="outline" label={`Outline (${name})`} icon={FolderGlyph}>
        <p>Introduction, Methods, Results.</p>
      </DockPanelPane>
      <DockPanelPane id="people" label={`People (${name})`} icon={UsersGlyph} count={3}>
        <p>{people.join(', ')}</p>
      </DockPanelPane>
      <DockPanelPane id="activity" label={`Activity (${name})`} icon={RefreshGlyph} count={128}>
        <p>128 changes this week.</p>
      </DockPanelPane>
      <DockPanelPane id="locked" label={`Locked (${name})`} icon={LockGlyph} isDisabled>
        <p>Unavailable</p>
      </DockPanelPane>
    </DockPanel>
  );
}

/** Panes for the workspace demos; the search box shows that a hidden pane keeps its state. */
function InspectorPanes() {
  return [
    <DockPanelPane
      key="properties"
      id="properties"
      label="Properties"
      icon={InfoGlyph}
      actions={[
        { verb: 'edit', onPress: () => {} },
        {
          verb: 'more',
          items: [
            { id: 'rename', label: 'Rename' },
            { id: 'duplicate', label: 'Duplicate' },
          ],
        },
      ]}
    >
      <dl style={{ margin: 0 }}>
        <dt>Size</dt>
        <dd>2.4 MB</dd>
        <dt>Pages</dt>
        <dd>18</dd>
      </dl>
    </DockPanelPane>,
    <DockPanelPane
      key="search"
      id="search"
      label="Search"
      icon={SearchGlyph}
      footer={<small>Searches the open report only.</small>}
    >
      <label>
        Find <input data-lab-input="search" />
      </label>
    </DockPanelPane>,
    <DockPanelPane key="people" id="people" label="People" icon={UsersGlyph} count={3}>
      <ul>
        {people.map((person) => (
          <li key={person}>{person}</li>
        ))}
      </ul>
    </DockPanelPane>,
    <DockPanelPane key="activity" id="activity" label="Activity" icon={RefreshGlyph} count={128}>
      <p>128 changes this week.</p>
    </DockPanelPane>,
    <DockPanelPane
      key="permissions"
      id="permissions"
      label="Permissions"
      icon={LockGlyph}
      isDisabled
    >
      <p>Only owners see permissions.</p>
    </DockPanelPane>,
  ];
}

function Workspace() {
  const [log, setLog] = useState('Nothing yet');
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p>
        Last change: <output data-lab-output="workspace">{log}</output>
      </p>
      <Frame
        position="end"
        width={820}
        height={360}
        data-lab-frame="workspace"
        panel={
          <DockPanel
            label="Inspector"
            persistKey="dock-panel-lab.inspector"
            minMainSize={360}
            onSelectionChange={(key) => setLog(`selected ${key}`)}
            onExpandedChange={(isExpanded) => setLog(isExpanded ? 'expanded' : 'collapsed')}
            onSizeChangeEnd={(size) => setLog(`size ${size}px`)}
          >
            {InspectorPanes()}
          </DockPanel>
        }
      >
        <h3 style={{ marginTop: 0 }}>Quarterly report</h3>
        <p>The main content keeps at least 360 pixels beside the inspector.</p>
        <button type="button">Main action</button>
      </Frame>
    </div>
  );
}

function Controlled() {
  const [selectedKey, setSelectedKey] = useState<Key>('outline');
  const [isExpanded, setExpanded] = useState(true);
  const [size, setSize] = useState(260);
  // The host previews each size, keeps the last ended one, and returns to it on a cancel.
  const [savedSize, setSavedSize] = useState(260);
  const [ends, setEnds] = useState({ end: 0, cancel: 0 });
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p>
        <button type="button" onClick={() => setSelectedKey('history')}>
          Show history
        </button>{' '}
        <button type="button" onClick={() => setExpanded(!isExpanded)}>
          {isExpanded ? 'Collapse' : 'Expand'} from outside
        </button>{' '}
        <button
          type="button"
          onClick={() => {
            setSize(260);
            setSavedSize(260);
          }}
        >
          Reset size
        </button>{' '}
        <output data-lab-output="controlled">
          {String(selectedKey)}, {isExpanded ? 'expanded' : 'collapsed'}, {size}px
        </output>{' '}
        <output data-lab-output="controlled-ends">
          {ends.end} ends, {ends.cancel} cancels
        </output>
      </p>
      <Frame
        position="start"
        width={720}
        height={300}
        panel={
          <DockPanel
            label="Navigator"
            position="start"
            selectedKey={selectedKey}
            onSelectionChange={setSelectedKey}
            isExpanded={isExpanded}
            onExpandedChange={setExpanded}
            size={size}
            onSizeChange={setSize}
            onSizeChangeEnd={(next) => {
              setSavedSize(next);
              setEnds((current) => ({ ...current, end: current.end + 1 }));
            }}
            onSizeChangeCancel={() => {
              setSize(savedSize);
              setEnds((current) => ({ ...current, cancel: current.cancel + 1 }));
            }}
          >
            <DockPanelPane id="outline" label="Outline" icon={FolderGlyph}>
              <ol>
                <li>Scope</li>
                <li>Requirement 12</li>
                <li>Verification</li>
              </ol>
            </DockPanelPane>
            <DockPanelPane id="history" label="History" icon={CalendarGlyph}>
              <p>Edited yesterday by Kenji Watanabe.</p>
            </DockPanelPane>
          </DockPanel>
        }
      >
        <p>The host holds the selection, the expanded state and the size.</p>
      </Frame>
    </div>
  );
}

function Console() {
  return (
    <Frame
      position="bottom"
      width={640}
      height={320}
      data-lab-frame="console"
      panel={
        <DockPanel label="Console" position="bottom" defaultSize={150} minSize={100} maxSize={240}>
          <DockPanelPane
            id="problems"
            label="Problems"
            icon={WarningGlyph}
            count={12}
            actions={[{ verb: 'refresh', onPress: () => {} }]}
          >
            <p>Line 4: unknown unit “km/hr”.</p>
          </DockPanelPane>
          <DockPanelPane id="output" label="Output" icon={InfoGlyph}>
            <p>Build finished in 2.1 s.</p>
          </DockPanelPane>
        </DockPanel>
      }
    >
      <p>Drag the separator above the console, or focus it and use Up and Down.</p>
    </Frame>
  );
}

function Narrow() {
  const [isWide, setWide] = useState(false);
  return (
    <>
      <p>
        <button type="button" onClick={() => setWide(!isWide)}>
          {isWide ? 'Narrow the frame' : 'Widen the frame'}
        </button>
      </p>
      <Frame
        position="end"
        width={isWide ? 800 : 480}
        height={260}
        data-lab-frame="narrow"
        panel={
          <DockPanel label="Helper" overlayBelow={600}>
            <DockPanelPane id="tips" label="Tips" icon={HelpGlyph}>
              <p>Press a launcher to open its pane in a drawer.</p>
              <label>
                Tip draft <input />
              </label>
            </DockPanelPane>
            <DockPanelPane id="links" label="Links" icon={LinkGlyph} count={2}>
              <p>Two linked records.</p>
              <label>
                Link draft <input />
              </label>
            </DockPanelPane>
          </DockPanel>
        }
      >
        <p>
          Below 600 pixels the panel keeps only its launchers. The drafts survive opening and
          closing the drawer and widening the frame.
        </p>
      </Frame>
    </>
  );
}

const tasks = ['Import records', 'Check totals', 'Send summary', 'Archive month', 'Plan review'];

/** A frame with no height of its own: the open pane decides how tall the panel is. */
function ContentSized() {
  return (
    <Frame
      position="end"
      width={640}
      data-lab-frame="content-sized"
      panel={
        <DockPanel label="Tasks">
          <DockPanelPane id="tasks" label="Task list" icon={CalendarGlyph}>
            <ul>
              {tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
            <button type="button">New task</button>
          </DockPanelPane>
        </DockPanel>
      }
    >
      <p>The frame sets no height, so it grows to the open pane.</p>
    </Frame>
  );
}

/** Panes that arrive after the panel mounted: the first one shown stays shown as others come. */
function ArrivingPanes() {
  const [ids, setIds] = useState<readonly string[]>([]);
  const add = (id: string) =>
    setIds((current) => (current.includes(id) ? current : [id, ...current]));
  return (
    <Frame
      position="end"
      width={520}
      height={220}
      data-lab-frame="arriving"
      panel={
        <DockPanel label="Arriving">
          {ids.map((id) => (
            <DockPanelPane key={id} id={id} label={id} icon={FolderGlyph}>
              <label>
                Note <input data-lab-input={id} />
              </label>
            </DockPanelPane>
          ))}
        </DockPanel>
      }
    >
      <p>
        <button type="button" onClick={() => setIds(['Notes', 'Links'])}>
          Load panes
        </button>{' '}
        <button type="button" onClick={() => add('Extra')}>
          Add a pane first
        </button>{' '}
        <button type="button" onClick={() => setIds((current) => [...current].reverse())}>
          Reverse the panes
        </button>
      </p>
    </Frame>
  );
}

/**
 * The page removes or disables the Notes pane one second after a button press, time enough to put
 * focus back in its field: focus moves to the pane shown in its place.
 */
function PaneTakenAway() {
  const [notes, setNotes] = useState<'shown' | 'disabled' | 'removed'>('shown');
  const later = (next: 'disabled' | 'removed') => window.setTimeout(() => setNotes(next), 1000);
  return (
    <Frame
      position="end"
      width={520}
      height={220}
      data-lab-frame="taken-away"
      panel={
        <DockPanel label="Taken away">
          {notes === 'removed' ? null : (
            <DockPanelPane
              id="notes"
              label="Notes"
              icon={FolderGlyph}
              isDisabled={notes === 'disabled'}
            >
              <label>
                Note <input />
              </label>
            </DockPanelPane>
          )}
          <DockPanelPane id="links" label="Links" icon={SearchGlyph}>
            <p>Saved links.</p>
          </DockPanelPane>
        </DockPanel>
      }
    >
      <p>
        <button type="button" onClick={() => later('removed')}>
          Remove Notes in one second
        </button>{' '}
        <button type="button" onClick={() => later('disabled')}>
          Disable Notes in one second
        </button>{' '}
        <button type="button" onClick={() => setNotes('shown')}>
          Restore Notes
        </button>
      </p>
    </Frame>
  );
}

const projects = [
  'Overview',
  'Requirements and acceptance criteria',
  'Open questions',
  'Decisions',
  'Attachments',
  'Change history',
  'Reviewers',
];

/** Many panes with long labels: the tabs scroll freely, and the rail scrolls on a short frame. */
function Overflowing({ state }: { state: 'expanded' | 'collapsed' }) {
  return (
    <Frame
      position="end"
      width={560}
      height={state === 'expanded' ? 220 : 180}
      data-lab-frame={`overflow-${state}`}
      panel={
        <DockPanel
          label={`Project ${state}`}
          defaultExpanded={state === 'expanded'}
          defaultSize={300}
          defaultSelectedKey="Change history"
        >
          {projects.map((name, index) => (
            <DockPanelPane
              key={name}
              id={name}
              label={name}
              icon={index % 2 ? FolderGlyph : InfoGlyph}
              count={index === 1 ? 7 : index === 4 ? 42 : undefined}
              isDisabled={name === 'Decisions'}
            >
              <p>{name}</p>
            </DockPanelPane>
          ))}
        </DockPanel>
      }
    >
      <p>
        Wheel over the tabs to scroll them; fades mark the edges that hide tabs. The selected tab
        shows clear of the fades when the panel expands or resizes.
      </p>
    </Frame>
  );
}

/** A collapsed panel whose separator a drag pulls open: it resumes its remembered size. */
function DragToExpand({ rtl }: { rtl: boolean }) {
  const [log, setLog] = useState('Nothing yet');
  const name = rtl ? 'Notes right to left' : 'Notes';
  return (
    <UiProvider locale={rtl ? 'he-IL' : 'en-US'}>
      <div dir={rtl ? 'rtl' : 'ltr'} style={{ display: 'grid', gap: 8 }}>
        <p>
          Last change: <output data-lab-output={rtl ? 'drag-rtl' : 'drag'}>{log}</output>
        </p>
        <Frame
          position="end"
          width={640}
          height={200}
          data-lab-frame={rtl ? 'drag-rtl' : 'drag'}
          panel={
            <DockPanel
              label={name}
              defaultExpanded={false}
              defaultSize={240}
              minSize={160}
              maxSize={420}
              onExpandedChange={(isExpanded) => setLog(isExpanded ? 'expanded' : 'collapsed')}
              onSizeChangeEnd={(size) => setLog(`ended at ${size}px`)}
              onSizeChangeCancel={() => setLog('cancelled')}
            >
              <DockPanelPane id="notes" label="Notes" icon={FolderGlyph} count={2}>
                <label>
                  Draft <input />
                </label>
              </DockPanelPane>
              <DockPanelPane id="links" label="Links" icon={LinkGlyph}>
                <p>Saved links.</p>
              </DockPanelPane>
            </DockPanel>
          }
        >
          <p>
            Drag the collapsed rail&apos;s inner edge toward the content: the panel expands at its
            remembered 240 pixels and follows the same drag.
          </p>
        </Frame>
      </div>
    </UiProvider>
  );
}

mountLab(
  <>
    <LabSection title="Count appearance overrides">
      <DockPanel label="Count appearances" defaultExpanded={false}>
        <DockPanelPane
          id="quiet-launcher"
          label="Quiet launcher"
          icon={InfoGlyph}
          count={7}
          countVariant="solid"
          launcherCountVariant="subtle"
        >
          Expanded solid, collapsed subtle.
        </DockPanelPane>
      </DockPanel>
    </LabSection>
    <LabSection title="Counted list filters">
      <FilterDockExample />
    </LabSection>
    <LabSection
      title="Positions and states"
      description="Each position expanded and collapsed. Expanded, one strip of tabs sits beside the collapse button; collapsed, a 40 pixel rail of launchers, read bottom to top beside a side edge. Counts above 9 show 9+; the last pane is disabled."
    >
      <StateMatrix
        axes={{ position: ['start', 'end', 'bottom'], state: ['expanded', 'collapsed'] }}
        render={({ position, state }) => (
          <Frame
            position={position}
            width={380}
            height={220}
            panel={<MatrixPanel position={position} state={state} />}
          >
            <p>Main</p>
          </Frame>
        )}
      />
    </LabSection>
    <LabSection
      title="Workspace"
      description="The arrow keys select tabs; the button beside them collapses the panel, and a launcher on the rail expands it again with focus on its tab. Hidden panes stay mounted (type in Search, switch away and back). The selection, expanded state and size persist across reloads."
    >
      <Workspace />
    </LabSection>
    <LabSection
      title="Controlled"
      description="The host controls every value; the buttons change them from outside. It previews each size, keeps the size a drag ends at, and returns to it when a drag is cancelled."
    >
      <Controlled />
    </LabSection>
    <LabSection title="Bottom panel" description="A console docked against the bottom edge.">
      <Console />
    </LabSection>
    <LabSection
      title="Narrow frame"
      description="Below overlayBelow the panel keeps its launcher rail and a launcher opens its pane in a drawer; Escape closes it and focus returns to the launcher. The panes move between the drawer and the docked panel without mounting again, so a draft typed in either survives the frame changing width."
    >
      <Narrow />
    </LabSection>
    <LabSection
      title="Content-sized host"
      description="A host that sets no height: the docked panel is as tall as its open pane, so the whole list and its button show."
    >
      <ContentSized />
    </LabSection>
    <LabSection
      title="Panes that arrive"
      description="The panel mounts with no panes. Once they load, the first pane shown stays shown, by its id, while a pane is added before it or the panes reverse; only removing it would select another."
    >
      <ArrivingPanes />
    </LabSection>
    <LabSection
      title="A pane taken away"
      description="Press a button, then put focus in the Notes field within a second: when the page removes or disables Notes, focus moves to the Links pane shown in its place instead of being lost."
    >
      <PaneTakenAway />
    </LabSection>
    <LabSection
      title="Overflow"
      description="Seven panes with long labels. Expanded, the tabs scroll freely by wheel or swipe, without snapping or steppers; collapsed, the short rail keeps its labels and scrolls natively."
    >
      <Overflowing state="expanded" />
      <Overflowing state="collapsed" />
    </LabSection>
    <LabSection
      title="Drag to expand"
      description="The collapsed rail's separator stays draggable: one drag expands the panel and keeps resizing it. Keyboard users expand with the button above the launchers instead, so the collapsed separator stays out of the tab order."
    >
      <DragToExpand rtl={false} />
      <DragToExpand rtl />
    </LabSection>
  </>,
);
