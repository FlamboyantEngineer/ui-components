import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { Wizard, type WizardStep } from '../../src/components/wizard/wizard.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

interface Project {
  name: string;
  members: string;
}

const takenNames = ['apollo', 'atlas'];

/** Answers like a server would, after a short wait. */
function checkName(name: string): Promise<true | string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(takenNames.includes(name.trim().toLowerCase()) ? `“${name}” is taken.` : true);
    }, 600);
  });
}

function projectSteps(
  project: Project,
  setProject: (change: Partial<Project>) => void,
): WizardStep[] {
  return [
    {
      id: 'details',
      label: 'Details',
      description: 'Name the project',
      content: (
        <TextField
          label="Project name"
          name="name"
          isRequired
          description="Apollo and Atlas are taken."
          value={project.name}
          onChange={(name) => setProject({ name })}
        />
      ),
      validate: () => checkName(project.name),
    },
    {
      id: 'members',
      label: 'Members',
      description: 'Invite people',
      isOptional: true,
      content: (
        <TextField
          label="Email addresses"
          name="members"
          value={project.members}
          onChange={(members) => setProject({ members })}
        />
      ),
    },
    {
      id: 'review',
      label: 'Review',
      content: (
        <dl>
          <dt>Name</dt>
          <dd>{project.name || '—'}</dd>
          <dt>Members</dt>
          <dd>{project.members || 'Nobody yet'}</dd>
        </dl>
      ),
    },
  ];
}

function useProject() {
  const [project, setProjectState] = useState<Project>({ name: '', members: '' });
  const setProject = (change: Partial<Project>) =>
    setProjectState((previous) => ({ ...previous, ...change }));
  return [project, setProject] as const;
}

/** A new project, inline: an asynchronous name check, an optional step and a review. */
function NewProject() {
  const [project, setProject] = useProject();
  const [created, setCreated] = useState<string | null>(null);
  return (
    <div data-lab-demo="inline">
      <Wizard
        aria-label="New project"
        steps={projectSteps(project, setProject)}
        finishLabel="Create project"
        headingLevel={3}
        onFinish={() =>
          new Promise<void>((resolve) => setTimeout(resolve, 600)).then(() =>
            setCreated(project.name),
          )
        }
      />
      <p data-lab-result>{created ? `Created ${created}` : 'Nothing created yet'}</p>
    </div>
  );
}

/** The same task in a modal: the wizard's buttons are the dialog's footer. */
function NewProjectModal() {
  const [project, setProject] = useProject();
  const [created, setCreated] = useState<string | null>(null);
  return (
    <div data-lab-demo="modal">
      <ModalTrigger>
        <Button>New project</Button>
        <Modal title="New project" size="lg">
          {({ close }) => (
            <Wizard
              steps={projectSteps(project, setProject)}
              finishLabel="Create project"
              onCancel={close}
              onFinish={() => {
                setCreated(project.name);
                close();
              }}
            />
          )}
        </Modal>
      </ModalTrigger>
      <p data-lab-result>{created ? `Created ${created}` : 'Nothing created yet'}</p>
    </div>
  );
}

/**
 * A panel holding a one-step wizard whose check takes two seconds: closing the panel meanwhile
 * aborts the check, and its late answer sends nothing.
 */
function ClosingPanel() {
  const [isOpen, setOpen] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const note = (line: string) => setLog((lines) => [...lines, line]);
  const steps: WizardStep[] = [
    {
      id: 'send',
      label: 'Send the report',
      content: <p>The report goes to the team once the check passes.</p>,
      validate: (signal) =>
        new Promise<boolean>((resolve) => {
          signal.addEventListener('abort', () => note('Check aborted'));
          setTimeout(() => resolve(true), 2000);
        }),
    },
  ];
  return (
    <div data-lab-demo="closing">
      {isOpen ? (
        <>
          <Wizard
            aria-label="Send the report"
            steps={steps}
            finishLabel="Send"
            onFinish={() => note('Report sent')}
          />
          <Button onPress={() => setOpen(false)}>Close panel</Button>
        </>
      ) : (
        <Button onPress={() => setOpen(true)}>Open panel</Button>
      )}
      <p data-lab-log>{log.join(' · ') || 'Nothing yet'}</p>
    </div>
  );
}

