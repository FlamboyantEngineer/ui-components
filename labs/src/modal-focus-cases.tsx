import { useRef } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import { StateMatrix } from './chrome/index.js';

type FocusCase = 'hidden' | 'fieldset' | 'chosen-hidden' | 'chosen-plain';

function UnavailableFocusCase({ mode }: { mode: FocusCase }) {
  const target = useRef<HTMLElement | null>(null);
  const isChosen = mode.startsWith('chosen');
  return (
    <ModalTrigger>
      <Button>Open {mode} focus case</Button>
      <Modal
        title={`Focus after ${mode}`}
        showCloseButton
        initialFocus={isChosen ? target : undefined}
      >
        {mode === 'fieldset' ? (
          <fieldset disabled>
            <label>
              Unavailable <input />
            </label>
          </fieldset>
        ) : mode === 'chosen-plain' ? (
          <span
            ref={(node) => {
              target.current = node;
            }}
          >
            Plain text
          </span>
        ) : (
          <label style={{ display: 'none' }}>
            Unavailable{' '}
            <input
              ref={(node) => {
                target.current = node;
              }}
            />
          </label>
        )}
        <label>
          Ready <input readOnly />
        </label>
      </Modal>
    </ModalTrigger>
  );
}

export function ModalFocusCases() {
  return (
    <StateMatrix
      axes={{ unavailable: ['hidden', 'fieldset', 'chosen-hidden', 'chosen-plain'] as const }}
      render={({ unavailable }) => <UnavailableFocusCase mode={unavailable} />}
    />
  );
}
