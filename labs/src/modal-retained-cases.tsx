import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Modal } from '../../src/components/modal/modal.js';
import { LabOutput } from './lab-output.js';

/** A body with its own draft that counts how many times it mounted. */
function LetterBody({ onMount }: { onMount: () => void }) {
  const [draft, setDraft] = useState('');
  useEffect(onMount, [onMount]);
  return (
    <label>
      Letter <textarea rows={4} value={draft} onChange={(event) => setDraft(event.target.value)} />
    </label>
  );
}

/** A modal that keeps its body, and its draft, while closed. */
export function RetainedLetter() {
  const [open, setOpen] = useState(false);
  const [mounts, setMounts] = useState(0);
  const countMount = useCallback(() => setMounts((count) => count + 1), []);
  return (
    <div data-lab-demo="retained">
      <Button size="sm" onPress={() => setOpen(true)}>
        Write a letter
      </Button>
      <LabOutput name="Body mounts">{mounts}</LabOutput>
      <Modal
        keepMounted
        isOpen={open}
        onOpenChange={setOpen}
        title="Letter"
        description="Close and reopen: the draft is still here."
        showCloseButton
        isDismissable
        data-lab-modal="retained"
        primaryAction={{ label: 'Done', onPress: (close) => close() }}
      >
        <LetterBody onMount={countMount} />
      </Modal>
    </div>
  );
}
