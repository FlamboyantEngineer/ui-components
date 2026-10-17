import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { Button as AriaButton, DialogTrigger } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Portal, PortalContainerProvider } from '../portal/portal.js';
import { Modal, isModalPrimaryShortcut, type ModalProps } from './modal.js';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

type HarnessProps = Omit<ModalProps, 'isOpen' | 'title'> & {
  title?: ReactNode;
  initiallyOpen?: boolean;
  before?: ReactNode;
};

/** A trigger button and a controlled modal; the modal reports closes through onOpenChange. */
function Harness({
  title = 'Rename',
  initiallyOpen = false,
  before,
  onOpenChange,
  ...props
}: HarnessProps) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      {before}
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Modal
        {...props}
        title={title}
        isOpen={open}
        onOpenChange={(next) => {
          onOpenChange?.(next);
          setOpen(next);
        }}
      />
    </>
  );
}

async function openHarness(props: HarnessProps = {}) {
  const view = render(<Harness {...props} />);
  await userEvent.click(screen.getByRole('button', { name: 'Open' }));
  const dialog = await screen.findByRole(props.role ?? 'dialog');
  return { ...view, dialog, trigger: screen.getByRole('button', { name: 'Open', hidden: true }) };
}

const overlay = () => document.querySelector<HTMLElement>('.ui-modal');

