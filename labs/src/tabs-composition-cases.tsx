import { useEffect, useState } from 'react';
import { Icon } from '../../src/components/icon/icon.js';
import { Switch } from '../../src/components/switch/switch.js';
import { Tab, TabList, TabPanel, Tabs } from '../../src/components/tabs/tabs.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { StarGlyph } from '../../src/core/glyphs.js';
import { LabSection } from './chrome/index.js';

const notes = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
];

/** A draft field that counts how often its panel mounted. */
function DraftPanelContent({ day, onMount }: { day: string; onMount: (day: string) => void }) {
  useEffect(() => onMount(day), [day, onMount]);
  return <TextField label={`${day} note`} defaultValue="" />;
}

/** Panels that keep their drafts while hidden when shouldForceMount is on. */
function ForceMountedPanels() {
  const [isForced, setForced] = useState(false);
  const [mounts, setMounts] = useState<Record<string, number>>({});
  const [onMount] = useState(
    () => (day: string) => setMounts((current) => ({ ...current, [day]: (current[day] ?? 0) + 1 })),
  );
  return (
    <div data-lab-case="force-mount">
      <Switch
        isSelected={isForced}
        onChange={(value) => {
          setForced(value);
          setMounts({});
        }}
      >
        Keep hidden panels mounted
      </Switch>
      <Tabs key={String(isForced)}>
        <TabList aria-label="Day notes">
          {notes.map((note) => (
            <Tab key={note.id} id={note.id}>
              {note.label}
            </Tab>
          ))}
        </TabList>
        {notes.map((note) => (
          <TabPanel key={note.id} id={note.id} shouldForceMount={isForced}>
            <DraftPanelContent day={note.label} onMount={onMount} />
          </TabPanel>
        ))}
      </Tabs>
      <p>
        Mounts:{' '}
        <output data-lab-output="mounts">
          {notes.map((note) => `${note.label} ${String(mounts[note.label] ?? 0)}`).join(', ')}
        </output>
      </p>
    </div>
  );
}

/** Every part swapped for the caller's element, each showing the state it was given. */
function ComposedTabs() {
  const [menuFor, setMenuFor] = useState('none');
  return (
    <div data-lab-case="composed">
      <Tabs
        render={(props, state) => (
          <div {...props} data-lab-swapped="tabs" data-lab-orientation={state.orientation} />
        )}
      >
        <TabList
          aria-label="Composed tabs"
          render={(props, state) => (
            <div {...props} data-lab-swapped="list" data-lab-orientation={state.orientation} />
          )}
        >
          <Tab
            id="starred"
            textValue="Starred"
            aria-label="Starred"
            onContextMenu={(event) => {
              event.preventDefault();
              setMenuFor('Starred');
            }}
            render={(props, state) => (
              <div {...props} data-lab-swapped="tab" data-lab-selected={String(state.isSelected)} />
            )}
          >
            <Icon icon={StarGlyph} />
          </Tab>
          <Tab
            id="recent"
            textValue="Recent"
            onContextMenu={(event) => {
              event.preventDefault();
              setMenuFor('Recent');
            }}
            render={(props, state) => (
              <div {...props} data-lab-swapped="tab" data-lab-selected={String(state.isSelected)} />
            )}
          >
            Recent
          </Tab>
          <Tab id="shared">Shared</Tab>
        </TabList>
        {['starred', 'recent', 'shared'].map((id) => (
          <TabPanel
            key={id}
            id={id}
            render={(props, state) => (
              <div
                {...props}
                data-lab-swapped="panel"
                data-lab-focus-visible={String(state.isFocusVisible)}
              />
            )}
          >
            {`The ${id} files.`}
          </TabPanel>
        ))}
      </Tabs>
      <p>
        Context menu asked for: <output data-lab-output="context">{menuFor}</output>
      </p>
    </div>
  );
}

/** A narrow menu list whose icon-only tab is listed in the menu by its textValue. */
function IconTabInMenu() {
  return (
    <div data-lab-case="text-value" style={{ width: 200 }}>
      <Tabs>
        <TabList aria-label="Reading list" overflow="menu">
          <Tab id="overview">Overview</Tab>
          <Tab id="activity">Activity</Tab>
          <Tab id="archive">Archive</Tab>
          <Tab id="starred" textValue="Starred" aria-label="Starred">
            <Icon icon={StarGlyph} />
          </Tab>
        </TabList>
        {['overview', 'activity', 'archive', 'starred'].map((id) => (
          <TabPanel key={id} id={id}>
            {`The ${id} list.`}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}

export function TabsCompositionCases() {
  return (
    <>
      <LabSection
        title="Force-mounted panels"
        description="Type a note on Monday, switch to Tuesday and back. By default the hidden panel unmounts, so the draft is lost and the mount count rises; switch shouldForceMount on and every panel mounts once, keeping its draft while hidden and inert. Arrow keys still move between the tabs."
      >
        <ForceMountedPanels />
      </LabSection>
      <LabSection
        title="Swapped elements, text values and context menus"
        description="Tabs, TabList, Tab and TabPanel each render through the caller's element, which receives the props and the state (orientation, selection, focus) and shows them as data attributes. Right-click or press the context menu key on Starred or Recent and the caller's onContextMenu reports it."
      >
        <ComposedTabs />
      </LabSection>
      <LabSection
        title="Text value of an icon tab"
        description="The starred tab shows only an icon. In this 200px list it moves into the overflow menu, which lists it by its textValue, Starred."
      >
        <IconTabInMenu />
      </LabSection>
    </>
  );
}
