import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SignatureDialog } from '../../src/components/signature-dialog/signature-dialog.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
const meanings = [
  { id: 'approve', label: 'Approved', description: 'The batch is ready to serve.' },
  { id: 'review', label: 'Reviewed', description: 'The batch was tasted and checked.' },
];

/** The long summary a full-size dialog carries: every step of the recipe being signed. */
function LongSummary() {
  return (
    <ol data-lab-long-summary="">
      {Array.from({ length: 24 }, (_, index) => (
        <li key={index}>
          Step {index + 1}: weigh, mix and rest the dough, then check its temperature against the
          recipe card before moving on.
        </li>
      ))}
    </ol>
  );
}

/** A dialog at one size, with its own confirm label. */
function SizedDialog({ size, content }: { size: (typeof sizes)[number]; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onPress={() => setOpen(true)}>
        {`Sign, ${size}, ${content}`}
      </Button>
      <SignatureDialog
        isOpen={open}
        onOpenChange={setOpen}
        size={size}
        title={`Sign the bake sheet, ${size}`}
        userName="Ada Lovelace"
        meanings={meanings}
        confirmLabel="Sign and serve"
        onSign={() => undefined}
        data-lab-sized={`${size} ${content}`}
      >
        {content === 'long' ? <LongSummary /> : <p>Twelve loaves, one batch.</p>}
      </SignatureDialog>
    </>
  );
}

/** A dialog the reader mounts already open; it closes on its own, and mounting again reopens it. */
function OpenOnMount() {
  const [mount, setMount] = useState(0);
  const [state, setState] = useState('not mounted');
  return (
    <div data-lab-demo="open-on-mount">
      <Button
        size="sm"
        onPress={() => {
          setMount((count) => count + 1);
          setState('open');
        }}
      >
        Mount the dialog open
      </Button>
      {mount > 0 ? (
        <SignatureDialog
          key={mount}
          defaultOpen
          onOpenChange={(isOpen) => setState(isOpen ? 'open' : 'closed')}
          title="Sign the opening checklist"
          userName="Ada Lovelace"
          meanings={meanings.slice(0, 1)}
          confirmLabel="Sign the checklist"
          onSign={() => undefined}
        />
      ) : null}
      <LabOutput name="dialog">{state}</LabOutput>
      <LabOutput name="mounts">{String(mount)}</LabOutput>
    </div>
  );
}

export function SignatureDialogSizeCases() {
  return (
    <div data-lab-family="signature-dialog-size-cases">
      <LabSection
        title="Sizes and confirm label"
        description="Each supported size with a short summary and with a long one, which scrolls inside the dialog; full takes the viewport. Every dialog confirms with its own label, Sign and serve."
      >
        <StateMatrix
          axes={{ size: sizes, content: ['short', 'long'] as const }}
          render={({ size, content }) => <SizedDialog size={size} content={content} />}
        />
      </LabSection>
      <LabSection
        title="Open on mount"
        description="defaultOpen opens an uncontrolled dialog as it mounts, so nothing covers the page until asked. Cancel closes it; mounting it again opens it afresh."
      >
        <OpenOnMount />
      </LabSection>
    </div>
  );
}
