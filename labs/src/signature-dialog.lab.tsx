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
