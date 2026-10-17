import { useState } from 'react';
import { DialogTrigger } from 'react-aria-components';
import { Button } from '../../src/components/button/button.js';
import { Modal, type ModalProps } from '../../src/components/modal/modal.js';
import { Portal } from '../../src/components/portal/portal.js';
import { Shortcut } from '../../src/components/shortcut/shortcut.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

/** A save the lab holds until the reader finishes or fails it. */
interface PendingRequest {
  finish: () => void;
  fail: (reason: Error) => void;
}

const tones = ['neutral', 'danger'] as const;
const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
const states = [
  'idle',
  'primary disabled',
  'pending',
  'status',
  'error',
  'secondary action',
  'action variant',
  'custom actions',
  'dismiss disabled',
] as const;

/** A trigger button and an uncontrolled modal it opens. */
function Opener({ label = 'Open', ...props }: Omit<ModalProps, 'isOpen'> & { label?: string }) {
  return (
    <DialogTrigger>
      <Button size="sm">{label}</Button>
      <Modal {...props} />
    </DialogTrigger>
  );
}

function stateProps(state: (typeof states)[number]): Partial<ModalProps> {
  switch (state) {
    case 'primary disabled':
      return { primaryAction: { label: 'Apply', isDisabled: true } };
    case 'pending':
      return { primaryAction: { label: 'Apply', isPending: true, pendingLabel: 'Applying' } };
    case 'status':
      return { status: 'Choose a city.', primaryAction: { label: 'Apply' } };
    case 'error':
      return {
        status: 'Choose a city.',
        error: 'Lisbon is not available.',
        primaryAction: { label: 'Apply' },
      };
    case 'secondary action':
      return {
        secondaryAction: { label: 'Discard', onPress: (close) => close() },
        primaryAction: { label: 'Save', onPress: (close) => close() },
      };
    case 'action variant':
      return {
        secondaryAction: { label: 'Remove', variant: 'danger', onPress: (close) => close() },
        primaryAction: { label: 'Keep', onPress: (close) => close() },
      };
    case 'custom actions':
      return {
        cancelAction: null,
        actions: (
          <Button slot="close" size="md">
            Done
          </Button>
        ),
      };
    case 'dismiss disabled':
      return {
        isDismissDisabled: true,
        isDismissable: true,
        showCloseButton: true,
        primaryAction: { label: 'Finish', onPress: (close) => close() },
      };
    default:
      return { primaryAction: { label: 'Apply', onPress: (close) => close() } };
  }
}

function SaveForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [request, setRequest] = useState<PendingRequest | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  return (
    <div>
      <Button size="sm" data-lab-open="save" onPress={() => setOpen(true)}>
        Add a city
      </Button>
      <p>
        Saved: <output data-lab-output="saved">{saved.join(', ') || 'none'}</output>
      </p>
      <Modal
        isOpen={open}
        onOpenChange={(next) => {
          setOpen(next);
          setRequest(null);
        }}
        title="Add a city"
        description="The city joins your travel list."
        data-lab-modal="save"
        footerContent={
          <>
            <Shortcut chord="Ctrl+Enter" /> saves.{' '}
            <Button
              size="sm"
              data-lab-action="finish"
              isDisabled={!request}
              onPress={() => request?.finish()}
            >
              Finish request
            </Button>{' '}
            <Button
              size="sm"
              data-lab-action="fail"
              isDisabled={!request}
              onPress={() => request?.fail(new Error('The list is full.'))}
            >
              Fail request
            </Button>
          </>
        }
        primaryAction={{
          label: 'Save',
          pendingLabel: 'Saving',
          isDisabled: name.trim() === '',
          onPress: async (close) => {
            try {
              await new Promise<void>((finish, fail) => setRequest({ finish, fail }));
            } finally {
              setRequest(null);
            }
            setSaved((list) => [...list, name.trim()]);
            setName('');
            close();
          },
        }}
      >
        <label>
          City <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
      </Modal>
    </div>
  );
}

