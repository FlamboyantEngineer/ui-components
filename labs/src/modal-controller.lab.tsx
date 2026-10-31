import { useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ModalHost,
  createModalController,
  type ModalHandle,
} from '../../src/components/modal-controller/modal-controller.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const controller = createModalController();
const tones = ['neutral', 'danger'] as const;
const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
const colours = ['Teal', 'Plum', 'Amber'] as const;

function openCity(name: string) {
  return controller.open({
    title: name,
    'data-lab-modal': name.toLowerCase(),
    content: (handle) => (
      <>
        <p>Pick the next stop.</p>
        <Button size="sm" onPress={() => openCity(name === 'Lisbon' ? 'Oslo' : 'Kyoto')}>
          Open another
        </Button>{' '}
        <Button size="sm" onPress={() => controller.closeAll()}>
          Close all
        </Button>{' '}
        <Button size="sm" onPress={() => handle.close()}>
          Close {name}
        </Button>
      </>
    ),
  });
}

function RenameBody({ handle }: { handle: ModalHandle<string> }) {
  const [value, setValue] = useState('');
  return (
    <label>
      New name{' '}
      <input
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          handle.update({
            title: next ? `Rename to ${next}` : 'Rename',
            primaryAction: {
              label: 'Rename',
              isDisabled: next.trim() === '',
              onPress: () => handle.close(next.trim()),
            },
          });
        }}
      />
    </label>
  );
}

function Results() {
  const [colour, setColour] = useState('none');
  const [name, setName] = useState('none');
  return (
    <div>
      <Button
        size="sm"
        data-lab-open="colour"
        onPress={async () => {
          const handle = controller.open<string>({
            title: 'Pick a colour',
            'data-lab-modal': 'colour',
            cancelAction: {},
            content: (current) =>
              colours.map((entry) => (
                <Button key={entry} size="sm" onPress={() => current.close(entry)}>
                  {entry}
                </Button>
              )),
          });
          setColour((await handle.result) ?? 'dismissed');
        }}
      >
        Pick a colour
      </Button>{' '}
      <Button
        size="sm"
        data-lab-open="rename"
        onPress={async () => {
          const handle = controller.open<string>({
            title: 'Rename',
            'data-lab-modal': 'rename',
            primaryAction: { label: 'Rename', isDisabled: true },
            content: (current) => <RenameBody handle={current} />,
          });
          setName((await handle.result) ?? 'dismissed');
        }}
      >
        Rename Report.pdf
      </Button>
      <p>
        Colour: <output data-lab-output="colour">{colour}</output>
      </p>
      <p>
        Name: <output data-lab-output="name">{name}</output>
      </p>
    </div>
  );
}

const workspaces = { North: createModalController(), South: createModalController() };

/** Two workspaces, each with its own controller; one host shows the current one's modals. */
function Workspaces() {
  const [current, setCurrent] = useState<keyof typeof workspaces>('North');
  const [isSwitching, setSwitching] = useState(false);
  useEffect(() => {
    if (!isSwitching) return undefined;
    // Lab-only stand-in for the host switching workspace while a modal is open.
    const timer = setTimeout(() => {
      setSwitching(false);
      setCurrent((name) => (name === 'North' ? 'South' : 'North'));
    }, 2000);
    return () => clearTimeout(timer);
  }, [isSwitching]);
  const openNote = (name: keyof typeof workspaces) =>
    workspaces[name].open({
      title: `${name} note`,
      'data-lab-modal': `${name.toLowerCase()}-note`,
      content: <input aria-label="Note" defaultValue={`${name} default`} />,
      primaryAction: { label: 'Save', onPress: (close) => close() },
    });
  return (
    <div data-lab-demo="workspaces">
      <p>Showing: {current}</p>
      <Button
        size="sm"
        onPress={() => {
          if (workspaces.South.getSnapshot().length === 0) openNote('South');
          setSwitching(true);
          openNote(current);
        }}
      >
        Edit a note, then switch workspace
      </Button>
      <ModalHost controller={workspaces[current]} />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Tones and sizes"
      description="Each cell opens a modal through the controller with that tone and size."
    >
      <StateMatrix
        axes={{ tone: tones, size: sizes }}
        render={({ tone, size }) => (
          <Button
            size="sm"
            onPress={() =>
              controller.open({
                title: `Report.pdf (${tone}, ${size})`,
                tone,
                size,
                'data-lab-modal': `${tone}-${size}`,
                content: <p>Opened through the controller.</p>,
                primaryAction: {
                  label: tone === 'danger' ? 'Delete' : 'Apply',
                  onPress: (close) => close(),
                },
              })
            }
          >
            Open
          </Button>
        )}
      />
    </LabSection>
    <LabSection
      title="Results and updates"
      description="A modal closes with a value the opener awaits; another updates its title and primary action as you type."
    >
      <Results />
    </LabSection>
    <LabSection
      title="Stacking"
      description="Each modal can open another above it; Escape closes the top one and focus returns to the one beneath."
    >
      <Button size="sm" data-lab-open="stack" onPress={() => openCity('Lisbon')}>
        Plan a trip
      </Button>{' '}
      <Button
        size="sm"
        data-lab-open="queue"
        onPress={() => {
          openCity('Lisbon');
          openCity('Oslo');
        }}
      >
        Open two at once
      </Button>
    </LabSection>
    <LabSection
      title="Switching controllers"
      description="Each workspace has its own controller and both number their first modal the same. Edit the North note: two seconds later the host shows the South workspace, whose note opens fresh with its own default."
    >
      <Workspaces />
    </LabSection>
    <ModalHost controller={controller} />
  </>,
);
