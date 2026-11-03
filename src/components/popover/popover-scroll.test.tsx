import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from './popover.js';

function Example({ controlled }: { controlled: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [isOpen, setOpen] = useState(false);
  const button = (
    <Button
      ref={trigger}
      onPress={() => {
        if (viewport.current) viewport.current.scrollTop = 20;
        if (controlled) setOpen(true);
      }}
    >
      Preview
    </Button>
  );
  const popup = (
    <Popover
      isNonModal
      triggerRef={trigger}
      title="Details"
      {...(controlled ? { isOpen, onOpenChange: setOpen } : {})}
    >
      <Button>Inside</Button>
    </Popover>
  );
  return (
    <>
      <Button>Outside</Button>
      <div ref={viewport} role="region" aria-label="Scrollable items">
        {controlled ? (
          <>
            {button}
            {popup}
          </>
        ) : (
          <PopoverTrigger>
            {button}
            {popup}
          </PopoverTrigger>
        )}
      </div>
    </>
  );
}

for (const controlled of [false, true]) {
  describe(`Popover controlled=${controlled}`, () => {
    it('UIC-POPOVER-2.3 ignores a delayed unchanged-position scroll and still closes on new movement', async () => {
      const user = userEvent.setup();
      render(<Example controlled={controlled} />);
      await user.click(screen.getByRole('button', { name: 'Preview' }));
      const dialog = await screen.findByRole('dialog', { name: 'Details' });
      const viewport = screen.getByRole('region', { name: 'Scrollable items' });
      fireEvent.scroll(viewport);
      expect(dialog).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Inside' }));
      expect(dialog).toBeInTheDocument();
      viewport.scrollTop = 40;
      fireEvent.scroll(viewport);
      await waitFor(() => expect(dialog).not.toBeInTheDocument());
    });

    it('UIC-POPOVER-2.1 UIC-POPOVER-2.3 honors Escape before a rejected scroll close can commit', async () => {
      const user = userEvent.setup();
      render(<Example controlled={controlled} />);
      const trigger = screen.getByRole('button', { name: 'Preview' });
      await user.click(trigger);
      const dialog = await screen.findByRole('dialog', { name: 'Details' });
      const viewport = screen.getByRole('region', { name: 'Scrollable items' });
      const inside = screen.getByRole('button', { name: 'Inside' });
      // Batch the native events so a rejected scroll cannot commit before Escape arrives.
      act(() => {
        viewport.dispatchEvent(new Event('scroll'));
        inside.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );
      });
      await waitFor(() => expect(dialog).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('UIC-POPOVER-2.1 UIC-POPOVER-2.2 a finished scroll never suppresses Escape or outside focus', async () => {
      const user = userEvent.setup();
      render(<Example controlled={controlled} />);
      const trigger = screen.getByRole('button', { name: 'Preview' });
      await user.click(trigger);
      const viewport = screen.getByRole('region', { name: 'Scrollable items' });
      fireEvent.scroll(viewport);
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
      await user.click(trigger);
      await screen.findByRole('dialog');
      fireEvent.scroll(viewport);
      await user.click(screen.getByRole('button', { name: 'Outside' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });
}
