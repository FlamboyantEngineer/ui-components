import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type KeyboardEvent, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../button/button.js';
import { Modal } from './modal.js';

describe('Modal primary keys from buttons', { timeout: 15_000 }, () => {
  it.each(['Control', 'Meta'])(
    'UIC-MODAL-6.1 runs the primary action from focused Cancel with %s+Enter',
    async (modifier) => {
      const user = userEvent.setup();
      const primary = vi.fn();
      const closed = vi.fn();
      render(
        <Modal
          title="Edit entry"
          isOpen
          onOpenChange={closed}
          primaryAction={{ label: 'Save', onPress: primary }}
        />,
      );
      const cancel = screen.getByRole('button', { name: 'Cancel' });
      cancel.focus();
      await user.keyboard(`{${modifier}>}{Enter}{/${modifier}}`);
      expect(primary).toHaveBeenCalledTimes(1);
      expect(closed).not.toHaveBeenCalled();
      expect(cancel).toHaveFocus();
    },
  );

  it.each([{ isDisabled: true }, { isPending: true }])(
    'UIC-MODAL-6.1 suppresses Cancel while the primary cannot run: %j',
    async (locked) => {
      const user = userEvent.setup();
      const primary = vi.fn();
      const closed = vi.fn();
      render(
        <Modal
          title="Edit entry"
          isOpen
          onOpenChange={closed}
          primaryAction={{ label: 'Save', onPress: primary, ...locked }}
        />,
      );
      const cancel = screen.getByRole('button', { name: 'Cancel' });
      cancel.focus();
      await user.keyboard('{Control>}{Enter}{/Control}{Meta>}{Enter}{/Meta}');
      expect(primary).not.toHaveBeenCalled();
      expect(closed).not.toHaveBeenCalled();
      await user.keyboard('{Enter}');
      expect(closed).toHaveBeenCalledExactlyOnceWith(false);
    },
  );

  it.each(['button', 'ancestor'])(
    'UIC-MODAL-6.1 respects %s preventDefault and calls the button caller once',
    async (owner) => {
      const user = userEvent.setup();
      const primary = vi.fn();
      const pressed = vi.fn();
      const keys = vi.fn();
      const consume = (event: KeyboardEvent) => {
        if (event.key === 'Enter') event.preventDefault();
      };
      render(
        <Modal title="Edit entry" isOpen primaryAction={{ label: 'Save', onPress: primary }}>
          <div onKeyDown={owner === 'ancestor' ? consume : undefined}>
            <Button
              onPress={pressed}
              onKeyDown={(event) => {
                keys(event.key);
                if (owner === 'button') consume(event);
              }}
              render={(props) => <button {...props} />}
            >
              Review
            </Button>
          </div>
        </Modal>,
      );
      screen.getByRole('button', { name: 'Review' }).focus();
      await user.keyboard('{Control>}{Enter}{/Control}');
      expect(keys.mock.calls.filter(([key]) => key === 'Enter')).toHaveLength(1);
      expect(pressed).not.toHaveBeenCalled();
      expect(primary).not.toHaveBeenCalled();
    },
  );

  it('UIC-MODAL-6.1 lets only the nested dialog own a focused Cancel shortcut', async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    const inner = vi.fn();
    const closed = vi.fn();
    function Nested() {
      const [isOpen, setOpen] = useState(false);
      return (
        <Modal title="Outer" isOpen primaryAction={{ label: 'Apply outer', onPress: outer }}>
          <Button onPress={() => setOpen(true)}>Open details</Button>
          <Modal
            title="Inner"
            isOpen={isOpen}
            onOpenChange={(next) => {
              closed(next);
              setOpen(next);
            }}
            primaryAction={{ label: 'Apply inner', onPress: inner }}
          />
        </Modal>
      );
    }
    render(<Nested />);
    await user.click(screen.getByRole('button', { name: 'Open details' }));
    const dialog = await screen.findByRole('dialog', { name: 'Inner' });
    expect(screen.queryByRole('dialog', { name: 'Outer' })).not.toBeInTheDocument();
    within(dialog).getByRole('button', { name: 'Cancel' }).focus();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
    expect(closed).not.toHaveBeenCalled();
  });

  it('UIC-MODAL-6.1 preserves multiline, repeated and composition exclusions', async () => {
    const user = userEvent.setup();
    const primary = vi.fn();
    const pressed = vi.fn();
    const closed = vi.fn();
    render(
      <Modal
        title="Edit entry"
        isOpen
        onOpenChange={closed}
        primaryAction={{ label: 'Save', onPress: primary }}
      >
        <div role="textbox" aria-label="Editor" aria-multiline="true" tabIndex={0}>
          <Button onPress={pressed}>Editor action</Button>
        </div>
      </Modal>,
    );
    screen.getByRole('button', { name: 'Editor action' }).focus();
    await user.keyboard('{Control>}{Enter}{/Control}');
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    cancel.focus();
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set repeat or isComposing.
    fireEvent.keyDown(cancel, { key: 'Enter', ctrlKey: true, repeat: true });
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set repeat or isComposing.
    fireEvent.keyDown(cancel, { key: 'Enter', metaKey: true, isComposing: true });
    expect(primary).not.toHaveBeenCalled();
    expect(pressed).not.toHaveBeenCalled();
    expect(closed).not.toHaveBeenCalled();
  });

  it('UIC-MODAL-6.1 keeps ordinary buttons outside a modal unchanged', async () => {
    const user = userEvent.setup();
    const pressed = vi.fn();
    render(<Button onPress={pressed}>Apply</Button>);
    screen.getByRole('button', { name: 'Apply' }).focus();
    await user.keyboard('{Enter} ');
    expect(pressed).toHaveBeenCalledTimes(2);
  });
});