describe('Modal', () => {
  describe('overlay', () => {
    it('UIC-MODAL-1.1 renders nothing while closed and the overlay, panel and dialog while open', async () => {
      const { container, dialog } = await openHarness({ children: <p>Body</p> });
      expect(overlay()?.parentElement).toBe(document.body);
      expect(container.querySelector('.ui-modal')).toBeNull();
      expect(dialog).toHaveClass('ui-modal__dialog');
      expect(dialog.parentElement).toHaveClass('ui-modal__panel');
      expect(dialog.parentElement?.parentElement).toBe(overlay());
      expectHooksMatchSpec(document.body, 'MODAL', {
        slots: ['panel', 'dialog', 'header', 'heading', 'title', 'body'],
      });
    });

    it('UIC-MODAL-1.1 reports closes, opens uncontrolled from defaultOpen and follows a DialogTrigger', async () => {
      const onOpenChange = vi.fn();
      const { unmount } = render(
        <Modal title="Draft" defaultOpen onOpenChange={onOpenChange}>
          Body
        </Modal>,
      );
      expect(screen.getByRole('dialog', { name: 'Draft' })).toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.queryByRole('dialog')).toBeNull();
      unmount();

      render(
        <DialogTrigger>
          <AriaButton>Details</AriaButton>
          <Modal title="Details" cancelAction={{ label: 'Done' }}>
            Body
          </Modal>
        </DialogTrigger>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Details' }));
      expect(await screen.findByRole('dialog', { name: 'Details' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Done' }));
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('UIC-MODAL-1.2 covers the viewport on the modal layer and honours provider z-indexes', async () => {
      await openHarness();
      const root = overlay();
      expect(root).toHaveAttribute('data-layer', 'modal');
      expect(root?.style.position).toBe('fixed');
      expect(root?.style.zIndex).toBe('120');
      expect(root?.style.inset).toMatch(/^0(px)?$/);
    });

    it('UIC-MODAL-1.2 applies a provider layer z-index', () => {
      render(
        <PortalContainerProvider layerZIndex={{ modal: 900 }}>
          <Modal title="Layered" isOpen>
            Body
          </Modal>
        </PortalContainerProvider>,
      );
      expect(overlay()?.style.zIndex).toBe('900');
    });

    it('UIC-MODAL-1.2 stacks a modal opened from a modal above it, below the tooltip and toast layers', async () => {
      function Nested() {
        const [inner, setInner] = useState(false);
        return (
          <Modal title="Outer" isOpen>
            <button type="button" onClick={() => setInner(true)}>
              More
            </button>
            <Modal title="Inner" isOpen={inner} onOpenChange={setInner}>
              <Portal layer="toast">Saved</Portal>
              <Portal layer="tooltip">Hint</Portal>
            </Modal>
          </Modal>
        );
      }
      render(<Nested />);
      await userEvent.click(screen.getByRole('button', { name: 'More' }));
      await screen.findByRole('dialog', { name: 'Inner' });
      const overlays = [...document.querySelectorAll<HTMLElement>('body > .ui-modal')];
      expect(overlays).toHaveLength(2);
      const [outer, inner] = overlays as [HTMLElement, HTMLElement];
      expect(within(outer).getByRole('heading', { hidden: true })).toHaveTextContent('Outer');
      expect(within(inner).getByRole('heading')).toHaveTextContent('Inner');
      expect(outer.compareDocumentPosition(inner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(Number(inner.style.zIndex)).toBe(Number(outer.style.zIndex));
      for (const layer of ['tooltip', 'toast']) {
        const portal = document.querySelector<HTMLElement>(`.ui-portal[data-layer="${layer}"]`);
        expect(Number(portal?.style.zIndex)).toBeGreaterThan(Number(inner.style.zIndex));
      }
    });

    it('UIC-MODAL-1.3 hides the page from assistive technology while open', async () => {
      const { container } = await openHarness({ before: <p>Page text</p> });
      expect(container.closest('[aria-hidden="true"], [inert]')).not.toBeNull();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(container.closest('[aria-hidden="true"], [inert]')).toBeNull());
    });

    it('UIC-MODAL-1.4 publishes tone, size and body layout with defaults', () => {
      const { rerender } = render(
        <Modal title="Plain" isOpen>
          Body
        </Modal>,
      );
      expect(overlay()).toHaveAttribute('data-tone', 'neutral');
      expect(overlay()).toHaveAttribute('data-size', 'md');
      expect(overlay()).toHaveAttribute('data-body-layout', 'block');
      for (const size of ['sm', 'md', 'lg', 'xl', 'full'] as const) {
        rerender(
          <Modal title="Sized" isOpen size={size} tone="danger" bodyLayout="column">
            Body
          </Modal>,
        );
        expect(overlay()).toHaveAttribute('data-size', size);
        expect(overlay()).toHaveAttribute('data-tone', 'danger');
        expect(overlay()).toHaveAttribute('data-body-layout', 'column');
        expectHooksMatchSpec(document.body, 'MODAL');
      }
    });
  });

  describe('dismissal', () => {
    it('UIC-MODAL-2.1 closes on Escape unless keyboard dismissal is disabled', async () => {
      const onOpenChange = vi.fn();
      await openHarness({ onOpenChange });
      await userEvent.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).toBeNull();

      render(
        <Modal title="Sticky" isOpen isKeyboardDismissDisabled onOpenChange={onOpenChange}>
          <button type="button">Inside</button>
        </Modal>,
      );
      await userEvent.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('dialog', { name: 'Sticky' })).toBeInTheDocument();
    });

    it('UIC-MODAL-2.1 leaves Escape to content that handles it and closes only the topmost modal', async () => {
      const outerChange = vi.fn();
      function Nested() {
        const [inner, setInner] = useState(false);
        return (
          <Modal title="Outer" isOpen onOpenChange={outerChange}>
            <input
              aria-label="Search"
              onKeyDown={(event) => {
                if (event.key === 'Escape') event.stopPropagation();
              }}
            />
            <button type="button" onClick={() => setInner(true)}>
              More
            </button>
            <Modal title="Inner" isOpen={inner} onOpenChange={setInner}>
              <button type="button">Inner field</button>
            </Modal>
          </Modal>
        );
      }
      render(<Nested />);
      await userEvent.click(screen.getByRole('button', { name: 'More' }));
      expect(await screen.findByRole('dialog', { name: 'Inner' })).toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('dialog', { name: 'Inner' })).toBeNull();
      expect(outerChange).not.toHaveBeenCalled();
      const search = screen.getByRole('textbox', { name: 'Search' });
      search.focus();
      await userEvent.keyboard('{Escape}');
      expect(outerChange).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: 'Outer' })).toBeInTheDocument();
    });

    it('UIC-MODAL-2.2 closes on an outside press only when dismissable, and not after a drag from inside', async () => {
      const onOpenChange = vi.fn();
      const { unmount } = render(
        <Modal title="Fixed" isOpen onOpenChange={onOpenChange}>
          Body
        </Modal>,
      );
      await userEvent.click(overlay() as HTMLElement);
      expect(onOpenChange).not.toHaveBeenCalled();
      unmount();

      render(
        <Modal title="Loose" isOpen isDismissable onOpenChange={onOpenChange}>
          <p>Body</p>
        </Modal>,
      );
      const dialog = screen.getByRole('dialog');
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: dialog },
        { keys: '[/MouseLeft]', target: overlay() as HTMLElement },
      ]);
      expect(onOpenChange).not.toHaveBeenCalled();
      await userEvent.click(overlay() as HTMLElement);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('UIC-MODAL-2.3 refuses every dismissal while dismissal is disabled', async () => {
      const onOpenChange = vi.fn();
      render(
        <Modal
          title="Uploading"
          isOpen
          isDismissable
          isDismissDisabled
          showCloseButton
          onOpenChange={onOpenChange}
          primaryAction={{ label: 'Finish', onPress: (close) => close() }}
        >
          Body
        </Modal>,
      );
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
      await userEvent.keyboard('{Escape}');
      await userEvent.click(overlay() as HTMLElement);
      expect(onOpenChange).not.toHaveBeenCalled();
      await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    it('UIC-MODAL-2.4 lets the caller refuse an Escape or an outside press', async () => {
      const onOpenChange = vi.fn();
      let keep = true;
      const shouldCloseOnEscape = vi.fn(() => !keep);
      const shouldCloseOnInteractOutside = vi.fn(() => !keep);
      render(
        <>
          <button type="button" data-testid="outside">
            Outside
          </button>
          <Modal
            title="Draft"
            isOpen
            isDismissable
            onOpenChange={onOpenChange}
            shouldCloseOnEscape={shouldCloseOnEscape}
            shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
          >
            <input aria-label="Text" />
          </Modal>
        </>,
      );
      await userEvent.keyboard('{Escape}');
      expect(shouldCloseOnEscape).toHaveBeenCalledTimes(1);
      await userEvent.click(overlay() as HTMLElement);
      expect(shouldCloseOnInteractOutside).toHaveBeenCalledWith(overlay());
      expect(onOpenChange).not.toHaveBeenCalled();
      keep = false;
      screen.getByRole('textbox', { name: 'Text' }).focus();
      await userEvent.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('UIC-MODAL-2.4 asks nothing while a dismissal is refused anyway', async () => {
      const shouldCloseOnEscape = vi.fn(() => true);
      render(
        <Modal
          title="Sticky"
          isOpen
          isKeyboardDismissDisabled
          shouldCloseOnEscape={shouldCloseOnEscape}
        >
          <input aria-label="Text" />
        </Modal>,
      );
      await userEvent.keyboard('{Escape}');
      expect(shouldCloseOnEscape).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: 'Sticky' })).toBeInTheDocument();
    });
  });

  describe('exit', () => {
    it('UIC-MODAL-1.5 calls onExitComplete once the dialog has closed, not when removed open', async () => {
      const onExitComplete = vi.fn();
      await openHarness({ onExitComplete });
      expect(onExitComplete).not.toHaveBeenCalled();
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(onExitComplete).toHaveBeenCalledTimes(1);

      const removed = vi.fn();
      const { unmount } = render(<Modal title="Open" isOpen onExitComplete={removed} />);
      unmount();
      expect(removed).not.toHaveBeenCalled();
    });
  });

  describe('focus', () => {
    it('UIC-MODAL-3.1 focuses the first body field, else the footer, else the dialog', async () => {
      const first = await openHarness({
        children: (
          <>
            <p>Intro</p>
            <input aria-label="Name" />
          </>
        ),
        primaryAction: { label: 'Save' },
      });
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
      first.unmount();

      const second = await openHarness({
        children: <p>Text only</p>,
        primaryAction: { label: 'Save' },
      });
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
      second.unmount();

      const third = await openHarness({ children: <p>Nothing to focus</p> });
      expect(third.dialog).toHaveFocus();
    });

    it('UIC-MODAL-3.1 lets autoFocus and initialFocus choose the target', async () => {
      const first = await openHarness({
        children: (
          <>
            <input aria-label="First" />
            <input aria-label="Second" autoFocus />
          </>
        ),
      });
      expect(screen.getByRole('textbox', { name: 'Second' })).toHaveFocus();
      first.unmount();

      const second = await openHarness({
        children: <input aria-label="Field" />,
        primaryAction: { label: 'Delete', autoFocus: true },
      });
      expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus();
      second.unmount();

      const third = await openHarness({
        children: <input aria-label="Field" />,
        initialFocus: 'dialog',
      });
      expect(third.dialog).toHaveFocus();
    });

    it('UIC-MODAL-3.2 wraps Tab inside the dialog and pulls outside focus back', async () => {
      const { trigger } = await openHarness({
        children: (
          <>
            <button type="button">First</button>
            <button type="button">Second</button>
          </>
        ),
        primaryAction: { label: 'Save' },
      });
      const firstButton = screen.getByRole('button', { name: 'First' });
      const save = screen.getByRole('button', { name: 'Save' });
      expect(firstButton).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
      save.focus();
      await userEvent.tab();
      expect(firstButton).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(save).toHaveFocus();
      act(() => trigger.focus());
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    });

    it('UIC-MODAL-3.3 returns focus to the trigger on close, and into the modal beneath', async () => {
      const { trigger } = await openHarness({ primaryAction: { label: 'Save' } });
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(trigger).toHaveFocus());

      function Nested() {
        const [inner, setInner] = useState(false);
        return (
          <Modal title="Outer" isOpen>
            <button type="button" onClick={() => setInner(true)}>
              More
            </button>
            <Modal title="Inner" isOpen={inner} onOpenChange={setInner} cancelAction={{}}>
              Inner body
            </Modal>
          </Modal>
        );
      }
      render(<Nested />);
      const more = screen.getByRole('button', { name: 'More' });
      await userEvent.click(more);
      await screen.findByRole('dialog', { name: 'Inner' });
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(more).toHaveFocus());
    });
  });

  describe('header and body', () => {
    it('UIC-MODAL-4.1 names the dialog by its heading or aria-label and describes it', async () => {
      const { dialog, unmount } = await openHarness({
        title: 'Rename file',
        description: 'Report.pdf keeps its contents.',
      });
      const heading = screen.getByRole('heading', { level: 2, name: 'Rename file' });
      expect(heading).toHaveClass('ui-modal__title');
      expect(dialog).toHaveAccessibleName('Rename file');
      expect(dialog).toHaveAccessibleDescription('Report.pdf keeps its contents.');
      unmount();

      render(
        <>
          <p id="caller-description">Described elsewhere</p>
          <Modal
            title="Visible title"
            aria-label="Spoken name"
            aria-describedby="caller-description"
            role="alertdialog"
            isOpen
          >
            Body
          </Modal>
        </>,
      );
      const alert = screen.getByRole('alertdialog');
      expect(alert).toHaveAccessibleName('Spoken name');
      expect(alert).toHaveAttribute('aria-describedby', 'caller-description');
    });

    it('UIC-MODAL-4.2 places header actions after the title and draws an optional close button', async () => {
      const onOpenChange = vi.fn();
      render(
        <UiProvider strings={{ close: 'Shut' }}>
          <Modal
            title="Import"
            isOpen
            onOpenChange={onOpenChange}
            showCloseButton
            headerActions={<span data-testid="steps">Step 1 of 3</span>}
          >
            Body
          </Modal>
        </UiProvider>,
      );
      const header = document.querySelector('.ui-modal__header') as HTMLElement;
      expect([...header.children].map((child) => child.className)).toEqual([
        'ui-modal__heading',
        'ui-modal__header-actions',
        expect.stringContaining('ui-modal__close'),
      ]);
      expect(screen.getByTestId('steps').parentElement).toHaveClass('ui-modal__header-actions');
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Import');
      expectHooksMatchSpec(document.body, 'MODAL', { slots: ['header-actions', 'close'] });
      await userEvent.click(screen.getByRole('button', { name: 'Shut' }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('UIC-MODAL-4.3 renders the body and passes close to function children', async () => {
      const onOpenChange = vi.fn();
      render(
        <Modal title="Pick" isOpen onOpenChange={onOpenChange}>
          {({ close }) => (
            <button type="button" onClick={close}>
              Use Lemon
            </button>
          )}
        </Modal>,
      );
      const body = document.querySelector('.ui-modal__body');
      expect(body).toContainElement(screen.getByRole('button', { name: 'Use Lemon' }));
      await userEvent.click(screen.getByRole('button', { name: 'Use Lemon' }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('footer', () => {
    it('UIC-MODAL-5.1 draws Cancel, secondary and primary in order with their defaults', async () => {
      const { unmount } = render(
        <Modal
          title="Settings"
          isOpen
          tone="danger"
          footerContent={<span>Unsaved changes</span>}
          secondaryAction={{ label: 'Discard', className: 'caller-discard' }}
          primaryAction={{ label: 'Save', id: 'save-action', 'data-command': 'save' }}
          cancelAction={{
            id: 'cancel-action',
            className: 'caller-cancel',
            'data-command': 'cancel',
          }}
        >
          Body
        </Modal>,
      );
      const buttons = within(
        document.querySelector('.ui-modal__actions') as HTMLElement,
      ).getAllByRole('button');
      expect(buttons.map((button) => button.textContent)).toEqual(['Cancel', 'Discard', 'Save']);
      const [cancel, discard, save] = buttons as [HTMLElement, HTMLElement, HTMLElement];
      expect(cancel).toHaveClass('ui-button', 'ui-modal__cancel', 'caller-cancel');
      expect(cancel).toHaveAttribute('data-variant', 'secondary');
      expect(cancel).toHaveAttribute('id', 'cancel-action');
      expect(discard).toHaveClass('ui-modal__secondary', 'caller-discard');
      expect(discard).toHaveAttribute('data-variant', 'secondary');
      expect(save).toHaveClass('ui-modal__primary');
      expect(save).toHaveAttribute('data-variant', 'danger');
      expect(save).toHaveAttribute('data-size', 'md');
      expect(save).toHaveAttribute('id', 'save-action');
      expect(save).toHaveAttribute('data-command', 'save');
      expect(screen.getByText('Unsaved changes').parentElement).toHaveClass(
        'ui-modal__footer-content',
      );
      expectHooksMatchSpec(document.body, 'MODAL', {
        slots: ['footer', 'footer-content', 'actions', 'cancel', 'secondary', 'primary'],
        callerAttributes: ['data-command'],
      });
      unmount();

      render(
        <UiProvider strings={{ cancel: 'Back' }}>
          <Modal
            title="Plain"
            isOpen
            secondaryAction={{ label: 'Remove', variant: 'danger' }}
            primaryAction={{ label: 'Apply' }}
          />
        </UiProvider>,
      );
      expect(screen.getByRole('button', { name: 'Apply' })).toHaveAttribute(
        'data-variant',
        'primary',
      );
      expect(screen.getByRole('button', { name: 'Remove' })).toHaveAttribute(
        'data-variant',
        'danger',
      );
      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('UIC-MODAL-5.1 hides, shows alone or replaces the built-in buttons', async () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(
        <Modal
          title="Notice"
          isOpen
          onOpenChange={onOpenChange}
          cancelAction={null}
          primaryAction={{ label: 'Got it' }}
        />,
      );
      expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();

      rerender(
        <Modal
          title="Notice"
          isOpen
          onOpenChange={onOpenChange}
          cancelAction={{ label: 'Close' }}
        />,
      );
      expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Close']);
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onOpenChange).toHaveBeenCalledWith(false);

      rerender(
        <Modal
          title="Notice"
          isOpen
          primaryAction={{ label: 'Hidden' }}
          actions={<button type="button">Custom</button>}
        />,
      );
      expect(screen.getByRole('button', { name: 'Custom' }).parentElement).toHaveClass(
        'ui-modal__actions',
      );
      expect(screen.queryByRole('button', { name: 'Hidden' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();

      rerender(<Modal title="Notice" isOpen />);
      expect(document.querySelector('.ui-modal__footer')).toBeNull();
    });

    it('UIC-MODAL-5.2 passes close to the action and keeps it pending until its promise settles', async () => {
      const task = deferred();
      const onPress = vi.fn((close: () => void) => task.promise.then(close));
      const onOpenChange = vi.fn();
      render(
        <Modal
          title="Save"
          isOpen
          onOpenChange={onOpenChange}
          secondaryAction={{ label: 'Draft' }}
          primaryAction={{ label: 'Save', pendingLabel: 'Saving', onPress }}
        />,
      );
      const save = screen.getByRole('button', { name: 'Save' });
      await userEvent.click(save);
      await userEvent.click(save);
      act(() => save.click());
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(save).toHaveAttribute('data-pending', 'true');
      expect(within(save).getByRole('progressbar', { name: 'Saving' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Draft' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-busy');
      await act(async () => {
        task.resolve();
        await task.promise;
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('UIC-MODAL-5.2 refuses duplicate requests issued in the same turn', async () => {
      const task = deferred();
      const onPress = vi.fn(() => task.promise);
      render(<Modal title="Save" isOpen primaryAction={{ label: 'Save', onPress }} />);
      const save = screen.getByRole('button', { name: 'Save' });
      const dialog = screen.getByRole('dialog');
      act(() => {
        save.click();
        fireEvent.keyDown(dialog, { key: 'Enter', ctrlKey: true });
        fireEvent.keyDown(dialog, { key: 'Enter', ctrlKey: true });
      });
      expect(onPress).toHaveBeenCalledTimes(1);
      await act(async () => {
        task.resolve();
        await task.promise;
      });
      expect(save).not.toHaveAttribute('data-pending');
    });

    it('UIC-MODAL-5.2 never runs a disabled action and honours outside pending', async () => {
      const onPress = vi.fn();
      const { rerender } = render(
        <Modal title="Save" isOpen primaryAction={{ label: 'Save', onPress, isDisabled: true }} />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onPress).not.toHaveBeenCalled();

      rerender(
        <Modal
          title="Save"
          isOpen
          primaryAction={{ label: 'Save', onPress, isPending: true, focusableWhenDisabled: true }}
        />,
      );
      const save = screen.getByRole('button', { name: 'Save' });
      expect(save).toHaveAttribute('data-pending', 'true');
      await userEvent.click(save);
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      expect(onPress).not.toHaveBeenCalled();
    });

    it('UIC-MODAL-5.3 announces a failed action and clears it on the next attempt', async () => {
      let attempts = 0;
      const { rerender } = render(
        <Modal
          title="Save"
          isOpen
          primaryAction={{
            label: 'Save',
            onPress: async () => {
              attempts += 1;
              if (attempts === 1) throw new Error('Save refused.');
            },
          }}
        />,
      );
      const save = screen.getByRole('button', { name: 'Save' });
      await act(async () => userEvent.click(save));
      expect(screen.getByRole('alert')).toHaveTextContent('Save refused.');
      expect(save).not.toHaveAttribute('data-pending');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await act(async () => userEvent.click(save));
      expect(attempts).toBe(2);
      expect(screen.queryByRole('alert')).toBeNull();

      rerender(
        <UiProvider strings={{ actionFailed: 'Something went wrong.' }}>
          <Modal
            title="Save"
            isOpen
            primaryAction={{ label: 'Retry', onPress: () => Promise.reject('offline') }}
          />
        </UiProvider>,
      );
      await act(async () => userEvent.click(screen.getByRole('button', { name: 'Retry' })));
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
    });

    it('UIC-MODAL-5.4 keeps a late settlement out of a later opening', async () => {
      const requests = [deferred(), deferred(), deferred()];
      let attempts = 0;
      const onOpenChange = vi.fn();
      function Reopen() {
        const [open, setOpen] = useState(true);
        return (
          <>
            <button type="button" onClick={() => setOpen((value) => !value)}>
              Toggle
            </button>
            <Modal
              title="Save"
              isOpen={open}
              onOpenChange={(next) => {
                onOpenChange(next);
                setOpen(next);
              }}
              primaryAction={{
                label: 'Save',
                onPress: (close) => {
                  const request = requests[attempts] as ReturnType<typeof deferred>;
                  attempts += 1;
                  return request.promise.then(close);
                },
              }}
            />
          </>
        );
      }
      render(<Reopen />);
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('dialog')).toBeNull();
      onOpenChange.mockClear();
      await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      const save = await screen.findByRole('button', { name: 'Save' });
      expect(save).not.toHaveAttribute('data-pending');
      await userEvent.click(save);
      expect(attempts).toBe(2);
      await act(async () => {
        (requests[0] as ReturnType<typeof deferred>).reject(new Error('Old save refused.'));
        await Promise.resolve();
      });
      expect(screen.queryByRole('alert')).toBeNull();
      expect(save).toHaveAttribute('data-pending', 'true');
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      expect(attempts).toBe(2);
      expect(onOpenChange).not.toHaveBeenCalled();
      await act(async () => {
        (requests[1] as ReturnType<typeof deferred>).resolve();
        await Promise.resolve();
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('UIC-MODAL-5.4 does not let an earlier opening close a later one', async () => {
      const first = deferred();
      let attempts = 0;
      function Reopen() {
        const [open, setOpen] = useState(true);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>
              Reopen
            </button>
            <Modal
              title="Save"
              isOpen={open}
              onOpenChange={setOpen}
              primaryAction={{
                label: 'Save',
                onPress: (close) => {
                  attempts += 1;
                  return attempts === 1 ? first.promise.then(close) : undefined;
                },
              }}
            />
          </>
        );
      }
      render(<Reopen />);
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      await userEvent.keyboard('{Escape}');
      await userEvent.click(screen.getByRole('button', { name: 'Reopen' }));
      await screen.findByRole('dialog');
      await act(async () => {
        first.resolve();
        await first.promise;
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('UIC-MODAL-5.5 shows one footer message, errors first, re-inserted when its tone changes', () => {
      const { rerender } = render(
        <Modal
          title="Save"
          isOpen
          status="Choose a destination."
          primaryAction={{ label: 'Save' }}
        />,
      );
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Choose a destination.');
      expect(status).toHaveClass('ui-modal__message');
      expect(status).toHaveAttribute('data-tone', 'neutral');
      rerender(
        <Modal
          title="Save"
          isOpen
          status="Choose a destination."
          error="Save failed. Try again."
          primaryAction={{ label: 'Save' }}
        />,
      );
      const alert = screen.getByRole('alert');
      expect(status.isConnected).toBe(false);
      expect(alert).toHaveTextContent('Save failed. Try again.');
      expect(alert).toHaveAttribute('data-tone', 'danger');
      expect(screen.queryByRole('status')).toBeNull();
      expectHooksMatchSpec(document.body, 'MODAL', { slots: ['message'] });
      rerender(
        <Modal
          title="Save"
          isOpen
          status="Choose a destination."
          primaryAction={{ label: 'Save' }}
        />,
      );
      expect(alert.isConnected).toBe(false);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('keyboard primary action', () => {
    it('UIC-MODAL-6.1 accepts Enter with exactly one of Control or Command', () => {
      const base = { key: 'Enter', ctrlKey: true, metaKey: false, altKey: false, shiftKey: false };
      expect(isModalPrimaryShortcut(base)).toBe(true);
      expect(isModalPrimaryShortcut({ ...base, ctrlKey: false, metaKey: true })).toBe(true);
      expect(isModalPrimaryShortcut({ ...base, ctrlKey: false })).toBe(false);
      expect(isModalPrimaryShortcut({ ...base, metaKey: true })).toBe(false);
      expect(isModalPrimaryShortcut({ ...base, altKey: true })).toBe(false);
      expect(isModalPrimaryShortcut({ ...base, shiftKey: true })).toBe(false);
      expect(isModalPrimaryShortcut({ ...base, repeat: true })).toBe(false);
      expect(isModalPrimaryShortcut({ ...base, isComposing: true })).toBe(false);
      expect(isModalPrimaryShortcut({ ...base, defaultPrevented: true })).toBe(false);
      expect(isModalPrimaryShortcut({ ...base, key: 'Escape' })).toBe(false);
    });

    it('UIC-MODAL-6.1 runs the enabled primary action, not plain Enter or a disabled one', async () => {
      const onPress = vi.fn();
      const { rerender } = render(
        <Modal title="Name" isOpen primaryAction={{ label: 'Create', onPress, isDisabled: true }}>
          <input aria-label="Name" />
        </Modal>,
      );
      expect(screen.getByRole('textbox')).toHaveFocus();
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      expect(onPress).not.toHaveBeenCalled();
      rerender(
        <Modal title="Name" isOpen primaryAction={{ label: 'Create', onPress }}>
          <input aria-label="Name" />
        </Modal>,
      );
      await userEvent.keyboard('{Enter}');
      expect(onPress).not.toHaveBeenCalled();
      await userEvent.keyboard('{Control>}{Shift>}{Enter}{/Shift}{/Control}');
      expect(onPress).not.toHaveBeenCalled();
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      expect(onPress).toHaveBeenCalledTimes(1);
      await userEvent.keyboard('{Meta>}{Enter}{/Meta}');
      expect(onPress).toHaveBeenCalledTimes(2);
    });

    it('UIC-MODAL-6.1 leaves the shortcut to multiline editors and custom action bars', async () => {
      const onPress = vi.fn();
      const { rerender } = render(
        <Modal title="Note" isOpen primaryAction={{ label: 'Post', onPress }}>
          <textarea aria-label="Text" />
          <div contentEditable suppressContentEditableWarning aria-label="Rich" role="textbox">
            Hello
          </div>
          <div role="textbox" aria-multiline="true" tabIndex={0} aria-label="Lines" />
        </Modal>,
      );
      for (const name of ['Text', 'Rich', 'Lines']) {
        fireEvent.keyDown(screen.getByRole('textbox', { name }), { key: 'Enter', ctrlKey: true });
      }
      expect(onPress).not.toHaveBeenCalled();
      rerender(
        <Modal
          title="Note"
          isOpen
          primaryAction={{ label: 'Post', onPress }}
          actions={<button type="button">Send</button>}
        >
          <input aria-label="Field" />
        </Modal>,
      );
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Field' }), {
        key: 'Enter',
        ctrlKey: true,
      });
      expect(onPress).not.toHaveBeenCalled();
    });

    it('UIC-MODAL-6.1 hears popovers opened from the modal, and a nested modal handles its own keys', async () => {
      const outer = vi.fn();
      function Nested() {
        const [inner, setInner] = useState(false);
        return (
          <Modal title="Outer" isOpen primaryAction={{ label: 'Apply', onPress: outer }}>
            <Portal layer="dropdown">
              <button type="button">Lemon</button>
            </Portal>
            <button type="button" onClick={() => setInner(true)}>
              More
            </button>
            <Modal title="Inner" isOpen={inner} onOpenChange={setInner}>
              <input aria-label="Inner field" />
            </Modal>
          </Modal>
        );
      }
      render(<Nested />);
      fireEvent.keyDown(screen.getByRole('button', { name: 'Lemon' }), {
        key: 'Enter',
        ctrlKey: true,
      });
      expect(outer).toHaveBeenCalledTimes(1);
      await userEvent.click(screen.getByRole('button', { name: 'More' }));
      const field = await screen.findByRole('textbox', { name: 'Inner field' });
      fireEvent.keyDown(field, { key: 'Enter', ctrlKey: true });
      expect(outer).toHaveBeenCalledTimes(1);
    });
  });

  it('UIC-MODAL-7.1 appends the caller class, forwards data attributes and puts id on the dialog', () => {
    render(
      <Modal
        title="Hooks"
        isOpen
        className="caller"
        id="hooks-dialog"
        data-testid="modal-root"
        data-tone="loud"
        data-category="spreadsheet"
      >
        Body
      </Modal>,
    );
    const root = screen.getByTestId('modal-root');
    expect(root).toHaveClass('ui-modal', 'caller');
    expect(root).toHaveAttribute('data-tone', 'neutral');
    expect(root).toHaveAttribute('data-category', 'spreadsheet');
    expect(screen.getByRole('dialog')).toHaveAttribute('id', 'hooks-dialog');
    expectHooksMatchSpec(document.body, 'MODAL', { callerAttributes: ['data-category'] });
  });
});
