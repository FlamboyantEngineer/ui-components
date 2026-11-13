import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  CascaderField,
  type CascaderLoader,
  type CascaderOption,
  type CascaderValue,
} from '../../src/components/cascader-field/cascader-field.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  fieldLayouts,
  type FieldStateName,
  fieldStates,
  useLabFieldState,
} from './field-states.js';
import { LabOutput } from './lab-output.js';

const places: CascaderOption[] = [
  {
    id: 'north',
    label: 'North',
    children: [
      {
        id: 'lakes',
        label: 'Lakes',
        children: [
          { id: 'pine', label: 'Pine Harbour' },
          { id: 'fern', label: 'Fern Bay', isDisabled: true },
          { id: 'reed', label: 'Reed Point', description: 'Seasonal ferry' },
        ],
      },
      { id: 'hills', label: 'Hills', children: [{ id: 'oak', label: 'Oak Rise' }] },
    ],
  },
  {
    id: 'south',
    label: 'South',
    children: [
      { id: 'coast', label: 'Coast', children: [{ id: 'pine-s', label: 'Pine Harbour' }] },
      { id: 'plains', label: 'Plains', children: [{ id: 'mill', label: 'Mill Cross' }] },
    ],
  },
  { id: 'closed', label: 'Closed region', isDisabled: true, children: [] },
  { id: 1, label: 'Zone one' },
  { id: '1', label: 'Zone "1"' },
];

const chosen = ['north', 'lakes', 'pine'];
const edited = ['south', 'coast', 'pine-s'];
const flagged = ['north', 'hills', 'oak'];

function describe(value: CascaderValue): string {
  return value === null ? 'empty' : JSON.stringify(value);
}

function Sample({
  state,
  layout,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
}) {
  const props = useLabFieldState<CascaderValue>(state, {
    value: chosen,
    edited,
    invalid: flagged,
    warning: flagged,
    empty: null,
  });
  return <CascaderField label="Place" labelLayout={layout} options={places} {...props} />;
}

function Choosing() {
  const [changed, setChanged] = useState('none');
  const [committed, setCommitted] = useState('none');
  return (
    <>
      <CascaderField
        label="Destination"
        options={places}
        description="Right opens a level, Left goes back, Enter chooses a leaf."
        onChange={(value) => setChanged(describe(value))}
        onCommit={(value) => setCommitted(describe(value))}
        data-lab-field="choosing"
      />
      <CascaderField
        label="Restored"
        options={places}
        defaultValue={['north', 'gone']}
        description="An id whose option is not known shows itself."
        data-lab-field="unknown"
      />
      <LabOutput name="Changed">{changed}</LabOutput>
      <LabOutput name="Committed">{committed}</LabOutput>
    </>
  );
}

const remote: CascaderOption[] = [
  { id: 'east', label: 'East', hasChildren: true },
  { id: 'west', label: 'West', hasChildren: true },
  { id: 'faulty', label: 'Unreachable', hasChildren: true },
];

/** Answers after a pause; the third branch fails until it is retried twice. */
function useSlowLoader() {
  const [log, setLog] = useState<string[]>([]);
  const [failures, setFailures] = useState(0);
  const loadChildren: CascaderLoader = (option, { signal }) => {
    setLog((current) => [...current, String(option.id)]);
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (option.id === 'faulty' && failures < 2) {
          setFailures((count) => count + 1);
          reject(new Error('Offline'));
          return;
        }
        resolve([
          { id: `${String(option.id)}-a`, label: `${option.label} Market` },
          { id: `${String(option.id)}-b`, label: `${option.label} Quay` },
        ]);
      }, 600);
      signal.addEventListener('abort', () => window.clearTimeout(timer));
    });
  };
  return { loadChildren, log };
}

function Loading() {
  const { loadChildren, log } = useSlowLoader();
  const [value, setValue] = useState<CascaderValue>(null);
  return (
    <>
      <CascaderField
        label="Branch office"
        options={remote}
        loadChildren={loadChildren}
        value={value}
        onChange={setValue}
        description="Each region loads on first opening, and a chosen region loads as the panels open; Unreachable fails twice, then loads."
        data-lab-field="loading"
      />
      <Button onPress={() => setValue(['east', 'east-a'])}>Choose East Market</Button>
      <LabOutput name="Value">{describe(value)}</LabOutput>
      <LabOutput name="Loads">{log.join(' ') || 'none'}</LabOutput>
    </>
  );
}

function Saved() {
  const [saved, setSaved] = useState<CascaderValue>(chosen);
  const [value, setValue] = useState<CascaderValue>(chosen);
  return (
    <>
      <CascaderField
        label="Home base"
        options={places}
        value={value}
        onChange={setValue}
        committedValue={saved}
        defaultValue={flagged}
        menu={['clear', 'reset', 'set-default']}
        data-lab-field="dirty"
      />
      <Button onPress={() => setSaved(value)}>Save</Button>
      <LabOutput name="Saved">{describe(saved)}</LabOutput>
    </>
  );
}

function OwnedOpen() {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <CascaderField
        label="Pickup point"
        options={places}
        defaultValue={chosen}
        isOpen={isOpen}
        onOpenChange={setOpen}
      />
      <Button onPress={() => setOpen(true)}>Show the panels</Button>
      <LabOutput name="Open">{isOpen ? 'open' : 'closed'}</LabOutput>
    </>
  );
}

function FormValue() {
  const [entries, setEntries] = useState('none');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setEntries(
          [...data.entries()].map(([name, entry]) => `${name}=${String(entry)}`).join(' '),
        );
      }}
    >
      <CascaderField label="Stop" name="stop" options={places} defaultValue={flagged} />
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
      <LabOutput name="Form">{entries}</LabOutput>
    </form>
  );
}

mountLab(
  <>
    <LabSection title="Layouts and states" description="Every label layout against every state.">
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <Sample state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Choosing a path"
      description="Two places share a label, a disabled option is skipped, and 1 and '1' stay apart."
    >
      <Choosing />
    </LabSection>
    <LabSection
      title="Loading levels"
      description="Branches load on demand, show their status and retry a failure."
    >
      <Loading />
    </LabSection>
    <LabSection
      title="Dirty, restore, undo and the field menu"
      description="Choose, then restore, undo with Ctrl+Z, clear with Backspace or open the field's menu."
    >
      <Saved />
    </LabSection>
    <LabSection
      title="Owned open state"
      description="The host opens the panels; each opening starts at the chosen path."
    >
      <OwnedOpen />
    </LabSection>
    <LabSection title="Form value" description="A named field submits its leaf's id.">
      <FormValue />
    </LabSection>
    <LabSection title="Right to left" description="Left opens a level and Right goes back.">
      <UiProvider locale="ar">
        <div dir="rtl">
          <CascaderField label="RTL" options={places} defaultValue={chosen} />
        </div>
      </UiProvider>
    </LabSection>
  </>,
);
