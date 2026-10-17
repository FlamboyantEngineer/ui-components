import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ConfirmDialog, confirm } from '../../src/components/confirm-dialog/confirm-dialog.js';
import {
  ModalHost,
  createModalController,
} from '../../src/components/modal-controller/modal-controller.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const controller = createModalController();
const variants = ['default', 'danger'] as const;
const sizes = ['sm', 'md', 'lg'] as const;
const focus = ['cancel', 'confirm'] as const;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Declarative({
  variant,
  size,
  autoFocusConfirm,
}: {
  variant: (typeof variants)[number];
  size: (typeof sizes)[number];
  autoFocusConfirm: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('none');
  return (
    <>
      <Button size="sm" onPress={() => setOpen(true)}>
        {variant === 'danger' ? 'Delete' : 'Archive'}
      </Button>{' '}
      <output data-lab-output="answer">{answer}</output>
      <ConfirmDialog
        isOpen={open}
        onOpenChange={setOpen}
        variant={variant}
        size={size}
        autoFocusConfirm={autoFocusConfirm}
        title={variant === 'danger' ? 'Delete Report.pdf?' : 'Archive Report.pdf?'}
        message={
          variant === 'danger'
            ? 'The file is removed for everyone. This cannot be undone.'
            : 'The file moves to the archive.'
        }
        confirmLabel={variant === 'danger' ? 'Delete' : 'Archive'}
        data-lab-modal={`${variant}-${size}`}
        onConfirm={() => setAnswer('confirmed')}
        onCancel={() => setAnswer('cancelled')}
      />
    </>
  );
}

function Awaited() {
  const [answer, setAnswer] = useState('none');
  const [slow, setSlow] = useState(false);
  return (
    <div>
      <label>
        <input type="checkbox" checked={slow} onChange={(event) => setSlow(event.target.checked)} />{' '}
        Take 600 ms to delete
      </label>{' '}
      <Button
        size="sm"
        data-lab-open="await"
        onPress={async () => {
          const confirmed = await confirm(controller, {
            title: 'Delete the Lisbon itinerary?',
            message: 'Its 4 stops are removed.',
            confirmLabel: 'Delete',
            pendingLabel: 'Deleting',
            variant: 'danger',
            'data-lab-modal': 'await',
            onConfirm: slow ? () => wait(600) : undefined,
          });
          setAnswer(confirmed ? 'true' : 'false');
        }}
      >
        Delete the itinerary
      </Button>
      <p>
        Resolved: <output data-lab-output="awaited">{answer}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants, sizes and focus"
      description="Each cell opens a confirm dialog. Focus starts on Cancel, or on the confirm action in the confirm column."
    >
      <StateMatrix
        axes={{ variant: variants, size: sizes, focus }}
        render={({ variant, size, focus: target }) => (
          <Declarative variant={variant} size={size} autoFocusConfirm={target === 'confirm'} />
        )}
      />
    </LabSection>
    <LabSection
      title="Awaited through a controller"
      description="confirm(controller, options) resolves true on Delete and false on Cancel or Escape."
    >
      <Awaited />
    </LabSection>
    <ModalHost controller={controller} />
  </>,
);
