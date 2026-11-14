import { useRef, useState } from 'react';
import { Attribution } from '../../src/components/attribution/attribution.js';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import { Card } from '../../src/components/card/card.js';
import { ChoiceGroup } from '../../src/components/choice-group/choice-group.js';
import { Choice } from '../../src/components/choice-group/index.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import {
  SignaturePad,
  type SignatureValue,
} from '../../src/components/signature-pad/signature-pad.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { UserIdentity } from '../../src/components/user-identity/user-identity.js';

export function TransitionComposition() {
  const [state, setState] = useState('Available');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  return (
    <Stack space="md">
      <Cluster>
        <Badge>{state}</Badge>
        <DropdownMenu
          ref={triggerRef}
          label="Change availability"
          items={[
            { id: 'archive', label: 'Archive', description: 'Explain this change' },
            { id: 'locked', label: 'Remove', isDisabled: true, description: 'The item is in use' },
          ]}
          onAction={() => setOpen(true)}
        />
      </Cluster>
      <Modal
        isOpen={open}
        onOpenChange={setOpen}
        title="Archive item"
        finalFocus={triggerRef}
        primaryAction={{
          label: 'Archive',
          isDisabled: !reason.trim(),
          onPress: (close) => {
            setState('Archived');
            close();
          },
        }}
      >
        <TextField label="Reason" value={reason} onChange={setReason} isRequired />
      </Modal>
    </Stack>
  );
}

export function ReviewComposition() {
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [reminder, setReminder] = useState('');
  const [attempts, setAttempts] = useState(0);
  const reviewers = [
    { id: 'alex', name: 'Alex Morgan', accepted: true, rejected: false },
    { id: 'sam', name: 'Sam Rivera', accepted, rejected },
  ];
  const count = reviewers.filter((person) => person.accepted).length;
  return (
    <Card
      title="Review sample item"
      description="The host requires two responses and computes the outcome."
    >
      <Stack space="md">
        <Cluster justify="between">
          <Badge tone={rejected ? 'danger' : count === 2 ? 'success' : 'info'}>
            {rejected ? 'Changes requested' : count === 2 ? 'Accepted' : 'Waiting for responses'}
          </Badge>
          <span role="status">{count} of 2 accepted</span>
        </Cluster>
        <Stack as="ul" space="md">
          {reviewers.map((person) => (
            <Stack as="li" key={person.id} space="sm">
              <Cluster justify="between">
                <UserIdentity name={person.name} description="Reviewer" />
                <Badge tone={person.rejected ? 'danger' : person.accepted ? 'success' : 'neutral'}>
                  {person.rejected ? 'Changes requested' : person.accepted ? 'Accepted' : 'Waiting'}
                </Badge>
              </Cluster>
              {person.accepted || person.rejected ? (
                <Attribution time="2026-05-12" person={{ name: person.name }} />
              ) : (
                <Button
                  onPress={async () => {
                    await new Promise<void>((resolve) => window.setTimeout(resolve, 200));
                    setAttempts((value) => value + 1);
                    if (attempts === 0) {
                      setReminder('Delivery failed; retry the reminder.');
                      return;
                    }
                    setReminder('Reminder sent');
                  }}
                >
                  Send reminder
                </Button>
              )}
            </Stack>
          ))}
        </Stack>
        <p role="status">{reminder}</p>
        <Cluster>
          <Button
            isDisabled={accepted}
            onPress={() => {
              setAccepted(true);
              setRejected(false);
            }}
          >
            Accept as Sam
          </Button>
          <Button
            onPress={() => {
              setAccepted(false);
              setRejected(true);
              setReminder('Sam requested changes');
            }}
          >
            Request changes
          </Button>
        </Cluster>
      </Stack>
    </Card>
  );
}

export function DecisionComposition() {
  const [value, setValue] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState('No response');
  return (
    <Stack space="md">
      <ChoiceGroup label="Response" value={value} onChange={setValue} isRequired>
        <Choice value="accept">Accept</Choice>
        <Choice value="revise">Request changes</Choice>
      </ChoiceGroup>
      <TextField label="Comment" value={reason} onChange={setReason} />
      <Button
        isDisabled={!value}
        onPress={() => setResult(`${value ?? ''}${reason ? `: ${reason}` : ''}`)}
      >
        Send response
      </Button>
      <p role="status">{result}</p>
    </Stack>
  );
}

export function SigningComposition() {
  const [signature, setSignature] = useState<SignatureValue | null>(null);
  const [credential, setCredential] = useState('');
  const [result, setResult] = useState('No signature saved');
  return (
    <Stack space="md">
      <ModalTrigger
        onOpenChange={(open) => {
          if (open) {
            setCredential('');
            setSignature(null);
          }
        }}
      >
        <Button>Add signature</Button>
        <Modal
          title="Sign sample item"
          description="For this example, enter orchard to simulate verification."
          primaryAction={{
            label: 'Save signature',
            isDisabled: !signature || !credential,
            onPress: async (close) => {
              await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
              if (credential !== 'orchard')
                throw new Error('The credential was not accepted. Try again.');
              setResult('Signature saved');
              close();
            },
          }}
        >
          <Stack space="md">
            <SignaturePad
              label="Signature"
              modes={['type', 'draw', 'image']}
              value={signature}
              onChange={setSignature}
            />
            <TextField
              label="Credential"
              type="password"
              value={credential}
              onChange={setCredential}
              isRequired
            />
          </Stack>
        </Modal>
      </ModalTrigger>
      <p role="status">{result}</p>
    </Stack>
  );
}
