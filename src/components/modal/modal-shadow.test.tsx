import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ShadowHost, deepActive, inShadow } from '../../../test/shadow-fixtures.js';
import { PortalHost } from '../portal/portal.js';
import { Modal } from './modal.js';

// React Aria presses need its shadow DOM flag, which stays off in unit tests (UIC-PORTAL-1.8), so
// plain buttons open and close the modal; a portal host keeps it in the shadow root.

function Harness() {
  const [isOpen, setOpen] = useState(false);
  return (
    <ShadowHost name="page">
      <PortalHost>
        <button type="button" onClick={() => setOpen(true)}>
          Open settings
        </button>
        <Modal title="Settings" isOpen={isOpen} onOpenChange={setOpen}>
          <button type="button" onClick={() => setOpen(false)}>
            Done
          </button>
        </Modal>
      </PortalHost>
    </ShadowHost>
  );
}

describe('Modal in a shadow root', () => {
  it('UIC-MODAL-3.3 returns focus to its trigger inside the shadow root', async () => {
    render(<Harness />);
    const trigger = inShadow('page').getByRole('button', { name: 'Open settings' });
    act(() => trigger.focus());
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.click(trigger);
    const done = await waitFor(() => inShadow('page').getByRole('button', { name: 'Done' }));
    act(() => done.focus());
    expect(deepActive()).toBe(done);
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.click(done);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(inShadow('page').queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
    expect(deepActive()).toBe(trigger);
  });
});
