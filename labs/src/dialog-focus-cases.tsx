import { useRef } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Dialog, DialogTrigger } from '../../src/components/dialog/dialog.js';
import { StateMatrix } from './chrome/index.js';

type FocusCase = 'hidden' | 'fieldset' | 'chosen-hidden' | 'chosen-plain';

function UnavailableFocusCase({ mode }: { mode: FocusCase }) {
  const target = useRef<HTMLElement | null>(null);
  const isChosen = mode.startsWith('chosen');
  return (
    <DialogTrigger>
      <Button>Open {mode} focus case</Button>
      <Dialog
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
      </Dialog>
    </DialogTrigger>
  );
}

export function DialogFocusCases() {
  return (
    <StateMatrix
      axes={{ unavailable: ['hidden', 'fieldset', 'chosen-hidden', 'chosen-plain'] as const }}
      render={({ unavailable }) => <UnavailableFocusCase mode={unavailable} />}
    />
  );
}
