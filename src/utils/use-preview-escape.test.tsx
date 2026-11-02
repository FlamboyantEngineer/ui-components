import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { pressComposingKeys } from '../../test/composition.js';
import { Button } from '../components/button/button.js';
import { HoverCard, HoverCardTrigger } from '../components/hover-card/hover-card.js';
import { Modal } from '../components/modal/modal.js';
import { Popover, PopoverTrigger } from '../components/popover/popover.js';

function Preview({ name = 'Preview' }: { name?: string }) {
  return (
    <HoverCardTrigger defaultOpen>
      <Button>{name}</Button>
      <HoverCard aria-label={`About ${name}`}>Extra information</HoverCard>
    </HoverCardTrigger>
  );
}

describe('preview Escape outside its trigger and card', () => {
  it('UIC-HOVER-CARD-1.3 closes without taking focus from the page', async () => {
    const user = userEvent.setup();
    render(<Preview />);
    expect(screen.getByRole('dialog', { name: 'About Preview' })).toBeInTheDocument();
    expect(document.body).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body).toHaveFocus();
  });

  it('UIC-HOVER-CARD-1.3 leaves a caller-handled Escape and input composition alone', async () => {
    const user = userEvent.setup();
    const refuse = vi.fn((event: KeyboardEvent) => event.preventDefault());
    const { rerender } = render(
      <>
        <input aria-label="Notes" onKeyDown={refuse} />
        <Preview />
      </>,
    );
    await user.tab();
    await user.keyboard('{Escape}');
    expect(refuse).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog', { name: 'About Preview' })).toBeInTheDocument();
    rerender(
      <>
        <input aria-label="Notes" />
        <Preview />
      </>,
    );
    act(() => pressComposingKeys(screen.getByRole('textbox', { name: 'Notes' })));
    // user-event cannot produce the Escape an input method reports with key code 229.
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Notes' }), {
      key: 'Escape',
      keyCode: 229,
    });
    expect(screen.getByRole('dialog', { name: 'About Preview' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveFocus();
  });

  it('UIC-HOVER-CARD-1.3 UIC-HOVER-CARD-1.4 reports a controlled close once and leaves its owner in charge', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <HoverCardTrigger isOpen onOpenChange={onOpenChange}>
        <Button>Preview</Button>
        <HoverCard aria-label="Controlled preview">Extra information</HoverCard>
      </HoverCardTrigger>,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(screen.getByRole('dialog', { name: 'Controlled preview' })).toBeInTheDocument();
  });

  it('UIC-HOVER-CARD-1.3 closes only the latest default-open preview for one key', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Preview name="First" />
        <Preview name="Second" />
      </>,
    );
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'About Second' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('dialog', { name: 'About First' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  for (const refuses of [false, true]) {
    it(`UIC-HOVER-CARD-1.3 UIC-MODAL-2.1 leaves Escape to an owning modal (refuses=${String(refuses)})`, async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <>
          <Preview />
          <Modal
            defaultOpen
            title="Settings"
            isKeyboardDismissDisabled={refuses}
            onOpenChange={onOpenChange}
          >
            <Button>Setting</Button>
          </Modal>
        </>,
      );
      const modal = screen.getByRole('dialog', { name: 'Settings' });
      await waitFor(() => expect(modal.contains(document.activeElement)).toBe(true));
      await user.keyboard('{Escape}');
      if (refuses) expect(onOpenChange).not.toHaveBeenCalled();
      else await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
      expect(document.querySelector('.ui-hover-card')).toBeInTheDocument();
    });
  }

  it('UIC-HOVER-CARD-1.3 UIC-POPOVER-2.1 leaves Escape to an interactive popover', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Preview />
        <PopoverTrigger defaultOpen>
          <Button>Options</Button>
          <Popover aria-label="Options">
            <Button>Choose</Button>
          </Popover>
        </PopoverTrigger>
      </>,
    );
    const popover = screen.getByRole('dialog', { name: 'Options' });
    await waitFor(() => expect(popover.contains(document.activeElement)).toBe(true));
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Options' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('dialog', { name: 'About Preview' })).toBeInTheDocument();
  });
});
