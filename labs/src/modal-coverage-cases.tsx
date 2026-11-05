// Modal cases for opening on mount, refusing Escape alone, and the confirmation helpers' third
// action, custom Cancel text and a confirm that fails before it succeeds.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { confirm, Modal, ModalTrigger, prompt } from '../../src/components/modal/modal.js';
import {
  createModalController,
  ModalHost,
} from '../../src/components/modal-controller/modal-controller.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const controller = createModalController();

/** A dialog and a trigger mounted on demand that open at once. */
function OpenOnMount() {
  const [mounted, setMounted] = useState<'none' | 'modal' | 'trigger'>('none');
  const [events, setEvents] = useState<string[]>([]);
  const log = (source: string) => (isOpen: boolean) => {
    setEvents((list) => [...list, `${source} ${isOpen ? 'opened' : 'closed'}`]);
    if (!isOpen) setMounted('none');
  };
  return (
    <div data-lab-demo="modal-default-open">
      <Button size="sm" variant="secondary" onPress={() => setMounted('modal')}>
        Mount the welcome dialog
      </Button>{' '}
      <Button size="sm" variant="secondary" onPress={() => setMounted('trigger')}>
        Mount the tips trigger
      </Button>
      {mounted === 'modal' ? (
        <Modal defaultOpen onOpenChange={log('dialog')} title="Welcome" showCloseButton>
          Opened by defaultOpen when it mounted.
        </Modal>
      ) : null}
      {mounted === 'trigger' ? (
        <ModalTrigger defaultOpen onOpenChange={log('trigger')}>
          <Button size="sm">Tips</Button>
          <Modal title="Tips" showCloseButton>
            Opened by the trigger's defaultOpen when it mounted.
          </Modal>
        </ModalTrigger>
      ) : null}
      <LabOutput name="Mount events">{events.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

/** Escape refused on its own while Cancel and outside presses still close the dialog. */
function EscapeRefused() {
  const [isKeyboardDismissDisabled, setDisabled] = useState(true);
  const [closes, setCloses] = useState<string[]>([]);
  return (
    <div data-lab-demo="keyboard-dismiss">
      <Switch isSelected={isKeyboardDismissDisabled} onChange={setDisabled}>
        Refuse Escape
      </Switch>
      <ModalTrigger
        onOpenChange={(isOpen) =>
          isOpen || setCloses((list) => [...list, `closed ${String(list.length + 1)}`])
        }
      >
        <Button size="sm">Edit the label</Button>
        <Modal
          title="Label"
          isDismissable
          isKeyboardDismissDisabled={isKeyboardDismissDisabled}
          primaryAction={{ label: 'Save', onPress: (close) => close() }}
          data-lab-modal="keyboard-dismiss"
        >
          Press Escape, Cancel or outside the dialog.
        </Modal>
      </ModalTrigger>
      <LabOutput name="Keyboard dismiss closes">{closes.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

/** confirm with a third action, prompt with custom Cancel text, and a confirm that fails once. */
function HelperChoices() {
  const [log, setLog] = useState<string[]>([]);
  const add = (entry: string) => setLog((list) => [...list, entry]);
  return (
    <div data-lab-demo="helper-choices">
      <Button
        size="sm"
        onPress={async () => {
          const saved = await confirm(controller, {
            title: 'Save the changes to the plum list?',
            message: 'Leaving without saving drops them.',
            confirmLabel: 'Save',
            cancelLabel: 'Keep editing',
            secondaryActionLabel: "Don't save",
            onSecondaryAction: () => add('dropped the changes'),
            onConfirm: () => add('saved'),
          });
          add(`confirm resolved ${String(saved)}`);
        }}
      >
        Leave the plum list
      </Button>{' '}
      <Button
        size="sm"
        onPress={async () => {
          const name = await prompt(controller, {
            title: 'Rename the crate',
            label: 'Name',
            defaultValue: 'Crate 12',
            confirmLabel: 'Rename',
            cancelLabel: 'Keep the name',
          });
          add(name === null ? 'prompt kept the name' : `prompt renamed to ${name}`);
        }}
      >
        Rename the crate
      </Button>{' '}
      <Button
        size="sm"
        onPress={async () => {
          let attempt = 0;
          const shipped = await confirm(controller, {
            title: 'Ship crate 12?',
            confirmLabel: 'Ship',
            pendingLabel: 'Shipping',
            onConfirm: async () => {
              attempt += 1;
              add(`ship attempt ${String(attempt)}`);
              await new Promise((resolve) => setTimeout(resolve, 400));
              if (attempt === 1) throw new Error('The van is full. Try again.');
            },
          });
          add(`ship resolved ${String(shipped)}`);
        }}
      >
        Ship crate 12
      </Button>
      <LabOutput name="Helper log">{log.join('; ') || 'none'}</LabOutput>
    </div>
  );
}

export function ModalCoverageSections() {
  return (
    <>
      <LabSection
        title="Open on mount"
        description="defaultOpen opens an uncontrolled Modal as soon as it mounts, and a ModalTrigger's defaultOpen opens its dialog when the trigger mounts. onOpenChange is listed; closing unmounts them again."
      >
        <OpenOnMount />
      </LabSection>
      <LabSection
        title="Escape refused on its own"
        description="isKeyboardDismissDisabled refuses Escape alone: Cancel and, with isDismissable, a press outside still close the dialog. Each close is listed; switch it off to let Escape close it too."
      >
        <EscapeRefused />
      </LabSection>
      <LabSection
        title="Confirmation helpers: choices and failures"
        description="confirm with secondaryActionLabel and onSecondaryAction offers Keep editing (cancelLabel), Don't save and Save; prompt takes its own cancelLabel. Ship crate 12 fails its first onConfirm: the dialog stays open, pending while it runs, and shows the error until Ship is pressed again."
      >
        <HelperChoices />
        <ModalHost controller={controller} />
      </LabSection>
    </>
  );
}
