import { ModalConfirmationCases } from './modal-confirmation-cases.js';
import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Modal, ModalTrigger, type ModalProps } from '../../src/components/modal/modal.js';
import { Portal, PortalHost } from '../../src/components/portal/portal.js';
import { Section, SectionHeader } from '../../src/components/section-header/section-header.js';
import { Shortcut } from '../../src/components/shortcut/shortcut.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { ModalFocusCases } from './modal-focus-cases.js';
import { ModalTallCases, ModalTallFormCase } from './modal-tall-cases.js';
import { RetainedLetter } from './modal-retained-cases.js';

/** A save the lab holds until the reader finishes or fails it. */
interface PendingRequest {
  finish: () => void;
  fail: (reason: Error) => void;
}

const tones = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
const footerTones = ['neutral', 'danger'] as const;
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
    <ModalTrigger>
      <Button size="sm">{label}</Button>
      <Modal {...props} />
    </ModalTrigger>
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
            Enter in City or <Shortcut chord="Ctrl+Enter" /> saves.{' '}
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
        {({ runPrimaryAction }) => (
          <label>
            City{' '}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) runPrimaryAction();
              }}
            />
          </label>
        )}
      </Modal>
    </div>
  );
}

/** Focus targets, a guard against losing a draft, and a count of finished exits. */
function GuardedNote() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [exits, setExits] = useState(0);
  const [refused, setRefused] = useState('nothing');
  const cityRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLButtonElement>(null);
  const keepDraft = (dismissal: string) => {
    if (draft.trim() === '') return true;
    setRefused(dismissal);
    return false;
  };
  return (
    <div>
      <Button size="sm" data-lab-open="guarded" onPress={() => setOpen(true)}>
        Write a postcard
      </Button>{' '}
      <Button size="sm" ref={afterRef} data-lab-after="">
        After the postcard
      </Button>
      <p>
        Exits: <output data-lab-output="exits">{exits}</output>, last refused:{' '}
        <output data-lab-output="refused">{refused}</output>
      </p>
      <Modal
        isOpen={open}
        onOpenChange={setOpen}
        title="Postcard"
        description="Escape and outside presses keep the dialog open while the message has text."
        data-lab-modal="guarded"
        isDismissable
        initialFocus={cityRef}
        finalFocus={afterRef}
        shouldCloseOnEscape={() => keepDraft('Escape')}
        shouldCloseOnInteractOutside={() => keepDraft('outside press')}
        onExitComplete={() => setExits((count) => count + 1)}
        primaryAction={{
          label: 'Send',
          onPress: (close) => {
            setDraft('');
            close();
          },
        }}
      >
        <label>
          Name <input />
        </label>{' '}
        <label>
          City <input ref={cityRef} />
        </label>
        <label style={{ display: 'block', marginTop: 8 }}>
          Message <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
      </Modal>
    </div>
  );
}

/** A floating dialog beside a page that stays usable. */
function FloatingNotes() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button size="sm" data-lab-open="floating" onPress={() => setOpen(!open)}>
        {open ? 'Hide notes' : 'Show notes'}
      </Button>{' '}
      <label>
        Page field <input data-lab-page-field="" />
      </label>
      <Modal
        isNonModal
        isOpen={open}
        onOpenChange={setOpen}
        title="Notes"
        size="sm"
        showCloseButton
        data-lab-modal="floating"
        cancelAction={null}
      >
        <DraftField label="Note" />
      </Modal>
    </div>
  );
}

/** A field whose Escape clears its draft first, handling the key, and lets the next one pass. */
function DraftField({ label }: { label: string }) {
  return (
    <label>
      {label}{' '}
      <input
        data-lab-draft=""
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || event.currentTarget.value === '') return;
          event.currentTarget.value = '';
          event.preventDefault();
        }}
      />
    </label>
  );
}

