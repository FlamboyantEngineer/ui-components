import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { PortalContainerProvider } from '../portal/portal.js';
import { Drawer, DrawerTrigger, type DrawerProps } from './drawer.js';

type ObserverCallback = (entries: Array<{ intersectionRatio: number }>) => void;

/** The visibility callbacks React Aria's sheets registered, newest last. */
let observers: ObserverCallback[] = [];

function Page({ triggerProps = {}, ...props }: Partial<DrawerProps> & { triggerProps?: object }) {
  return (
    <>
      <input aria-label="Page field" />
      <DrawerTrigger {...triggerProps}>
        <Button>Filters</Button>
        <Drawer title="Filters" {...props}>
          {props.children ?? <input aria-label="City" />}
        </Drawer>
      </DrawerTrigger>
    </>
  );
}

const overlay = () => document.querySelector<HTMLElement>('.ui-drawer');
const panel = () => document.querySelector<HTMLElement>('.ui-drawer__panel');

/** Ends React Aria's slide: jsdom never scrolls, so the scroll end the sheet waits for is sent. */
async function settle() {
  await act(async () => {
    for (const scroller of document.querySelectorAll('[data-sheet-scroll]')) {
      scroller.dispatchEvent(new Event('scrollend'));
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
}

async function open(name = 'Filters') {
  await userEvent.click(screen.getByRole('button', { name }));
  await settle();
  return screen.getByRole('dialog', { name });
}

/** Reports how much of the newest sheet is visible, as React Aria's observer would while swiping. */
function reportVisible(intersectionRatio: number) {
  act(() => observers.at(-1)?.([{ intersectionRatio }]));
}

beforeAll(() => {
  Element.prototype.scrollTo = () => {};
});

afterAll(() => {
  // @ts-expect-error -- jsdom has no scrollTo; the stub goes away with the suite.
  delete Element.prototype.scrollTo;
});

beforeEach(() => {
  observers = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: ObserverCallback) {
        observers.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Drawer', () => {
  it('UIC-DRAWER-1.1 UIC-DRAWER-4.1 UIC-DRAWER-4.3 opens a titled dialog in a sliding panel', async () => {
    render(
      <Page
        className="extra"
        id="filters"
        data-lab="drawer"
        showCloseButton
        footer={<Button>Apply</Button>}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Filters' });
    expect(overlay()).toBeNull();
    const dialog = await open();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(dialog).toHaveClass('ui-drawer__dialog');
    expect(dialog).toHaveAttribute('id', 'filters');
    expect(screen.getByRole('heading', { level: 2, name: 'Filters' })).toHaveClass(
      'ui-drawer__title',
    );
    expect(overlay()).toHaveClass('ui-drawer', 'extra');
    expect(overlay()).toHaveAttribute('data-lab', 'drawer');
    expect(overlay()?.querySelector('.ui-drawer__backdrop')).not.toBeNull();
    expect(panel()?.contains(dialog)).toBe(true);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass(
      'ui-drawer__close',
      'ui-button',
    );
    expect(document.querySelector('.ui-drawer__footer')).toHaveTextContent('Apply');
    expectHooksMatchSpec(document.body, 'DRAWER', { slots: 'all', callerAttributes: ['data-lab'] });
  });

  it('UIC-DRAWER-1.1 follows a controlled trigger or drawer and opens at first with defaultOpen', async () => {
    const onOpenChange = vi.fn();
    function Controlled() {
      const [isOpen, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Show
          </button>
          <Drawer
            title="Notes"
            isOpen={isOpen}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
          >
            Body
          </Drawer>
        </>
      );
    }
    const { unmount } = render(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Show' }));
    await settle();
    expect(screen.getByRole('dialog', { name: 'Notes' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await settle();
    expect(overlay()).toBeNull();
    unmount();

    render(<Page triggerProps={{ defaultOpen: true }} />);
    await settle();
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('UIC-DRAWER-1.2 rests against the chosen edge, with start and end following the direction', async () => {
    const cases = [
      [undefined, 'en-US', 'right'],
      ['start', 'en-US', 'left'],
      ['end', 'ar-EG', 'left'],
      ['top', 'en-US', 'top'],
      ['bottom', 'en-US', 'bottom'],
      ['left', 'en-US', 'left'],
      ['right', 'en-US', 'right'],
    ] as const;
    for (const [position, locale, edge] of cases) {
      const { unmount } = render(
        <UiProvider locale={locale}>
          <Page position={position} triggerProps={{ defaultOpen: true }} />
        </UiProvider>,
      );
      await settle();
      for (const element of [overlay(), panel(), document.querySelector('.ui-drawer__backdrop')]) {
        expect(element).toHaveAttribute('data-position', edge);
        expect(element).toHaveAttribute('data-swipe-direction', edge);
      }
      unmount();
    }
  });

  it('UIC-DRAWER-1.3 UIC-DRAWER-1.4 publishes its size and stacks on the drawer layer', async () => {
    const { unmount } = render(<Page triggerProps={{ defaultOpen: true }} />);
    await settle();
    expect(overlay()).toHaveAttribute('data-size', 'md');
    expect(overlay()?.style.zIndex).toBe('110');
    unmount();
    render(
      <PortalContainerProvider layerZIndex={{ drawer: 600 }}>
        <Page size="lg" triggerProps={{ defaultOpen: true }} />
      </PortalContainerProvider>,
    );
    await settle();
    expect(overlay()).toHaveAttribute('data-size', 'lg');
    expect(overlay()?.style.zIndex).toBe('600');
  });

  it('UIC-DRAWER-1.5 publishes entering and exiting, staying mounted until it has left', async () => {
    render(<Page />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const backdrop = () => document.querySelector('.ui-drawer__backdrop');
    expect(overlay()).toHaveAttribute('data-entering', 'true');
    expect(backdrop()).toHaveAttribute('data-entering', 'true');
    await settle();
    expect(overlay()).not.toHaveAttribute('data-entering');
    await userEvent.keyboard('{Escape}');
    expect(overlay()).toHaveAttribute('data-exiting', 'true');
    expect(backdrop()).toHaveAttribute('data-exiting', 'true');
    expect(panel()).toHaveAttribute('data-exiting', 'true');
    await settle();
    expect(overlay()).toBeNull();
  });

  it('UIC-DRAWER-2.1 closes on Escape unless keyboard dismissal is disabled', async () => {
    const { unmount } = render(<Page />);
    await open();
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(overlay()).toBeNull();
    unmount();

    render(<Page isKeyboardDismissDisabled />);
    await open();
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('UIC-DRAWER-2.2 closes on outside presses unless not dismissable', async () => {
    const { unmount } = render(<Page />);
    await open();
    await userEvent.click(document.querySelector('.ui-drawer__backdrop') as HTMLElement);
    await settle();
    expect(overlay()).toBeNull();
    unmount();

    const { unmount: unmountRefused } = render(<Page isDismissable={false} />);
    await open();
    await userEvent.click(document.querySelector('.ui-drawer__backdrop') as HTMLElement);
    await settle();
    expect(overlay()).not.toBeNull();
    unmountRefused();

    const shouldClose = vi.fn(() => false);
    render(<Page shouldCloseOnInteractOutside={shouldClose} />);
    await open();
    await userEvent.click(document.querySelector('.ui-drawer__backdrop') as HTMLElement);
    await settle();
    expect(shouldClose).toHaveBeenCalled();
    expect(overlay()).not.toBeNull();
  });

  it('UIC-DRAWER-2.3 closes once swiped out of the viewport, in the chosen direction', async () => {
    const onOpenChange = vi.fn();
    const { unmount } = render(<Page triggerProps={{ onOpenChange }} />);
    await open();
    reportVisible(1);
    reportVisible(0);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await settle();
    expect(overlay()).toBeNull();
    unmount();

    render(<Page swipeDirection="horizontal" triggerProps={{ defaultOpen: true }} />);
    await settle();
    expect(overlay()).toHaveAttribute('data-position', 'right');
    expect(overlay()).toHaveAttribute('data-swipe-direction', 'horizontal');
  });

  it('UIC-DRAWER-2.4 refuses every dismissal while isDismissDisabled is set', async () => {
    render(
      <Page isDismissDisabled showCloseButton>
        {({ close }) => (
          <button type="button" onClick={close}>
            Done
          </button>
        )}
      </Page>,
    );
    await open();
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(document.querySelector('.ui-drawer__backdrop') as HTMLElement);
    await settle();
    expect(overlay()).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await settle();
    expect(overlay()).toBeNull();
  });

  it('UIC-DRAWER-3.1 moves focus in once entered, keeps it inside and hides the page', async () => {
    const { unmount } = render(<Page showCloseButton />);
    const trigger = screen.getByRole('button', { name: 'Filters' });
    const dialog = await open();
    await waitFor(() => expect(dialog).toHaveFocus());
    const field = screen.getByRole('textbox', { name: 'Page field', hidden: true });
    expect(field.closest('[aria-hidden="true"], [inert]')).not.toBeNull();
    expect(document.documentElement.style.overflow).toBe('hidden');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('textbox', { name: 'City' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await settle();
    expect(overlay()).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus(), { timeout: 3000 });
    unmount();

    render(
      <Page>
        <input aria-label="Search" autoFocus />
      </Page>,
    );
    await open();
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus());
  });

  it('UIC-DRAWER-4.2 renders the body and footer only when given', async () => {
    render(
      <DrawerTrigger defaultOpen>
        <Button>Help</Button>
        <Drawer title="Help">{null}</Drawer>
      </DrawerTrigger>,
    );
    await settle();
    expect(screen.getByRole('dialog', { name: 'Help' })).toBeInTheDocument();
    expect(document.querySelector('.ui-drawer__body')).toBeNull();
    expect(document.querySelector('.ui-drawer__footer')).toBeNull();
    expect(document.querySelector('.ui-drawer__close')).toBeNull();
  });

  it('UIC-DRAWER-5.1 rests at snap points and publishes when it is fully revealed', async () => {
    render(<Page position="bottom" snapPoints={['50%', '100%']} />);
    await open();
    expect(panel()?.querySelectorAll('[data-sheet-detent]')).toHaveLength(2);
    expect(panel()).not.toHaveAttribute('data-expanded');
    reportVisible(1);
    expect(overlay()).toHaveAttribute('data-expanded', 'true');
    expect(panel()).toHaveAttribute('data-expanded', 'true');
    reportVisible(0.5);
    expect(panel()).not.toHaveAttribute('data-expanded');
    expectHooksMatchSpec(document.body, 'DRAWER', { slots: ['panel'] });
  });

  it('UIC-DRAWER-5.2 stacks a nested drawer above its parent and closes only the top one', async () => {
    render(
      <Page>
        <DrawerTrigger>
          <Button>Sort</Button>
          <Drawer title="Sort" position="bottom">
            Newest first
          </Drawer>
        </DrawerTrigger>
      </Page>,
    );
    await open();
    await open('Sort');
    const [outer, inner] = [...document.querySelectorAll<HTMLElement>('.ui-drawer')];
    expect(outer).toHaveAttribute('data-stack-index', '0');
    expect(outer).toHaveAttribute('data-has-descendants', 'true');
    expect(inner).toHaveAttribute('data-stack-index', '1');
    expect(inner).not.toHaveAttribute('data-has-descendants');
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(document.querySelectorAll('.ui-drawer')).toHaveLength(1);
    expect(overlay()).not.toHaveAttribute('data-has-descendants');
    // Focus returns in an animation frame once the top drawer has left; allow for a busy machine.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sort' })).toHaveFocus(), {
      timeout: 3000,
    });
  });
});
