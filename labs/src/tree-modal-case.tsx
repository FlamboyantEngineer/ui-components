import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import { Tree } from '../../src/components/tree/tree.js';

/** A tree keeps its ordinary action; modified Enter applies its enclosing dialog. */
export function ModalTree() {
  const [applied, setApplied] = useState(0);
  const [actions, setActions] = useState(0);
  return (
    <div data-lab-demo="modal-tree">
      <ModalTrigger>
        <Button>Choose destination</Button>
        <Modal
          title="Destination"
          primaryAction={{
            label: 'Apply',
            onPress: (close) => {
              setApplied((count) => count + 1);
              close();
            },
          }}
        >
          <Tree
            aria-label="Places"
            items={[{ id: 'lisbon', name: 'Lisbon' }]}
            getTextValue={(item) => item.name}
            onAction={() => setActions((count) => count + 1)}
          />
        </Modal>
      </ModalTrigger>
      <output aria-label="Applied destinations">{applied}</output>
      <output aria-label="Place actions">{actions}</output>
    </div>
  );
}