function Stacking() {
  const [outer, setOuter] = useState(false);
  const [inner, setInner] = useState(false);
  const [notice, setNotice] = useState(false);
  return (
    <>
      <Button size="sm" data-lab-open="stack" onPress={() => setOuter(true)}>
        Open the trip
      </Button>
      <Modal
        isOpen={outer}
        onOpenChange={setOuter}
        title="Trip to Oslo"
        data-lab-modal="outer"
        cancelAction={{ label: 'Close' }}
      >
        <p>Four days in October.</p>
        <Button size="sm" onPress={() => setInner(true)}>
          Edit dates
        </Button>{' '}
        <Button size="sm" onPress={() => setNotice(true)}>
          Show notice
        </Button>
        {notice ? (
          <Portal layer="toast" data-lab-notice="">
            <div role="status" style={{ position: 'fixed', right: 16, bottom: 16 }}>
              Trip saved{' '}
              <button type="button" onClick={() => setNotice(false)}>
                Dismiss
              </button>
            </div>
          </Portal>
        ) : null}
        <Modal
          isOpen={inner}
          onOpenChange={setInner}
          title="Edit dates"
          size="sm"
          isDismissable
          data-lab-modal="inner"
          primaryAction={{ label: 'Apply', onPress: (close) => close() }}
        >
          <label>
            Start <input defaultValue="2026-10-12" />
          </label>
        </Modal>
      </Modal>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Tones and sizes"
      description="Each cell opens a modal with that tone and size. Escape or Cancel closes it and focus returns to the button."
    >
      <StateMatrix
        axes={{ tone: tones, size: sizes }}
        render={({ tone, size }) => (
          <Opener
            tone={tone}
            size={size}
            title={`${tone === 'danger' ? 'Delete' : 'Rename'} Report.pdf`}
            description={`A ${tone} modal of size ${size}.`}
            data-lab-modal={`${tone}-${size}`}
            primaryAction={{
              label: tone === 'danger' ? 'Delete' : 'Apply',
              onPress: (close) => close(),
            }}
          >
            <p>Report.pdf, 2 pages, edited yesterday.</p>
          </Opener>
        )}
      />
    </LabSection>
    <LabSection
      title="Footer states"
      description="Primary disabled, pending, status and error messages, a secondary action, an action with its own variant, a custom action bar and refused dismissal."
    >
      <StateMatrix
        axes={{ state: states, tone: tones }}
        render={({ state, tone }) => (
          <Opener
            tone={tone}
            title="Choose a city"
            data-lab-modal={`${state}-${tone}`}
            {...stateProps(state)}
          >
            <p>Lisbon, Oslo or Kyoto.</p>
          </Opener>
        )}
      />
    </LabSection>
    <LabSection
      title="Asynchronous primary action"
      description="Save stays pending until Finish request or Fail request in the footer, refusing repeat presses meanwhile; a finished save closes and a failure stays open with the error."
    >
      <SaveForm />
    </LabSection>
    <LabSection
      title="Header, body and dismissal"
      description="A description, header content, a close button, a column body whose text area keeps Control+Enter, and a press outside that closes."
    >
      <Opener
        label="Write a note"
        title="Note"
        description="Notes stay on this device."
        headerActions={<span>Step 1 of 2</span>}
        showCloseButton
        isDismissable
        bodyLayout="column"
        size="lg"
        data-lab-modal="note"
        primaryAction={{ label: 'Post', onPress: (close) => close() }}
      >
        <label>
          Title <input />
        </label>
        <label>
          Text <textarea rows={6} />
        </label>
      </Opener>
    </LabSection>
    <LabSection
      title="Stacking"
      description="A modal opened from a modal stacks above it; a toast-layer notice stays above both."
    >
      <Stacking />
    </LabSection>
  </>,
);
