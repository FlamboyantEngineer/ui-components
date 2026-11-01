import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { deepActive, inShadow, ShadowHost } from '../../../test/shadow-fixtures.js';
import { FocusScope } from './focus-scope.js';

// A scope inside a shadow root reads focus there (UIC-FOCUS-SCOPE-2.8).

function Harness({ afterRef }: { afterRef: React.RefObject<HTMLButtonElement | null> }) {
  const [isOpen, setOpen] = useState(true);
  return (
    <ShadowHost name="page">
      <button type="button" ref={afterRef}>
        Summary
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        Elsewhere
      </button>
      {isOpen ? (
        <FocusScope finalFocus={afterRef}>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </FocusScope>
      ) : null}
    </ShadowHost>
  );
}

describe('FocusScope in a shadow root', () => {
  it('UIC-FOCUS-SCOPE-2.8 sends focus to finalFocus when a scope in a shadow root unmounts', async () => {
    const user = userEvent.setup();
    const afterRef = createRef<HTMLButtonElement>();
    render(<Harness afterRef={afterRef} />);
    await user.click(inShadow('page').getByRole('button', { name: 'Close' }));
    expect(deepActive()).toBe(afterRef.current);
  });

  it('UIC-FOCUS-SCOPE-2.8 leaves focus the reader moved elsewhere in the shadow root', async () => {
    const user = userEvent.setup();
    const afterRef = createRef<HTMLButtonElement>();
    render(<Harness afterRef={afterRef} />);
    const elsewhere = inShadow('page').getByRole('button', { name: 'Elsewhere' });
    await user.click(elsewhere);
    expect(deepActive()).toBe(elsewhere);
  });
});
