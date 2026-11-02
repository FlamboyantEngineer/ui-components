import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { InlineEdit } from '../../src/components/inline-edit/inline-edit.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** An editor the page opens and closes, with every change of editing logged. */
function PageOwnedEditing() {
  const [value, setValue] = useState('Rye sourdough');
  const [isEditing, setEditing] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  return (
    <div data-lab-demo="owned-editing">
      <Button size="sm" variant="secondary" onPress={() => setEditing(true)}>
        Edit from the page
      </Button>{' '}
      <Button size="sm" variant="secondary" onPress={() => setEditing(false)}>
        Close from the page
      </Button>
      <InlineEdit
        label="Loaf"
        value={value}
        onSave={setValue}
        isEditing={isEditing}
        onEditingChange={(next) => {
          setEditing(next);
          setLog((list) => [...list, next ? 'open' : 'close']);
        }}
      />
      <LabOutput name="editing">{isEditing ? 'open' : 'closed'}</LabOutput>
      <LabOutput name="editing-log">{log.join(', ') || 'nothing yet'}</LabOutput>
    </div>
  );
}

/** A custom editor that shows its own saving state from isPending while a slow save runs. */
function PendingAwareEditor() {
  const [value, setValue] = useState('Proof for 2 hours');
  return (
    <div data-lab-demo="pending-editor">
      <InlineEdit
        label="Step"
        value={value}
        onSave={(next: string) =>
          new Promise<void>((resolve) => {
            window.setTimeout(() => {
              setValue(next);
              resolve();
            }, 1500);
          })
        }
        renderEditor={({ value: draft, onChange, commit, label, isPending, isDisabled }) => (
          <span data-lab-pending={isPending || undefined}>
            <TextField
              label={label}
              labelLayout="control-only"
              value={draft}
              onChange={onChange}
              isReadOnly={isPending}
              isDisabled={isDisabled}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commit();
              }}
            />{' '}
            <output data-lab-output="editor-state">
              {isPending ? 'Saving…' : 'Press Enter to save'}
            </output>
          </span>
        )}
      />
    </div>
  );
}

export function InlineEditHostCases() {
  return (
    <div data-lab-family="inline-edit-host-cases">
      <LabSection
        title="Editing the page owns"
        description="isEditing and onEditingChange put the editor's open state in the page: the page's buttons open and close it, and every request, from the page or the reader, is logged."
      >
        <PageOwnedEditing />
      </LabSection>
      <LabSection
        title="A custom editor's pending state"
        description="A renderEditor reads isPending while a save runs (here for a second and a half) and shows Saving… with its field read-only, so the draft cannot change under the save. isDisabled is separate: it says the whole inline edit is disabled, and a pending save does not set it."
      >
        <PendingAwareEditor />
      </LabSection>
    </div>
  );
}