/** A draft field in each presentation: Escape clears the draft first, then closes the dialog. */
function HandledEscape() {
  return (
    <p>
      <Opener label="Blocking" title="Comment" data-lab-modal="handled">
        <DraftField label="Comment" />
      </Opener>{' '}
      <ModalTrigger>
        <Button size="sm">Anchored</Button>
        <Modal placement="bottom start" title="Comment" data-lab-modal="handled-anchored">
          <DraftField label="Comment" />
        </Modal>
      </ModalTrigger>
    </p>
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
    <div data-lab-family="modal-main">
      <LabSection
        title="Notes over a dialog"
        description="Open Trip details, then Notes: the floating notes dialog opened from the blocking one takes focus, stays usable and readable by assistive technology, and Escape closes only it."
      >
        <ModalTrigger>
          <Button>Trip details</Button>
          <Modal title="Trip details" data-lab-modal="trip-details">
            <ModalTrigger>
              <Button>Notes</Button>
              <Modal title="Notes" isNonModal cancelAction={null} data-lab-modal="notes">
                <label>
                  Note <input />
                </label>
              </Modal>
            </ModalTrigger>
          </Modal>
        </ModalTrigger>
      </LabSection>
      <LabSection
        title="Sections in a dialog"
        description="The trigger sits in a level-3 section, yet the dialog's title is a level-2 heading and the sections in its body start at level 3, as in any dialog."
      >
        <Section title="Trip planning" headingLevel={3}>
          <ModalTrigger>
            <Button>Trip outline</Button>
            <Modal title="Trip outline" data-lab-modal="sections">
              <SectionHeader title="Stops" />
              <p>Lisbon, then Porto.</p>
              <SectionHeader title="Bookings" />
              <p>Two nights in each city.</p>
            </Modal>
          </ModalTrigger>
        </Section>
      </LabSection>
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
          axes={{ state: states, tone: footerTones }}
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
        description="Save, Enter in City or Control+Enter runs the same action, which stays pending until Finish request or Fail request in the footer, refusing repeat presses and keys meanwhile; a finished save closes and a failure stays open with the error."
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
        title="Tall content"
        description="A body taller than the viewport scrolls inside the panel, which stays on screen with its heading, close button and actions reachable."
      >
        <ModalTallCases />
      </LabSection>
      <LabSection
        title="Tall form"
        description="An extra-large form that focuses the dialog at opening: change Travellers and Tab to its restore button, or open the sections, and the frame with its title, close button and actions stays in place while the body scrolls."
      >
        <ModalTallFormCase />
      </LabSection>
      <LabSection
        title="Retained body"
        description="The letter keeps its body mounted while closed: close and reopen it and the draft is still there, while the closed dialog is hidden, inert and blocks nothing."
      >
        <RetainedLetter />
      </LabSection>
      <LabSection
        title="Stacking"
        description="A modal opened from a modal stacks above it; a toast-layer notice stays above both."
      >
        <Stacking />
      </LabSection>
      <LabSection
        title="Focus targets and guarded dismissal"
        description="Focus starts in City and moves to the button after the postcard on close. While the message has text, Escape and outside presses are refused; each finished exit is counted."
      >
        <GuardedNote />
      </LabSection>
      <LabSection
        title="Non-modal dialog"
        description="Notes float at the corner without a backdrop; the page field stays usable while they are open, and Escape inside them closes them."
      >
        <FloatingNotes />
      </LabSection>
      <LabSection
        title="Escape handled inside"
        description="Type in Comment, then press Escape: the field clears its draft and the dialog stays open; the next Escape closes it. The floating notes behave the same."
      >
        <HandledEscape />
      </LabSection>
      <LabSection
        title="Unavailable focus targets"
        description="Initial focus skips hidden and fieldset-disabled fields, and falls back when an explicit target cannot receive focus."
      >
        <ModalFocusCases />
      </LabSection>
      <LabSection
        title="Anchored dialog"
        description="The dialog opens as a popover below its button, on the dropdown layer."
      >
        <ModalTrigger>
          <Button size="sm" data-lab-open="anchored">
            Rename Report.pdf
          </Button>
          <Modal
            placement="bottom start"
            title="Rename"
            data-lab-modal="anchored"
            primaryAction={{ label: 'Rename', onPress: (close) => close() }}
          >
            <label>
              Name <input defaultValue="Report.pdf" />
            </label>
          </Modal>
        </ModalTrigger>
      </LabSection>
    </div>
    <ModalConfirmationCases />
    <LabSection
      title="Right to left"
      description="In a right-to-left page the dialog's header puts the title on the right and the close button on the left, and the footer's actions run from the left."
    >
      <div dir="rtl" data-lab-demo="rtl">
        <PortalHost>
          <Opener
            title="Choose a city"
            showCloseButton
            primaryAction={{ label: 'Apply' }}
            secondaryAction={{ label: 'Discard', onPress: (close) => close() }}
          >
            Lisbon, Oslo or Kyoto.
          </Opener>
        </PortalHost>
      </div>
    </LabSection>
  </>,
);
