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
import { requireDefined } from './require-defined.js';
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
      <DockPanelPane id="outline" label={`Outline (${name})`} icon={FolderGlyph} title="Outline">
        <p>Introduction, Methods, Results.</p>
      </DockPanelPane>
      <DockPanelPane id="people" label={`People (${name})`} icon={UsersGlyph} count={3}>
        <p>{people.join(', ')}</p>
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
      title="Report.pdf"
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
    <DockPanelPane key="search" id="search" label="Search" icon={SearchGlyph} title="Search">
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
            onSizeChange={(size) => setLog(`size ${size}px`)}
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
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p>
        <button type="button" onClick={() => setSelectedKey('history')}>
          Show history
        </button>{' '}
        <button type="button" onClick={() => setExpanded(!isExpanded)}>
          {isExpanded ? 'Collapse' : 'Expand'} from outside
        </button>{' '}
        <button type="button" onClick={() => setSize(260)}>
          Reset size
        </button>{' '}
        <output data-lab-output="controlled">
          {String(selectedKey)}, {isExpanded ? 'expanded' : 'collapsed'}, {size}px
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
          >
            <DockPanelPane id="outline" label="Outline" icon={FolderGlyph} title="Outline">
              <ol>
                <li>Scope</li>
                <li>Requirement 12</li>
                <li>Verification</li>
              </ol>
            </DockPanelPane>
            <DockPanelPane id="history" label="History" icon={CalendarGlyph} title="History">
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
            title="12 problems"
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
            <DockPanelPane id="tips" label="Tips" icon={HelpGlyph} title="Tips">
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
          <DockPanelPane id="tasks" label="Task list" icon={CalendarGlyph} title="Tasks">
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

mountLab(
  <>
    <LabSection
      title="Positions and states"
      description="Each position expanded and collapsed. The second pane has a count; the third is disabled."
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
      description="A launcher opens its pane and moves focus into it; pressing the open pane's launcher collapses the panel. Hidden panes stay mounted (type in Search, switch away and back). The selection, expanded state and size persist across reloads."
    >
      <Workspace />
    </LabSection>
    <LabSection
      title="Controlled"
      description="The host controls every value; the buttons change them from outside."
    >
      <Controlled />
    </LabSection>
    <LabSection title="Bottom panel" description="A console docked against the bottom edge.">
      <Console />
    </LabSection>
    <LabSection
      title="Narrow frame"
      description="Below overlayBelow the open pane shows in a drawer; Escape closes it and focus returns to the launcher. The panes move between the drawer and the docked panel without mounting again, so a draft typed in either survives the frame changing width."
    >
      <Narrow />
    </LabSection>
    <LabSection
      title="Content-sized host"
      description="A host that sets no height: the docked panel is as tall as its open pane, so the whole list and its button show."
    >
      <ContentSized />
    </LabSection>
  </>,
);
