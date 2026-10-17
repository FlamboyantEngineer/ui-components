import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ConfirmDialog, confirm } from '../../src/components/confirm-dialog/confirm-dialog.js';
import {
  ModalHost,
  createModalController,
} from '../../src/components/modal-controller/modal-controller.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const controller = createModalController();
const tones = ['neutral', 'danger'] as const;
const sizes = ['sm', 'md', 'lg'] as const;
const focus = ['cancel', 'confirm'] as const;

function Declarative({
  tone,
  size,
  autoFocusConfirm,
}: {
  tone: (typeof tones)[number];
  size: (typeof sizes)[number];
  autoFocusConfirm: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('none');
  return (
    <>
      <Button size="sm" onPress={() => setOpen(true)}>
        {tone === 'danger' ? 'Delete' : 'Archive'}
      </Button>{' '}
      <output data-lab-output="answer">{answer}</output>
      <ConfirmDialog
        isOpen={open}
        onOpenChange={setOpen}
        tone={tone}
        size={size}
        autoFocusConfirm={autoFocusConfirm}
        title={tone === 'danger' ? 'Delete Report.pdf?' : 'Archive Report.pdf?'}
        message={
          tone === 'danger'
            ? 'The file is removed for everyone. This cannot be undone.'
            : 'The file moves to the archive.'
        }
        confirmLabel={tone === 'danger' ? 'Delete' : 'Archive'}
        data-lab-modal={`${tone}-${size}`}
        onConfirm={() => setAnswer('confirmed')}
        onCancel={() => setAnswer('cancelled')}
      />
    </>
  );
}

function Awaited() {
  const [answer, setAnswer] = useState('none');
  const [isHeld, setIsHeld] = useState(false);
  const finish = useRef<(() => void) | null>(null);
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={isHeld}
          onChange={(event) => setIsHeld(event.target.checked)}
        />{' '}
        Hold the delete until I finish it
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
            tone: 'danger',
            'data-lab-modal': 'await',
            children: isHeld ? (
              <Button size="sm" data-lab-action="finish" onPress={() => finish.current?.()}>
                Finish delete
              </Button>
            ) : undefined,
            onConfirm: isHeld
              ? () =>
                  new Promise<void>((resolve) => {
                    finish.current = resolve;
                  })
              : undefined,
          });
          finish.current = null;
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
      title="Tones, sizes and focus"
      description="Each cell opens a confirm dialog. Focus starts on Cancel, or on the confirm action in the confirm column."
    >
      <StateMatrix
        axes={{ tone: tones, size: sizes, focus }}
        render={({ tone, size, focus: target }) => (
          <Declarative tone={tone} size={size} autoFocusConfirm={target === 'confirm'} />
        )}
      />
    </LabSection>
    <LabSection
      title="Awaited through a controller"
      description="confirm(controller, options) resolves true on Delete and false on Cancel or Escape; a held delete stays pending until Finish delete."
    >
      <Awaited />
    </LabSection>
    <ModalHost controller={controller} />
  </>,
);
