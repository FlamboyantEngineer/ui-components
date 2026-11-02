import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../button/button.js';
import { Modal, ModalTrigger } from '../modal/modal.js';
import { Tree } from './tree.js';

const places = [{ id: 'lisbon', name: 'Lisbon' }];

describe('Tree modal shortcuts', () => {
  it.each(['Control', 'Meta'])(
    'UIC-TREE-3.6 leaves %s+Enter on a row to the innermost modal',
    async (modifier) => {
      const user = userEvent.setup();
      const innerApply = vi.fn();
      const outerApply = vi.fn();
      const onAction = vi.fn();
      render(
        <Modal isOpen title="Outer" primaryAction={{ label: 'Save outer', onPress: outerApply }}>
          <ModalTrigger>
            <Button>Choose place</Button>
            <Modal
              title="Destination"
              primaryAction={{
                label: 'Apply',
                onPress: (close) => {
                  innerApply();
                  close();
                },
              }}
            >
              <Tree
                aria-label="Places"
                items={places}
                getTextValue={(item) => item.name}
                onAction={onAction}
              />
            </Modal>
          </ModalTrigger>
        </Modal>,
      );
      await user.click(screen.getByRole('button', { name: 'Choose place' }));
      const dialog = screen.getByRole('dialog', { name: 'Destination' });
      const row = within(dialog).getByRole('row', { name: 'Lisbon' });
      act(() => row.focus());
      await user.keyboard(`{${modifier}>}{Enter}{/${modifier}}`);
      expect(innerApply).toHaveBeenCalledOnce();
      expect(outerApply).not.toHaveBeenCalled();
      expect(onAction).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog', { name: 'Destination' })).not.toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: 'Outer' })).toBeInTheDocument();
    },
  );

  it.each(['pending', 'owner'])(
    'UIC-TREE-3.6 respects %s refusal of the modal shortcut and keeps ordinary Enter',
    async (refusal) => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onAction = vi.fn();
      render(
        <Modal
          isOpen
          title="Destination"
          primaryAction={{ label: 'Apply', onPress: onApply, isPending: refusal === 'pending' }}
        >
          <Tree
            aria-label="Places"
            items={places}
            getTextValue={(item) => item.name}
            onAction={onAction}
            onItemKeyDown={(_item, event) => refusal === 'owner' && event.ctrlKey}
          />
        </Modal>,
      );
      act(() => screen.getByRole('row', { name: 'Lisbon' }).focus());
      await user.keyboard('{Control>}{Enter}{/Control}');
      expect(onApply).not.toHaveBeenCalled();
      expect(onAction).not.toHaveBeenCalled();
      await user.keyboard('{Enter}');
      expect(onAction).toHaveBeenCalledExactlyOnceWith('lisbon');
      expect(onApply).not.toHaveBeenCalled();
    },
  );

  it('UIC-TREE-3.6 keeps modified Enter with a tree outside a modal', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <Tree
        aria-label="Places"
        items={places}
        getTextValue={(item) => item.name}
        onAction={onAction}
      />,
    );
    act(() => screen.getByRole('row', { name: 'Lisbon' }).focus());
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onAction).toHaveBeenCalledExactlyOnceWith('lisbon');
  });
});
