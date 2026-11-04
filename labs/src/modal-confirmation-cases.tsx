import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Icon } from '../../src/components/icon/icon.js';
import { alert, confirm, Modal, ModalTrigger, prompt } from '../../src/components/modal/modal.js';
import {
  createModalController,
  ModalHost,
} from '../../src/components/modal-controller/modal-controller.js';
import { ErrorGlyph, InfoGlyph, SuccessGlyph, WarningGlyph } from '../../src/core/glyphs.js';
import type { Tone } from '../../src/core/props.js';
import { LabSection, StateMatrix } from './chrome/index.js';

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
      <Modal
        isOpen={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setAnswer((previous) => (previous === 'none' ? 'cancelled' : previous));
        }}
        role="alertdialog"
        tone={tone}
        size={size}
        title={tone === 'danger' ? 'Delete Report.pdf?' : 'Archive Report.pdf?'}
        description={
          tone === 'danger'
            ? 'The file is removed for everyone. This cannot be undone.'
            : 'The file moves to the archive.'
        }
        cancelAction={{ autoFocus: !autoFocusConfirm }}
        primaryAction={{
          label: tone === 'danger' ? 'Delete' : 'Archive',
          autoFocus: autoFocusConfirm,
          onPress: (close) => {
            setAnswer('confirmed');
            close();
          },
        }}
        data-lab-modal={`${tone}-${size}`}
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

const newsTones = ['info', 'success', 'warning', 'danger'] as const;
const icons = ['default', 'error', 'none'] as const;

/** A dialog with a news tone and its default, error or no icon. */
function News({ tone, icon }: { tone: Tone; icon: (typeof icons)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onPress={() => setOpen(true)}>
        Open
      </Button>
      <Modal
        isOpen={open}
        onOpenChange={setOpen}
        role="alertdialog"
        tone={tone}
        title={
          <>
            {icon !== 'none' && (icon === 'error' || tone !== 'danger') ? (
              <Icon
                icon={
                  icon === 'error'
                    ? ErrorGlyph
                    : tone === 'success'
                      ? SuccessGlyph
                      : tone === 'warning'
                        ? WarningGlyph
                        : InfoGlyph
                }
                className="ui-modal__confirmation-icon"
              />
            ) : null}{' '}
            A {tone} dialog
          </>
        }
        description="Report.pdf was exported."
        cancelAction={null}
        primaryAction={{ label: 'OK', autoFocus: true, onPress: (close) => close() }}
        data-lab-modal={`news-${tone}-${icon}`}
      />
    </>
  );
}

function ThirdAction() {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('none');
  return (
    <>
      <Button size="sm" data-lab-open="third" onPress={() => setOpen(true)}>
        Close Report.pdf
      </Button>{' '}
      <output data-lab-output="third">{answer}</output>
      <Modal
        isOpen={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setAnswer((previous) => (previous === 'none' ? 'cancelled' : previous));
        }}
        role="alertdialog"
        title="Save changes to Report.pdf?"
        description="Your edits are lost if you don't save them."
        cancelAction={{ autoFocus: true }}
        primaryAction={{
          label: 'Save',
          onPress: (close) => {
            setAnswer('saved');
            close();
          },
        }}
        secondaryAction={{
          label: "Don't save",
          onPress: (close) => {
            setAnswer('discarded');
            close();
          },
        }}
        data-lab-modal="third"
      />
    </>
  );
}

function Anchored() {
  const [answer, setAnswer] = useState('none');
  return (
    <>
      <ModalTrigger>
        <Button size="sm" data-lab-open="anchored">
          Remove Lima
        </Button>
        <Modal
          placement="bottom start"
          role="alertdialog"
          title="Remove Lima?"
          description="It leaves the itinerary."
          tone="danger"
          cancelAction={{ autoFocus: true }}
          primaryAction={{
            label: 'Remove',
            onPress: (close) => {
              setAnswer('removed');
              close();
            },
          }}
          onOpenChange={(next) => {
            if (!next) setAnswer((previous) => (previous === 'none' ? 'kept' : previous));
          }}
          data-lab-modal="anchored"
        />
      </ModalTrigger>{' '}
      <output data-lab-output="anchored">{answer}</output>
    </>
  );
}

function Helpers() {
  const [result, setResult] = useState('none');
  return (
    <div>
      <Button
        size="sm"
        data-lab-open="alert"
        onPress={async () => {
          await alert(controller, {
            title: 'Export finished',
            message: 'Report.pdf is ready to download.',
            'data-lab-modal': 'alert',
          });
          setResult('acknowledged');
        }}
      >
        Show an alert
      </Button>{' '}
      <Button
        size="sm"
        data-lab-open="prompt"
        onPress={async () => {
          const name = await prompt(controller, {
            title: 'Add a city',
            message: 'It joins the itinerary.',
            label: 'City',
            defaultValue: 'Lima',
            confirmLabel: 'Add',
          });
          setResult(name === null ? 'cancelled' : `added ${name}`);
        }}
      >
        Ask for a city
      </Button>
      <p>
        Result: <output data-lab-output="helpers">{result}</output>
      </p>
    </div>
  );
}

export function ModalConfirmationCases() {
  return (
    <div data-lab-family="modal-confirmation-cases">
      <>
        <LabSection
          title="Confirmation: Tones, sizes and focus"
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
          title="Confirmation: Awaited through a controller"
          description="confirm(controller, options) resolves true on Delete and false on Cancel or Escape; a held delete stays pending until Finish delete."
        >
          <Awaited />
        </LabSection>
        <LabSection
          title="Confirmation: News tones and icons"
          description="Information, success, warning and danger acknowledgements with their default glyph, an error glyph, or none."
        >
          <StateMatrix
            axes={{ tone: newsTones, icon: icons }}
            render={({ tone, icon }) => <News tone={tone} icon={icon} />}
          />
        </LabSection>
        <LabSection
          title="Confirmation: Third action"
          description="Cancel, Don't save and Save; Don't save closes without cancelling."
        >
          <ThirdAction />
        </LabSection>
        <LabSection
          title="Confirmation: Anchored confirmation"
          description="A small confirmation opens as a popover below its button instead of over the page."
        >
          <Anchored />
        </LabSection>
        <LabSection
          title="Confirmation: Alert and prompt"
          description="alert(controller, options) resolves once acknowledged; prompt(controller, options) resolves to the typed text, or null when cancelled. Enter in the field answers the prompt."
        >
          <Helpers />
        </LabSection>
        <ModalHost controller={controller} />
      </>
    </div>
  );
}
