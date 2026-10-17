import { useState } from 'react';
import { DialogTrigger } from 'react-aria-components';
import { Button } from '../../src/components/button/button.js';
import { Modal, type ModalProps } from '../../src/components/modal/modal.js';
import { Portal } from '../../src/components/portal/portal.js';
import { Shortcut } from '../../src/components/shortcut/shortcut.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const variants = ['default', 'danger'] as const;
const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
const states = [
  'idle',
  'primary disabled',
  'pending',
  'status',
  'error',
  'secondary action',
  'custom actions',
  'dismiss disabled',
] as const;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
  const [fail, setFail] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  return (
    <div>
      <label>
        <input type="checkbox" checked={fail} onChange={(event) => setFail(event.target.checked)} />{' '}
        Make the save fail
      </label>{' '}
      <Button size="sm" data-lab-open="save" onPress={() => setOpen(true)}>
        Add a city
      </Button>
      <p>
        Saved: <output data-lab-output="saved">{saved.join(', ') || 'none'}</output>
      </p>
      <Modal
        isOpen={open}
        onOpenChange={setOpen}
        title="Add a city"
        description="The city joins your travel list."
        data-lab-modal="save"
        footerContent={
          <span>
            <Shortcut chord="Ctrl+Enter" /> saves
          </span>
        }
        primaryAction={{
          label: 'Save',
          pendingLabel: 'Saving',
          isDisabled: name.trim() === '',
          onPress: async (close) => {
            await wait(600);
            if (fail) throw new Error('The list is full.');
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
      title="Variants and sizes"
      description="Each cell opens a modal with that variant and size. Escape or Cancel closes it and focus returns to the button."
    >
      <StateMatrix
        axes={{ variant: variants, size: sizes }}
        render={({ variant, size }) => (
          <Opener
            variant={variant}
            size={size}
            title={`${variant === 'danger' ? 'Delete' : 'Rename'} Report.pdf`}
            description={`A ${variant} modal of size ${size}.`}
            data-lab-modal={`${variant}-${size}`}
            primaryAction={{
              label: variant === 'danger' ? 'Delete' : 'Apply',
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
      description="Primary disabled, pending, status and error messages, a secondary action, a custom action bar and refused dismissal."
    >
      <StateMatrix
        axes={{ state: states, variant: variants }}
        render={({ state, variant }) => (
          <Opener
            variant={variant}
            title="Choose a city"
            data-lab-modal={`${state}-${variant}`}
            {...stateProps(state)}
          >
            <p>Lisbon, Oslo or Kyoto.</p>
          </Opener>
        )}
      />
    </LabSection>
    <LabSection
      title="Asynchronous primary action"
      description="Save waits 600 ms, refuses repeat presses meanwhile and closes when done; a failure stays open with the error in the footer."
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
