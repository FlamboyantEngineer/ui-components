import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import { PortalContainerProvider } from '../portal/portal.js';
import { Popover, PopoverTrigger, type PopoverProps } from './popover.js';

/** A page with a field, a trigger and the popover it opens. */
function Page({ triggerProps = {}, ...props }: Partial<PopoverProps> & { triggerProps?: object }) {
  return (
    <>
      <input aria-label="Page field" />
      <PopoverTrigger {...triggerProps}>
        <Button>Filters</Button>
        <Popover title="Filters" {...props}>
          {props.children ?? <input aria-label="City" />}
        </Popover>
      </PopoverTrigger>
    </>
  );
}

const panel = () => document.querySelector<HTMLElement>('.ui-popover');

async function open() {
  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  return screen.findByRole('dialog');
}

describe('Popover', () => {
  it('UIC-POPOVER-1.1 UIC-POPOVER-3.1 UIC-POPOVER-3.4 opens a titled dialog from its trigger', async () => {
    const { container } = render(
      <Page
        className="extra"
        id="filters"
        data-testid="filters"
        data-lab="panel"
        showArrow
        showCloseButton
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Filters' });
    expect(panel()).toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const dialog = await open();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(dialog).toHaveAccessibleName('Filters');
    expect(dialog).toHaveAttribute('id', 'filters');
    expect(dialog).toHaveClass('ui-popover__dialog');
    expect(screen.getByRole('heading', { level: 2, name: 'Filters' })).toHaveClass(
      'ui-popover__title',
    );
    expect(panel()).toHaveClass('ui-popover', 'extra');
    expect(panel()).toHaveAttribute('data-lab', 'panel');
    expect(panel()?.contains(dialog)).toBe(true);
    expect(container.contains(dialog)).toBe(false);
    expectHooksMatchSpec(document.body, 'POPOVER', {
      slots: 'all',
      callerAttributes: ['data-lab'],
    });
  });

  it('UIC-POPOVER-1.1 follows a controlled trigger and opens at first with defaultOpen', async () => {
    const onOpenChange = vi.fn();
    function Controlled() {
      const [isOpen, setOpen] = useState(false);
      return (
        <Page
          triggerProps={{
            isOpen,
            onOpenChange: (next: boolean) => {
              onOpenChange(next);
              setOpen(next);
            },
          }}
        />
      );
    }
    const { unmount } = render(<Controlled />);
    await open();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(panel()).toBeNull());
    unmount();
    render(<Page triggerProps={{ defaultOpen: true }} />);
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('UIC-POPOVER-1.2 UIC-POPOVER-3.2 opens a controlled popover against a chosen element', async () => {
    const onOpenChange = vi.fn();
    function Standalone() {
      const [isOpen, setOpen] = useState(false);
      const anchorRef = useRef<HTMLSpanElement>(null);
      return (
        <>
          <span ref={anchorRef}>Anchor</span>
          <button type="button" onClick={() => setOpen(true)}>
            Show
          </button>
          <Popover
            title="Details"
            showCloseButton
            isOpen={isOpen}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
            triggerRef={anchorRef}
          >
            Four days in October.
          </Popover>
        </>
      );
    }
    render(<Standalone />);
    await userEvent.click(screen.getByRole('button', { name: 'Show' }));
    const close = await screen.findByRole('button', { name: 'Close' });
    expect(close).toHaveClass('ui-popover__close', 'ui-button');
    expect(panel()).not.toHaveAttribute('data-trigger');
    await userEvent.click(close);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(panel()).toBeNull());
    await userEvent.click(screen.getByRole('button', { name: 'Show' }));
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(panel()).toBeNull());
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it('UIC-POPOVER-1.2 anchors a popover in a trigger to another element and returns focus to the trigger', async () => {
    function Anchored() {
      const anchorRef = useRef<HTMLDivElement>(null);
      return (
        <>
          <div ref={anchorRef}>Toolbar</div>
          <Page triggerRef={anchorRef} />
        </>
      );
    }
    render(<Anchored />);
    await open();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(panel()).toBeNull());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus());
  });

  it('UIC-POPOVER-1.3 UIC-POPOVER-1.4 publishes the side on the panel and the arrow', async () => {
    const { unmount } = render(<Page placement="top" offset={12} crossOffset={4} showArrow />);
    await open();
    const arrow = panel()?.querySelector(':scope > .ui-popover__arrow');
    expect(arrow).toHaveAttribute('data-placement', 'top');
    expect(panel()).toHaveAttribute('data-placement', 'top');
    unmount();
    render(<Page />);
    await open();
    expect(panel()).toHaveAttribute('data-placement', 'bottom');
    expect(document.querySelector('.ui-popover__arrow')).toBeNull();
  });

  it('UIC-POPOVER-1.5 stacks on the dropdown layer and publishes its trigger', async () => {
    const { unmount } = render(<Page />);
    await open();
    expect(panel()?.style.zIndex).toBe('130');
    expect(panel()).toHaveAttribute('data-trigger', 'DialogTrigger');
    unmount();
    render(
      <PortalContainerProvider layerZIndex={{ dropdown: 700 }}>
        <Page />
      </PortalContainerProvider>,
    );
    await open();
    expect(panel()?.style.zIndex).toBe('700');
  });

  it('UIC-POPOVER-2.1 closes on Escape and outside presses unless refused', async () => {
    const { unmount } = render(<Page />);
    await open();
    await userEvent.click(document.body);
    await waitFor(() => expect(panel()).toBeNull());
    unmount();

    const shouldClose = vi.fn(() => false);
    render(<Page isKeyboardDismissDisabled shouldCloseOnInteractOutside={shouldClose} />);
    await open();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(document.body);
    expect(shouldClose).toHaveBeenCalled();
    expect(panel()).not.toBeNull();
  });

  it('UIC-POPOVER-2.2 moves focus in, keeps it inside and returns it to the trigger', async () => {
    const { unmount } = render(<Page showCloseButton />);
    const dialog = await open();
    await waitFor(() => expect(dialog).toHaveFocus());
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('textbox', { name: 'City' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(panel()).toBeNull());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus());
    unmount();

    render(
      <Page>
        <input aria-label="Search" autoFocus />
      </Page>,
    );
    await open();
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus());
  });

  it('UIC-POPOVER-2.3 hides the page while open unless non-modal', async () => {
    const { unmount } = render(<Page />);
    await open();
    const field = () => screen.getByRole('textbox', { name: 'Page field', hidden: true });
    expect(field().closest('[aria-hidden="true"], [inert]')).not.toBeNull();
    expect(document.documentElement.style.overflow).toBe('hidden');
    unmount();

    render(<Page isNonModal />);
    await open();
    expect(field().closest('[aria-hidden="true"], [inert]')).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
    await userEvent.click(field());
    await waitFor(() => expect(panel()).toBeNull());
    await open();
    fireEvent.scroll(document);
    await waitFor(() => expect(panel()).toBeNull());
  });

  it('UIC-POPOVER-3.1 UIC-POPOVER-3.2 UIC-POPOVER-3.3 closes from its parts and names a popover without a title', async () => {
    const { unmount } = render(
      <Page showCloseButton>
        {({ close }) => (
          <button type="button" onClick={close}>
            Apply
          </button>
        )}
      </Page>,
    );
    await open();
    expect(document.querySelector('.ui-popover__body')).toContainElement(
      screen.getByRole('button', { name: 'Apply' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(panel()).toBeNull());
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(panel()).toBeNull());
    unmount();

    const { unmount: unmountColour } = render(
      <PopoverTrigger defaultOpen>
        <Button>Colour</Button>
        <Popover aria-label="Colour">{null}</Popover>
      </PopoverTrigger>,
    );
    expect(screen.getByRole('dialog', { name: 'Colour' })).toBeInTheDocument();
    expect(document.querySelector('.ui-popover__header')).toBeNull();
    expect(document.querySelector('.ui-popover__body')).toBeNull();
    expectHooksMatchSpec(document.body, 'POPOVER', { slots: ['dialog'] });
    unmountColour();

    render(
      <>
        <span id="size-label">Brush size</span>
        <PopoverTrigger defaultOpen>
          <Button>Size</Button>
          <Popover aria-labelledby="size-label">Small, medium or large.</Popover>
        </PopoverTrigger>
      </>,
    );
    expect(screen.getByRole('dialog', { name: 'Brush size' })).toHaveClass('ui-popover__dialog');
  });
});
