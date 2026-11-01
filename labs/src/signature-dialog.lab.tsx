import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  SignatureDialog,
  type SignatureDetails,
  type SignatureDialogCredentials,
  type SignatureDialogEntry,
} from '../../src/components/signature-dialog/signature-dialog.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const meaningSets = {
  one: [{ id: 'approve', label: 'Approved' }],
  several: [
    { id: 'approve', label: 'Approved', description: 'The change is ready to release.' },
    { id: 'review', label: 'Reviewed', description: 'The change was read and checked.' },
    { id: 7, label: 'Authored' },
    { id: '7', label: 'Acknowledged' },
  ],
} as const;
const meaningCounts = ['one', 'several'] as const;
const credentialKinds = [
  'password',
  'username-password',
] as const satisfies readonly SignatureDialogCredentials[];
const entries = ['none', 'optional', 'required'] as const satisfies readonly SignatureDialogEntry[];

/** The lab accepts the password "orchard" after a short wait; any other is refused. */
function checkPassword(details: SignatureDetails): Promise<void> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (details.password === 'orchard') resolve();
      else reject(new Error('The password is not right.'));
    }, 300);
  });
}

function describeSignature(details: SignatureDetails): string {
  const parts = [details.userName, String(details.meaning), details.reason || 'no reason'];
  if (details.signature) parts.push(details.signature.kind);
  return parts.join(', ');
}

function Configured({
  meanings,
  credentials,
}: {
  meanings: (typeof meaningCounts)[number];
  credentials: SignatureDialogCredentials;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onPress={() => setOpen(true)}>
        Sign
      </Button>
      <SignatureDialog
        isOpen={open}
        onOpenChange={setOpen}
        title="Sign Requirement 12"
        userName="Ada Lovelace"
        meanings={meaningSets[meanings]}
        credentials={credentials}
        onSign={() => undefined}
        data-lab-modal={`${meanings}-${credentials}`}
      />
    </>
  );
}

/** Sign a change: the summary, a meaning to choose, a reason and the password "orchard". */
function SignChange() {
  const [open, setOpen] = useState(false);
  const [signed, setSigned] = useState('none');
  return (
    <>
      <Button data-lab-open="change" onPress={() => setOpen(true)}>
        Sign the change
      </Button>
      <p>
        Signed: <output data-lab-output="signed">{signed}</output>
      </p>
      <SignatureDialog
        isOpen={open}
        onOpenChange={setOpen}
        title="Sign the release of version 2.4"
        userName="Ada Lovelace"
        meanings={meaningSets.several}
        onSign={async (details) => {
          await checkPassword(details);
          setSigned(describeSignature(details));
        }}
        data-lab-modal="change"
      >
        <p>3 requirements and 1 test plan change. The lab accepts the password orchard.</p>
      </SignatureDialog>
    </>
  );
}

/** The meanings a host might load in turn while its dialog stays open. */
const meaningStages = [
  meaningSets.several,
  meaningSets.several.filter((meaning) => meaning.id !== 'review'),
  [{ id: 'review', label: 'Reviewed' }],
] as const;

/** A dialog whose meanings change while it is open, one stage per press of Load. */
function ChangingMeanings() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(0);
  const [signed, setSigned] = useState('none');
  return (
    <>
      <Button
        data-lab-open="changing"
        onPress={() => {
          setStage(0);
          setOpen(true);
        }}
      >
        Sign with changing meanings
      </Button>
      <p>
        Signed: <output data-lab-output="changing">{signed}</output>
      </p>
      <SignatureDialog
        isOpen={open}
        onOpenChange={setOpen}
        title="Sign the updated plan"
        userName="Ada Lovelace"
        meanings={meaningStages[stage] ?? meaningSets.one}
        reason="none"
        onSign={(details) => setSigned(describeSignature(details))}
        data-lab-modal="changing"
      >
        <p>
          Meanings loaded: {stage + 1} of {meaningStages.length}.{' '}
          <Button
            size="sm"
            isDisabled={stage === meaningStages.length - 1}
            onPress={() => setStage((current) => current + 1)}
          >
            Load the next meanings
          </Button>
        </p>
      </SignatureDialog>
    </>
  );
}