const records = [
  { value: 'north', label: 'North office' },
  { value: 'south', label: 'South office' },
];

/**
 * One wizard per record, keyed by it: both records share the step ID `confirm`, and switching record
 * while a check runs aborts it instead of saving the other record.
 */
function RecordSwitcher() {
  const [record, setRecord] = useState('north');
  const [log, setLog] = useState<string[]>([]);
  const note = (line: string) => setLog((lines) => [...lines, line]);
  const label = records.find((item) => item.value === record)?.label ?? record;
  return (
    <div data-lab-demo="records">
      <SegmentedChoice
        aria-label="Record"
        options={records}
        value={record}
        onChange={(value) => {
          if (value) setRecord(value);
        }}
      />
      <Wizard
        key={record}
        aria-label={`Confirm ${label}`}
        steps={[
          {
            id: 'confirm',
            label: 'Confirm',
            content: <p>Save the changes to {label}.</p>,
            validate: (signal) =>
              new Promise<boolean>((resolve) => {
                signal.addEventListener('abort', () => note(`${label} check aborted`));
                setTimeout(() => resolve(true), 2000);
              }),
          },
        ]}
        finishLabel="Save"
        onFinish={() => note(`${label} saved`)}
      />
      <p data-lab-log>{log.join(' · ') || 'Nothing yet'}</p>
    </div>
  );
}

const staticSteps: WizardStep[] = [
  { id: 'one', label: 'Choose a file', content: <p>Pick the spreadsheet to read.</p> },
  { id: 'two', label: 'Map columns', isOptional: true, content: <p>Match each column.</p> },
  { id: 'three', label: 'Import', content: <p>Ready to import 24 rows.</p> },
];

mountLab(
  <>
    <LabSection
      title="Steps and orientation"
      description="The first, an optional middle and the last step, with the list of steps above or beside the panel. Buttons follow the step: Back after the first, Skip on an optional step, Finish on the last."
    >
      <StateMatrix
        axes={{ step: ['one', 'two', 'three'], orientation: ['horizontal', 'vertical'] }}
        render={({ step, orientation }) => (
          <Wizard
            aria-label={`Import at step ${step}, ${orientation}`}
            steps={staticSteps}
            defaultCurrentKey={step}
            orientation={orientation}
            onCancel={() => {}}
            headingLevel={3}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="New project"
      description="Next checks the required name, then asks a pretend server whether the name is free (Apollo and Atlas are taken). Members can be skipped; Finish creates the project."
    >
      <NewProject />
    </LabSection>
    <LabSection
      title="Leaving while it checks"
      description="Send waits two seconds for its check. Close the panel meanwhile: the check is aborted, and its late answer sends nothing. Leave it open and the report is sent."
    >
      <ClosingPanel />
    </LabSection>
    <LabSection
      title="Switching records"
      description="Both records use the same step, and the wizard is keyed by the record. Press Save, then switch record before the two-second check ends: the check is aborted and neither record is saved. Wait it out and the record shown is saved."
    >
      <RecordSwitcher />
    </LabSection>
    <LabSection
      title="In a modal"
      description="The same wizard as the body of a Modal: Cancel closes it and focus stays inside as the steps change."
    >
      <NewProjectModal />
    </LabSection>
    <LabSection
      title="Numeric and text step IDs"
      description="The numeric ID 1 and text ID '1' identify different steps. Each new panel starts its own uncontrolled draft."
    >
      <Wizard
        aria-label="Separate step drafts"
        steps={[
          {
            id: 1,
            label: 'First draft',
            content: <TextField label="Draft" defaultValue="First" />,
          },
          {
            id: '1',
            label: 'Second draft',
            content: <TextField label="Draft" defaultValue="Second" />,
          },
        ]}
      />
    </LabSection>
  </>,
);