/** A dialog whose entries and signer change while it is open (UIC-SIGNATURE-DIALOG-2.2, 2.3). */
function ChangingSession() {
  const [open, setOpen] = useState(false);
  const [isAsking, setAsking] = useState(true);
  const [signer, setSigner] = useState('Ada Lovelace');
  const [signed, setSigned] = useState('none');
  const entry = isAsking ? 'optional' : 'none';
  return (
    <>
      <Button
        data-lab-open="session"
        onPress={() => {
          setAsking(true);
          setSigner('Ada Lovelace');
          setOpen(true);
        }}
      >
        Sign with changing entries
      </Button>
      <p>
        Signed: <output data-lab-output="session">{signed}</output>
      </p>
      <SignatureDialog
        isOpen={open}
        onOpenChange={setOpen}
        title="Sign the shift handover"
        userName={signer}
        meanings={meaningSets.one}
        reason={entry}
        drawing={entry}
        onSign={(details) => setSigned(describeSignature(details))}
        data-lab-modal="session"
      >
        <p>
          <Button size="sm" onPress={() => setAsking((current) => !current)}>
            {isAsking ? 'Stop asking for a reason and signature' : 'Ask for a reason and signature'}
          </Button>{' '}
          <Button
            size="sm"
            isDisabled={signer !== 'Ada Lovelace'}
            onPress={() => setSigner('Grace Hopper')}
          >
            Hand over to Grace Hopper
          </Button>
        </p>
      </SignatureDialog>
    </>
  );
}

function Entries({
  reason,
  drawing,
}: {
  reason: SignatureDialogEntry;
  drawing: SignatureDialogEntry;
}) {
  const [open, setOpen] = useState(false);
  const [signed, setSigned] = useState('none');
  return (
    <>
      <Button size="sm" onPress={() => setOpen(true)}>
        Sign
      </Button>{' '}
      <output data-lab-output={`entries-${reason}-${drawing}`}>{signed}</output>
      <SignatureDialog
        isOpen={open}
        onOpenChange={setOpen}
        title="Sign the inspection report"
        userName="Grace Hopper"
        meanings={meaningSets.one}
        reason={reason}
        drawing={drawing}
        onSign={(details) => setSigned(describeSignature(details))}
        data-lab-modal={`entries-${reason}-${drawing}`}
      />
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Meanings and credentials"
      description="One meaning is stated, several are chosen; numeric and text ids remain separate choices. Enter the password alone or with the user name."
    >
      <StateMatrix
        axes={{ meanings: meaningCounts, credentials: credentialKinds }}
        render={({ meanings, credentials }) => (
          <Configured meanings={meanings} credentials={credentials} />
        )}
      />
    </LabSection>
    <LabSection
      title="Signing a change"
      description="Sign without entries to see the messages, with a wrong password to see the error, then with orchard."
    >
      <SignChange />
    </LabSection>
    <LabSection
      title="Meanings that change while open"
      description="Pick Reviewed, then load the next meanings: Reviewed is gone, so Sign asks for a new choice. Load again: the sole meaning stated, Reviewed, is the one signed."
    >
      <ChangingMeanings />
    </LabSection>
    <LabSection
      title="Entries and signer that change while open"
      description="Type a reason and a signature, then stop asking for them: Sign leaves them out, and asking again brings them back. Hand over to another signer: every entry starts empty and the password is asked again. Closing clears the entries too."
    >
      <ChangingSession />
    </LabSection>
    <LabSection
      title="Reason and drawn signature"
      description="Each can be left out, offered or required."
    >
      <StateMatrix
        axes={{ reason: entries, drawing: entries }}
        render={({ reason, drawing }) => <Entries reason={reason} drawing={drawing} />}
      />
    </LabSection>
  </>,
);
