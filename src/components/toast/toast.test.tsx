import { StrictMode, useEffect, useState, type ReactNode } from 'react';
import { HelpGlyph } from '../../core/glyphs.js';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { PortalContainerProvider, PortalHost } from '../portal/portal.js';
import { ToastList, ToastRegion, createToastQueue } from './toast.js';

const tones = ['info', 'success', 'warning', 'danger'] as const;
const toneGlyphs = { info: 'info', success: 'success', warning: 'warning', danger: 'error' };

const titles = () =>
  [...document.querySelectorAll('.ui-toast__title')].map((node) => node.textContent);

/**
 * Fake timers with a user-event session. Testing Library drains a zero timeout after each user-event
 * call and advances it only under Jest's fake timers, so it is pointed at Vitest's clock here.
 */
function useFakeClock() {
  vi.useFakeTimers();
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

/** The body of a same-origin iframe, a document with its own element constructors. */
function requireFrameBody(frame: HTMLIFrameElement): HTMLElement {
  const body = frame.contentDocument?.body;
  if (!body) throw new Error('The frame has no body');
  return body;
}

describe('ToastQueue', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('UIC-TOAST-1.1 adds toasts newest first and limits how many show', async () => {
    const queue = createToastQueue({ maxVisibleToasts: 2, defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    let firstKey = '';
    let lastKey = '';
    act(() => {
      firstKey = queue.add({ title: 'Apple saved' });
      queue.add({ title: 'Pear saved' });
      lastKey = queue.add({ title: 'Plum saved' });
    });
    expect(typeof firstKey).toBe('string');
    expect(firstKey).not.toBe('');
    expect(titles()).toEqual(['Plum saved', 'Pear saved']);
    act(() => queue.close(lastKey));
    expect(titles()).toEqual(['Pear saved', 'Apple saved']);
  });

  it('UIC-TOAST-1.2 closes after the default or given timeout, or never with zero', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const queue = createToastQueue();
    expect(queue.defaultTimeout).toBe(5000);
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: 'Default' }, { onClose });
      queue.add({ title: 'Short' }, { timeout: 1000 });
      queue.add({ title: 'Sticky' }, { timeout: 0 });
    });
    await advance(1000);
    expect(titles()).toEqual(['Sticky', 'Default']);
    await advance(3999);
    expect(titles()).toEqual(['Sticky', 'Default']);
    await advance(1);
    expect(titles()).toEqual(['Sticky']);
    expect(onClose).toHaveBeenCalledTimes(1);
    await advance(60000);
    expect(titles()).toEqual(['Sticky']);
  });

  it('UIC-TOAST-1.2 pauses every timer while the region is hovered or focused', async () => {
    const user = useFakeClock();
    const queue = createToastQueue({ defaultTimeout: 5000 });
    render(
      <>
        <button type="button">Outside</button>
        <ToastRegion queue={queue} />
      </>,
    );
    act(() => {
      queue.add({ title: 'Paused', action: { label: 'Open', onAction: () => {} } });
    });
    const region = screen.getByRole('region');
    await advance(2000);
    await user.hover(region);
    await advance(10000);
    expect(titles()).toEqual(['Paused']);
    await user.unhover(region);
    await advance(2999);
    expect(titles()).toEqual(['Paused']);
    await advance(1);
    expect(titles()).toEqual([]);

    act(() => {
      queue.add({ title: 'Focused', action: { label: 'Open', onAction: () => {} } });
    });
    await advance(1000);
    act(() => screen.getByRole('button', { name: 'Open' }).focus());
    await advance(10000);
    expect(titles()).toEqual(['Focused']);
    act(() => screen.getByRole('button', { name: 'Outside' }).focus());
    await advance(3999);
    expect(titles()).toEqual(['Focused']);
    await advance(1);
    expect(titles()).toEqual([]);
  });

  it('UIC-TOAST-1.2 UIC-TOAST-1.5 UIC-TOAST-1.6 keeps a toast updated or added under the pointer paused', async () => {
    const user = useFakeClock();
    const queue = createToastQueue();
    render(<ToastRegion queue={queue} />);
    let key = '';
    let finish: (value: string) => void = () => {};
    const work = new Promise<string>((resolve) => {
      finish = resolve;
    });
    act(() => {
      queue.add({ title: 'Sticky' }, { timeout: 0 });
      key = queue.add({ title: 'Saving', isPending: true });
      queue.promise(work, {
        pending: { title: 'Uploading' },
        success: { title: 'Uploaded' },
        error: { title: 'Failed' },
      });
    });
    const region = screen.getByRole('region');
    await user.hover(region);
    act(() => queue.update(key, { title: 'Saved' }));
    await act(async () => finish('done'));
    act(() => {
      queue.add({ title: 'Fresh' });
    });
    await advance(6000);
    expect(titles()).toEqual(['Fresh', 'Uploaded', 'Saved', 'Sticky']);
    await user.unhover(region);
    await advance(4999);
    expect(titles()).toEqual(['Fresh', 'Uploaded', 'Saved', 'Sticky']);
    await advance(1);
    expect(titles()).toEqual(['Sticky']);
  });

  it('UIC-TOAST-1.2 UIC-TOAST-4.3 pauses while the region itself holds focus', async () => {
    const user = useFakeClock();
    const queue = createToastQueue();
    render(
      <>
        <button type="button">Outside</button>
        <ToastRegion queue={queue} />
      </>,
    );
    act(() => {
      queue.add({ title: 'Landmark' });
    });
    const region = screen.getByRole('region');
    act(() => region.focus());
    expect(region).toHaveAttribute('data-expanded', 'true');
    await advance(10000);
    expect(titles()).toEqual(['Landmark']);
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(region).not.toHaveAttribute('data-expanded');
    await advance(5000);
    expect(titles()).toEqual([]);
  });

  it('UIC-TOAST-1.2 UIC-TOAST-4.3 stops pausing once a focused toast is dismissed', async () => {
    const user = useFakeClock();
    const queue = createToastQueue();
    render(
      <>
        <button type="button">Outside</button>
        <ToastRegion queue={queue} />
      </>,
    );
    const dismissFocused = async () => {
      act(() => screen.getByRole('button', { name: 'Dismiss' }).focus());
      await user.keyboard('{Enter}');
      expect(titles()).toEqual([]);
    };
    const addRunning = async (title: string) => {
      act(() => {
        queue.add({ title });
      });
      expect(screen.getByRole('region')).not.toHaveAttribute('data-expanded');
      await advance(5000);
      expect(titles()).toEqual([]);
    };
    act(() => {
      queue.add({ title: 'First' });
    });
    await dismissFocused();
    await addRunning('Second');

    act(() => screen.getByRole('button', { name: 'Outside' }).focus());
    act(() => {
      queue.add({ title: 'Third' });
    });
    await dismissFocused();
    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
    await addRunning('Fourth');
  });

  it('UIC-TOAST-1.3 replaces a toast with the same id without closing it', async () => {
    vi.useFakeTimers();
    const replacedClose = vi.fn();
    const queue = createToastQueue();
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: 'Upload 1 of 3' }, { id: 'upload', onClose: replacedClose });
      queue.add({ title: 'Other' });
    });
    await advance(4000);
    act(() => {
      queue.add({ title: 'Upload 2 of 3' }, { id: 'upload' });
    });
    expect(titles()).toEqual(['Upload 2 of 3', 'Other']);
    expect(replacedClose).not.toHaveBeenCalled();
    await advance(1000);
    expect(titles()).toEqual(['Upload 2 of 3']);
    await advance(4000);
    expect(titles()).toEqual([]);
  });

  it('UIC-TOAST-1.4 closes one toast or clears all without onClose', () => {
    const onClose = vi.fn();
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    let key = '';
    act(() => {
      key = queue.add({ title: 'First' }, { onClose });
      queue.add({ title: 'Second' }, { onClose });
      queue.add({ title: 'Third' }, { id: 'third', onClose });
    });
    act(() => queue.close(key));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(titles()).toEqual(['Third', 'Second']);
    act(() => queue.clear());
    expect(titles()).toEqual([]);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    act(() => {
      queue.add({ title: 'Third again' }, { id: 'third' });
    });
    expect(titles()).toEqual(['Third again']);
  });
});

describe('ToastRegion', () => {
  it('UIC-TOAST-2.1 portals a named landmark only while it has toasts and keeps focus', () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    const { container } = render(
      <>
        <button type="button">Keep</button>
        <ToastRegion queue={queue} />
      </>,
    );
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    const keep = screen.getByRole('button', { name: 'Keep' });
    act(() => keep.focus());
    act(() => {
      queue.add({ title: 'Saved' });
    });
    const region = screen.getByRole('region', { name: /^1 notification\b/ });
    expect(region).toHaveClass('ui-toast-region');
    expect(container.contains(region)).toBe(false);
    expect(region.parentElement).toBe(document.body);
    expect(region.querySelector('ol.ui-toast-list')).not.toBeNull();
    expect(keep).toHaveFocus();
    act(() => {
      queue.add({ title: 'Saved again' });
    });
    expect(screen.getByRole('region', { name: /^2 notifications/ })).toBe(region);
    expectHooksMatchSpec(document.body, 'TOAST');
  });

  it('UIC-TOAST-2.1 takes a caller landmark name', () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} aria-label="Messages" />);
    act(() => {
      queue.add({ title: 'Saved' });
    });
    expect(screen.getByRole('region', { name: 'Messages' })).toBeInTheDocument();
  });

  it('UIC-TOAST-2.2 makes each toast a labelled alertdialog with a tone-dependent live region', () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ tone: 'info', title: 'Draft saved', description: 'Saved to Report.pdf' });
      queue.add({ tone: 'success', title: 'Sent' });
      queue.add({ tone: 'warning', title: 'Almost full' });
      queue.add({ tone: 'danger', title: 'Upload failed' });
    });
    const info = screen.getByRole('alertdialog', { name: 'Draft saved' });
    expect(info).toHaveAttribute('aria-modal', 'false');
    expect(info).toHaveAttribute('tabindex', '0');
    expect(info).toHaveAccessibleDescription('Saved to Report.pdf');
    const contentRole = (name: string) =>
      screen.getByRole('alertdialog', { name }).querySelector('.ui-toast__content');
    expect(contentRole('Draft saved')).toHaveAttribute('role', 'status');
    expect(contentRole('Sent')).toHaveAttribute('role', 'status');
    expect(contentRole('Almost full')).toHaveAttribute('role', 'alert');
    expect(contentRole('Upload failed')).toHaveAttribute('role', 'alert');
    expect(contentRole('Sent')).toHaveAttribute('aria-atomic', 'true');
  });

  it('UIC-TOAST-2.2 moves focus to the next toast when a focused toast closes', async () => {
    const user = userEvent.setup();
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    let newer = '';
    act(() => {
      queue.add({ title: 'Older' });
      newer = queue.add({ title: 'Newer' });
    });
    await user.tab();
    act(() => screen.getByRole('alertdialog', { name: 'Newer' }).focus());
    act(() => queue.close(newer));
    expect(screen.getByRole('alertdialog', { name: 'Older' })).toHaveFocus();
  });

  it('UIC-TOAST-2.4 stacks the region on the toast layer, above drawers and dialogs', () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: 'Saved' });
    });
    const region = screen.getByRole('region');
    expect(region.style.zIndex).toBe('160');
    expect(region).toHaveAttribute('data-react-aria-top-layer', 'true');
  });

  it('UIC-TOAST-2.4 follows the provider layer z-index and container', () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    const target = document.createElement('div');
    document.body.append(target);
    const { unmount } = render(
      <PortalContainerProvider container={target} layerZIndex={{ toast: 900 }}>
        <ToastRegion queue={queue} />
      </PortalContainerProvider>,
    );
    act(() => {
      queue.add({ title: 'Saved' });
    });
    const region = screen.getByRole('region');
    expect(region.parentElement).toBe(target);
    expect(region.style.zIndex).toBe('900');
    unmount();
    target.remove();
  });

  it('UIC-TOAST-2.4 renders into an iframe body, a container of another window', async () => {
    const user = userEvent.setup();
    const frame = document.body.appendChild(document.createElement('iframe'));
    const body = requireFrameBody(frame);
    expect(body).not.toBeInstanceOf(HTMLElement);
    const queue = createToastQueue({ defaultTimeout: 0 });
    const { unmount } = render(
      <PortalContainerProvider container={body}>
        <ToastRegion queue={queue} />
      </PortalContainerProvider>,
    );
    act(() => {
      queue.add({ title: 'Saved in the frame' });
    });
    const region = within(body).getByRole('region');
    expect(region.parentElement).toBe(body);
    expect(region.style.zIndex).toBe('160');
    expect(within(region).getByText('Saved in the frame')).toBeInTheDocument();
    await user.click(within(region).getByRole('button', { name: 'Dismiss' }));
    expect(within(body).queryByRole('region')).not.toBeInTheDocument();
    unmount();
    frame.remove();
  });

  it('UIC-TOAST-2.4 hydrates a portal host with queued toasts, then shows them', async () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    queue.add({ title: 'Saved' });
    const app = (
      <PortalHost>
        <ToastRegion queue={queue} />
      </PortalHost>
    );
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = renderToString(app);
    const recoverable: unknown[] = [];
    const errors = vi.spyOn(console, 'error');
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(host, app, { onRecoverableError: (error) => recoverable.push(error) });
    });
    expect(recoverable).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    expect(within(host).getByRole('region')).toHaveTextContent('Saved');
    act(() => root?.unmount());
    host.remove();
  });

  it('UIC-TOAST-2.4 renders inside a portal host with its layer override', () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(
      <PortalHost layerZIndex={{ toast: 30 }}>
        <ToastRegion queue={queue} />
      </PortalHost>,
    );
    act(() => {
      queue.add({ title: 'Saved' });
    });
    const region = screen.getByRole('region');
    expect(region.parentElement).toHaveClass('ui-portal-host');
    expect(region.style.zIndex).toBe('30');
  });

  it('UIC-TOAST-2.3 draws a queue in place without a landmark', () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    const key = queue.add({ tone: 'warning', title: 'Disk almost full' });
    const { container } = render(
      <ToastList queue={queue} className="caller" data-testid="stack" />,
    );
    const list = container.firstElementChild as HTMLElement;
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('ui-toast-list', 'caller');
    expect(list).toHaveAttribute('data-testid', 'stack');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(within(list).getByRole('alertdialog', { name: 'Disk almost full' })).toBeInTheDocument();
    act(() => queue.close(key));
    expect(within(list).queryByRole('alertdialog')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'TOAST');
  });
});

describe('Toast', () => {
  it('UIC-TOAST-3.1 publishes the tone and draws its glyph or a custom icon', () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    for (const tone of tones) {
      queue.add({ tone, title: `${tone} title` });
    }
    queue.add({ title: 'Default tone' });
    queue.add({ title: 'Custom', icon: <svg role="img" aria-label="Custom glyph" /> });
    queue.add({ title: 'Glyph', icon: HelpGlyph });
    render(<ToastList queue={queue} />);
    for (const tone of tones) {
      const toast = screen.getByRole('alertdialog', { name: `${tone} title` });
      expect(toast).toHaveClass('ui-toast');
      expect(toast).toHaveAttribute('data-tone', tone);
      const icon = toast.querySelector('.ui-toast__icon');
      expect(icon).toHaveClass('ui-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('data-glyph', toneGlyphs[tone]);
    }
    expect(screen.getByRole('alertdialog', { name: 'Default tone' })).toHaveAttribute(
      'data-tone',
      'info',
    );
    // The icon slot is aria-hidden, so the custom glyph is only found among hidden elements.
    expect(
      screen.getByRole('img', { name: 'Custom glyph', hidden: true }).parentElement,
    ).toHaveClass('ui-toast__icon');
    expect(
      screen.getByRole('alertdialog', { name: 'Glyph' }).querySelector('.ui-toast__icon'),
    ).toHaveAttribute('data-glyph', 'help');
    expectHooksMatchSpec(document.body, 'TOAST', { slots: ['icon', 'content', 'title', 'close'] });
  });

  it('UIC-TOAST-3.2 shows the title and an optional description', () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    queue.add({ title: 'Only title' });
    queue.add({ title: 'With description', description: 'Moved to Lisbon' });
    render(<ToastList queue={queue} />);
    const plain = screen.getByRole('alertdialog', { name: 'Only title' });
    expect(plain.querySelector('.ui-toast__title')).toHaveTextContent('Only title');
    expect(plain.querySelector('.ui-toast__description')).toBeNull();
    const described = screen.getByRole('alertdialog', { name: 'With description' });
    expect(described.querySelector('.ui-toast__description')).toHaveTextContent('Moved to Lisbon');
    expectHooksMatchSpec(document.body, 'TOAST', { slots: ['description'] });
  });

  it('UIC-TOAST-3.3 runs the action and then closes the toast', async () => {
    const onAction = vi.fn();
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: 'Row deleted', action: { label: 'Undo', onAction } });
    });
    const action = screen.getByRole('button', { name: 'Undo' });
    expect(action).toHaveClass('ui-button', 'ui-toast__action');
    expectHooksMatchSpec(document.body, 'TOAST', { slots: ['action'] });
    await userEvent.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('UIC-TOAST-3.4 dismisses with a named icon button', async () => {
    const onClose = vi.fn();
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(
      <UiProvider messages={{ dismiss: 'Close message' }}>
        <ToastRegion queue={queue} />
      </UiProvider>,
    );
    act(() => {
      queue.add({ title: 'Saved' }, { onClose });
    });
    const close = screen.getByRole('button', { name: 'Close message' });
    expect(close).toHaveClass('ui-button', 'ui-toast__close');
    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('UIC-TOAST-3.5 forwards caller classes, ids and data attributes and publishes interaction states', async () => {
    const user = userEvent.setup();
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} className="caller" id="messages" data-test="region" />);
    act(() => {
      queue.add({ title: 'Saved' });
    });
    const region = screen.getByRole('region');
    expect(region).toHaveClass('ui-toast-region', 'caller');
    expect(region).toHaveAttribute('id', 'messages');
    expect(region).toHaveAttribute('data-test', 'region');
    await user.hover(region);
    expect(region).toHaveAttribute('data-hovered', 'true');
    const toast = screen.getByRole('alertdialog', { name: 'Saved' });
    await user.tab();
    act(() => toast.focus());
    expect(toast).toHaveAttribute('data-focused', 'true');
    expect(toast).toHaveAttribute('data-focus-visible', 'true');
    expectHooksMatchSpec(document.body, 'TOAST', { callerAttributes: ['data-test'] });
  });

  it('UIC-TOAST-3.5 forwards a region class, id and data attributes', () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} className="caller" id="alerts" data-test="region" />);
    act(() => {
      queue.add({ tone: 'success', title: 'Saved' });
    });
    const region = screen.getByRole('region');
    expect(region).toHaveClass('ui-toast-region', 'caller');
    expect(region).toHaveAttribute('id', 'alerts');
    expect(region).toHaveAttribute('data-test', 'region');
    expect(document.querySelector('.ui-toast-region')).toBe(region);
    expectHooksMatchSpec(document.body, 'TOAST', { callerAttributes: ['data-test'] });
  });

  it('UIC-TOAST-1.1 refuses a queue that createToastQueue did not make', () => {
    const queue = { ...createToastQueue() };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ToastList queue={queue} />)).toThrow(/createToastQueue/);
    vi.restoreAllMocks();
  });

  it('UIC-TOAST-3.5 forwards a list id and data attributes', () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    queue.add({ title: 'Saved' });
    const { container } = render(<ToastList queue={queue} id="preview" data-testid="list" />);
    const list = container.firstElementChild as HTMLElement;
    expect(list).toHaveAttribute('id', 'preview');
    expect(list).toHaveAttribute('data-testid', 'list');
  });
});

function pointer(
  type: 'pointerDown' | 'pointerMove' | 'pointerUp' | 'pointerCancel',
  target: Element,
  init: PointerEventInit,
) {
  fireEvent[type](target, { pointerId: 3, button: 0, isPrimary: true, ...init });
}

/** Gives every element one running animation until `finish` is called, as an exit would. */
function holdAnimations() {
  let finish = () => {};
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  let isHolding = false;
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: () => (isHolding ? [{ finished }] : []),
  });
  return {
    start: () => {
      isHolding = true;
    },
    finish: async () => {
      await act(async () => {
        finish();
        await finished;
      });
    },
  };
}

describe('Toast updates and motion', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (Element.prototype as Partial<Element>).getAnimations;
  });

  it('UIC-TOAST-1.5 updates a toast in place without moving it or restarting its timer', async () => {
    vi.useFakeTimers();
    const queue = createToastQueue();
    render(<ToastRegion queue={queue} />);
    let key = '';
    act(() => {
      key = queue.add({ title: 'Uploading 1 of 3' });
      queue.add({ title: 'Draft saved' }, { timeout: 0 });
    });
    const toast = screen.getByRole('alertdialog', { name: 'Uploading 1 of 3' });
    await advance(3000);
    act(() => queue.update(key, { tone: 'success', title: 'Uploading 2 of 3' }));
    expect(titles()).toEqual(['Draft saved', 'Uploading 2 of 3']);
    expect(screen.getByRole('alertdialog', { name: 'Uploading 2 of 3' })).toBe(toast);
    expect(toast).toHaveAttribute('data-tone', 'success');
    await advance(1999);
    expect(titles()).toContain('Uploading 2 of 3');
    await advance(1);
    expect(titles()).toEqual(['Draft saved']);

    act(() => {
      key = queue.add({ title: 'Copying' }, { timeout: 1000 });
    });
    await advance(900);
    act(() => queue.update(key, { title: 'Still copying' }, { timeout: 1000 }));
    await advance(900);
    expect(titles()).toContain('Still copying');
    await advance(100);
    expect(titles()).toEqual(['Draft saved']);
    act(() => queue.update(key, { title: 'Gone' }));
    expect(titles()).toEqual(['Draft saved']);
  });

  it('UIC-TOAST-1.6 turns a pending promise toast into a success or error toast', async () => {
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    let resolve: (count: number) => void = () => {};
    let reject: (reason: Error) => void = () => {};
    let key = '';
    act(() => {
      key = queue.promise(
        new Promise<number>((settle) => {
          resolve = settle;
        }),
        {
          pending: { title: 'Saving recipes' },
          success: (count) => ({ title: `${count} recipes saved` }),
          error: { title: 'Not saved' },
        },
      );
      queue.promise(
        new Promise<number>((_settle, fail) => {
          reject = fail;
        }),
        {
          pending: { title: 'Sharing' },
          success: { title: 'Shared' },
          error: (reason) => ({ title: `Not shared: ${(reason as Error).message}` }),
        },
      );
    });
    expect(typeof key).toBe('string');
    const saving = screen.getByRole('alertdialog', { name: 'Saving recipes' });
    expect(saving).toHaveAttribute('data-pending', 'true');
    await act(async () => resolve(3));
    expect(screen.getByRole('alertdialog', { name: '3 recipes saved' })).toBe(saving);
    expect(saving).toHaveAttribute('data-tone', 'success');
    expect(saving).not.toHaveAttribute('data-pending');
    await act(async () => reject(new Error('offline')));
    const shared = screen.getByRole('alertdialog', { name: 'Not shared: offline' });
    expect(shared).toHaveAttribute('data-tone', 'danger');
    expect(within(shared).getByRole('alert')).toHaveTextContent('Not shared: offline');

    let finish: () => void = () => {};
    act(() => {
      key = queue.promise(
        new Promise<void>((settle) => {
          finish = settle;
        }),
        { pending: { title: 'Syncing' }, success: { title: 'Synced' }, error: { title: 'Failed' } },
      );
      queue.close(key);
    });
    await act(async () => finish());
    expect(titles()).not.toContain('Synced');
  });

  it('UIC-TOAST-1.6 gives a settled promise toast the default or given lifetime', async () => {
    vi.useFakeTimers();
    const queue = createToastQueue({ defaultTimeout: 2000 });
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.promise(Promise.resolve(), {
        pending: { title: 'Saving' },
        success: { title: 'Saved' },
        error: { title: 'Failed' },
      });
      queue.promise(
        Promise.resolve(),
        { pending: { title: 'Sending' }, success: { title: 'Sent' }, error: { title: 'Failed' } },
        { timeout: 500 },
      );
    });
    await advance(0);
    expect(titles()).toEqual(['Sent', 'Saved']);
    await advance(500);
    expect(titles()).toEqual(['Saved']);
    await advance(1500);
    expect(titles()).toEqual([]);
  });

  it('UIC-TOAST-3.6 draws a pending toast with a busy indicator and no timeout', async () => {
    vi.useFakeTimers();
    const queue = createToastQueue();
    render(<ToastRegion queue={queue} />);
    let key = '';
    act(() => {
      key = queue.add({ title: 'Exporting report', isPending: true });
    });
    const toast = screen.getByRole('alertdialog', { name: 'Exporting report' });
    expect(toast).toHaveAttribute('data-pending', 'true');
    const spinner = toast.querySelector('.ui-toast__spinner');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
    expect(toast.querySelector('.ui-toast__icon')).toBeNull();
    expect(within(toast).getByRole('status')).toHaveTextContent('Exporting report');
    expectHooksMatchSpec(document.body, 'TOAST', { slots: ['spinner', 'content', 'title'] });
    await advance(60000);
    expect(titles()).toEqual(['Exporting report']);
    act(() => queue.update(key, { tone: 'success', title: 'Report exported' }));
    await advance(4999);
    expect(titles()).toEqual(['Report exported']);
    await advance(1);
    expect(titles()).toEqual([]);
  });

  it('UIC-TOAST-4.1 publishes entering and keeps a closing toast until its exit ends', async () => {
    const animations = holdAnimations();
    const onClose = vi.fn();
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    animations.start();
    let key = '';
    act(() => {
      key = queue.add({ title: 'Saved' }, { onClose });
    });
    const toast = screen.getByRole('alertdialog', { name: 'Saved' });
    expect(toast).toHaveAttribute('data-entering', 'true');
    await animations.finish();
    expect(toast).not.toHaveAttribute('data-entering');

    const exit = holdAnimations();
    exit.start();
    await userEvent.click(within(toast).getByRole('button', { name: 'Dismiss' }));
    expect(toast).toHaveAttribute('data-exiting', 'true');
    expect(toast).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expectHooksMatchSpec(document.body, 'TOAST');
    act(() => queue.close(key));
    await exit.finish();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('UIC-TOAST-4.1 removes a toast that is not shown at once', () => {
    const onClose = vi.fn();
    const queue = createToastQueue({ defaultTimeout: 0 });
    const key = queue.add({ title: 'Unseen' }, { onClose });
    queue.close(key);
    expect(onClose).toHaveBeenCalledTimes(1);
    render(<ToastList queue={queue} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('UIC-TOAST-4.1 removes a closing toast whose list unmounts in the same event, also in Strict Mode', () => {
    for (const wrap of [
      (list: ReactNode) => list,
      (list: ReactNode) => <StrictMode>{list}</StrictMode>,
    ]) {
      const onClose = vi.fn();
      const queue = createToastQueue({ defaultTimeout: 0 });
      const key = queue.add({ title: 'Leaving page' }, { onClose });
      const view = render(wrap(<ToastList queue={queue} />));
      expect(titles()).toEqual(['Leaving page']);
      act(() => {
        queue.close(key);
        view.unmount();
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      const { unmount } = render(<ToastList queue={queue} />);
      expect(titles()).toEqual([]);
      unmount();
    }
  });

  it('UIC-TOAST-4.1 removes a toast once when its region unmounts during its exit', async () => {
    const onClose = vi.fn();
    const queue = createToastQueue({ defaultTimeout: 0 });
    const view = render(<ToastRegion queue={queue} />);
    let key = '';
    act(() => {
      key = queue.add({ title: 'Saved' }, { onClose });
    });
    const exit = holdAnimations();
    exit.start();
    act(() => queue.close(key));
    expect(screen.getByRole('alertdialog', { name: 'Saved' })).toHaveAttribute(
      'data-exiting',
      'true',
    );
    expect(onClose).not.toHaveBeenCalled();
    view.unmount();
    expect(onClose).toHaveBeenCalledTimes(1);
    await exit.finish();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('UIC-TOAST-4.1 removes a toast whose action leaves the page that shows it', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const queue = createToastQueue({ defaultTimeout: 0 });
    function Page() {
      const [page, setPage] = useState('list');
      useEffect(() => {
        queue.add(
          {
            title: 'Row deleted',
            action: { label: 'Open trash', onAction: () => setPage('trash') },
          },
          { onClose },
        );
      }, []);
      return page === 'list' ? <ToastRegion queue={queue} /> : <h1>Trash</h1>;
    }
    render(<Page />);
    await user.click(await screen.findByRole('button', { name: 'Open trash' }));
    expect(screen.getByRole('heading', { name: 'Trash' })).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('UIC-TOAST-4.1 keeps an open toast queued while no list renders it', () => {
    const onClose = vi.fn();
    const queue = createToastQueue({ defaultTimeout: 0 });
    queue.add({ title: 'Still here' }, { onClose });
    render(<ToastList queue={queue} />).unmount();
    render(<ToastList queue={queue} />);
    expect(titles()).toEqual(['Still here']);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('UIC-TOAST-1.3 UIC-TOAST-4.1 calls no onClose for a replaced or cleared toast whose list unmounts', () => {
    const exit = holdAnimations();
    const onClose = vi.fn();
    const queue = createToastQueue({ defaultTimeout: 0 });
    queue.add({ title: 'Syncing 1 of 2' }, { id: 'sync', onClose });
    const cleared = queue.add({ title: 'Draft saved' }, { onClose });
    const view = render(<ToastList queue={queue} />);
    exit.start();
    act(() => {
      queue.add({ title: 'Syncing 2 of 2' }, { id: 'sync' });
    });
    act(() => {
      queue.close(cleared);
      queue.clear();
    });
    view.unmount();
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      queue.add({ title: 'Next' });
    });
    render(<ToastList queue={queue} />);
    expect(titles()).toEqual(['Next']);
  });

  it('UIC-TOAST-4.2 swipes a toast away past the threshold and returns it otherwise', async () => {
    const user = userEvent.setup();
    const queue = createToastQueue({ defaultTimeout: 0 });
    const onAction = vi.fn();
    render(<ToastRegion queue={queue} swipeDirection="left" swipeThreshold={40} />);
    act(() => {
      queue.add({ title: 'Row deleted', action: { label: 'Undo', onAction } });
    });
    const toast = screen.getByRole('alertdialog', { name: 'Row deleted' });
    expect(toast).toHaveAttribute('data-swipe-direction', 'left');
    pointer('pointerDown', toast, { clientX: 200, clientY: 10 });
    pointer('pointerMove', toast, { clientX: 196, clientY: 10 });
    expect(toast).not.toHaveAttribute('data-swiping');
    pointer('pointerMove', toast, { clientX: 170, clientY: 10 });
    expect(toast).toHaveAttribute('data-swiping', 'true');
    expect(toast.style.getPropertyValue('--ui-toast-swipe-x')).toBe('-30px');
    expectHooksMatchSpec(document.body, 'TOAST');
    pointer('pointerUp', toast, { clientX: 170, clientY: 10 });
    expect(toast).not.toHaveAttribute('data-swiping');
    expect(toast.style.getPropertyValue('--ui-toast-swipe-x')).toBe('');
    expect(screen.getByRole('alertdialog', { name: 'Row deleted' })).toBe(toast);

    // Buttons keep their presses: a drag that starts on one is not a swipe.
    const undo = within(toast).getByRole('button', { name: 'Undo' });
    pointer('pointerDown', undo, { clientX: 200, clientY: 10, pointerType: 'mouse' });
    pointer('pointerMove', undo, { clientX: 150, clientY: 10, pointerType: 'mouse' });
    expect(toast).not.toHaveAttribute('data-swiping');
    pointer('pointerCancel', undo, { clientX: 150, clientY: 10, pointerType: 'mouse' });

    const title = within(toast).getByText('Row deleted');
    // The release past the threshold dismisses the toast; the click that follows it is swallowed.
    await user.pointer([
      { keys: '[MouseLeft>]', target: title, coords: { clientX: 200, clientY: 10 } },
      { coords: { clientX: 150, clientY: 10 } },
      { keys: '[/MouseLeft]' },
    ]);
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it.each([
    ['en-US', 'end', 'right', '30px', 230],
    ['ar-EG', 'end', 'left', '-30px', 170],
    ['ar-EG', 'start', 'right', '30px', 230],
    ['ar-EG', 'up', 'up', '', 200],
  ] as const)(
    'UIC-TOAST-4.2 in %s resolves %s to %s',
    (locale, direction, resolved, travel, clientX) => {
      const queue = createToastQueue({ defaultTimeout: 0 });
      render(
        <UiProvider locale={locale}>
          <ToastRegion
            queue={queue}
            {...(direction === 'end' ? {} : { swipeDirection: direction })}
          />
        </UiProvider>,
      );
      act(() => {
        queue.add({ title: 'Saved' });
      });
      const toast = screen.getByRole('alertdialog', { name: 'Saved' });
      expect(toast).toHaveAttribute('data-swipe-direction', resolved);
      pointer('pointerDown', toast, { clientX: 200, clientY: 10 });
      pointer('pointerMove', toast, { clientX, clientY: 10 });
      expect(toast.style.getPropertyValue('--ui-toast-swipe-x')).toBe(travel);
      pointer('pointerCancel', toast, { clientX, clientY: 10 });
    },
  );

  it('UIC-TOAST-4.3 stays expanded while the pointer crosses the gaps of the spread stack', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    let older = '';
    act(() => {
      queue.add({ title: 'Oldest' });
      older = queue.add({ title: 'Older', description: 'A taller toast.' }, { onClose });
      queue.add({ title: 'Newest' });
    });
    const region = screen.getByRole('region');
    // The spread stack, newest at the bottom: unequal heights with 8 pixel gaps between them.
    const boxes = new Map<Element, DOMRect>([
      [region, new DOMRect(16, 600, 360, 46)],
      [screen.getByRole('alertdialog', { name: 'Newest' }), new DOMRect(16, 600, 360, 46)],
      [screen.getByRole('alertdialog', { name: 'Older' }), new DOMRect(16, 520, 360, 72)],
      [screen.getByRole('alertdialog', { name: 'Oldest' }), new DOMRect(16, 466, 360, 46)],
    ]);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      return boxes.get(this) ?? new DOMRect();
    });
    const page = document.body;
    const newest = screen.getByRole('alertdialog', { name: 'Newest' });
    await user.pointer({ target: newest, coords: { clientX: 200, clientY: 620 } });
    expect(region).toHaveAttribute('data-expanded', 'true');
    for (const clientY of [596, 516, 470]) {
      await user.pointer({ target: page, coords: { clientX: 200, clientY } });
      expect(region).toHaveAttribute('data-expanded', 'true');
    }
    // The toast under the pointer leaves and the oldest moves down into its place.
    await user.pointer({ target: page, coords: { clientX: 200, clientY: 550 } });
    act(() => queue.close(older));
    expect(onClose).toHaveBeenCalledTimes(1);
    boxes.set(screen.getByRole('alertdialog', { name: 'Oldest' }), new DOMRect(16, 546, 360, 46));
    await user.pointer({ target: page, coords: { clientX: 200, clientY: 550 } });
    expect(region).toHaveAttribute('data-expanded', 'true');
    await user.pointer({ target: page, coords: { clientX: 200, clientY: 470 } });
    expect(region).not.toHaveAttribute('data-expanded');

    await user.hover(region);
    await user.pointer({ target: page, coords: { clientX: 380, clientY: 620 } });
    expect(region).not.toHaveAttribute('data-expanded');
    await user.hover(region);
    await user.pointer({ target: page, coords: { clientX: 200, clientY: 300 } });
    expect(region).not.toHaveAttribute('data-expanded');
  });

  it('UIC-TOAST-4.3 publishes stack positions and expands the region on hover or focus', async () => {
    const user = userEvent.setup();
    const queue = createToastQueue({ defaultTimeout: 0 });
    render(
      <>
        <button type="button">Outside</button>
        <ToastRegion queue={queue} />
      </>,
    );
    act(() => {
      queue.add({ title: 'Older' });
      queue.add({ title: 'Newer' });
    });
    const newer = screen.getByRole('alertdialog', { name: 'Newer' });
    const older = screen.getByRole('alertdialog', { name: 'Older' });
    expect(newer.style.getPropertyValue('--ui-toast-index')).toBe('0');
    expect(older.style.getPropertyValue('--ui-toast-index')).toBe('1');
    expect(newer.style.getPropertyValue('--ui-toast-offset')).toBe('0px');
    const region = screen.getByRole('region');
    expect(region).not.toHaveAttribute('data-expanded');
    await user.hover(region);
    expect(region).toHaveAttribute('data-expanded', 'true');
    await user.unhover(region);
    expect(region).not.toHaveAttribute('data-expanded');
    act(() => newer.focus());
    expect(region).toHaveAttribute('data-expanded', 'true');
    act(() => screen.getByRole('button', { name: 'Outside' }).focus());
    expect(region).not.toHaveAttribute('data-expanded');
    expectHooksMatchSpec(document.body, 'TOAST');
  });
});

describe('Toast lifetimes when shown again', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('UIC-TOAST-1.2 runs a displaced toast on with the time that remained', async () => {
    vi.useFakeTimers();
    const queue = createToastQueue({ maxVisibleToasts: 1 });
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: 'First' }, { timeout: 1000 });
    });
    await advance(600);
    for (const title of ['Second', 'Third']) {
      let key = '';
      act(() => {
        key = queue.add({ title }, { timeout: 0 });
      });
      expect(titles()).toEqual([title]);
      await advance(2000);
      act(() => queue.close(key));
      expect(titles()).toEqual(['First']);
      await advance(100);
    }
    await advance(199);
    expect(titles()).toEqual(['First']);
    await advance(1);
    expect(titles()).toEqual([]);
  });

  it('UIC-TOAST-1.2 keeps the time that remained across a region remount, also in Strict Mode', async () => {
    vi.useFakeTimers();
    const queue = createToastQueue();
    const view = render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: 'Report ready' }, { timeout: 1000 });
    });
    await advance(600);
    view.unmount();
    await advance(5000);
    render(
      <StrictMode>
        <ToastRegion queue={queue} />
      </StrictMode>,
    );
    expect(titles()).toEqual(['Report ready']);
    await advance(399);
    expect(titles()).toEqual(['Report ready']);
    await advance(1);
    expect(titles()).toEqual([]);
  });

  it('UIC-TOAST-1.2 UIC-TOAST-1.5 starts over only for a new lifetime given while hidden', async () => {
    vi.useFakeTimers();
    const queue = createToastQueue({ maxVisibleToasts: 1, defaultTimeout: 1000 });
    render(<ToastRegion queue={queue} />);
    let edited = '';
    let retimed = '';
    let settle: () => void = () => {};
    act(() => {
      queue.promise(
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
        { pending: { title: 'Syncing' }, success: { title: 'Synced' }, error: { title: 'Failed' } },
      );
      retimed = queue.add({ title: 'Retimed' });
      edited = queue.add({ title: 'Edited' });
    });
    await advance(600);
    let cover = '';
    act(() => {
      cover = queue.add({ title: 'Cover' }, { timeout: 0 });
      queue.update(edited, { title: 'Edited again' });
      queue.update(retimed, { title: 'Retimed again' }, { timeout: 1000 });
    });
    await act(async () => settle());
    act(() => queue.close(cover));
    expect(titles()).toEqual(['Edited again']);
    await advance(400);
    expect(titles()).toEqual(['Retimed again']);
    await advance(999);
    expect(titles()).toEqual(['Retimed again']);
    await advance(1);
    expect(titles()).toEqual(['Synced']);
    await advance(999);
    expect(titles()).toEqual(['Synced']);
    await advance(1);
    expect(titles()).toEqual([]);
  });
});

describe('Toast close callbacks', () => {
  afterEach(() => vi.unstubAllGlobals());

  /** A queue, drawn by a `ToastList` when `isMounted`, else holding its entries unrendered. */
  function setUp(isMounted: boolean) {
    const queue = createToastQueue({ defaultTimeout: 0 });
    let isDrawn = isMounted;
    if (isMounted) render(<ToastList queue={queue} />);
    const show = () => {
      if (!isDrawn) render(<ToastList queue={queue} />);
      isDrawn = true;
      return titles();
    };
    return { queue, show };
  }

  it.each([
    { state: 'hidden', isMounted: false },
    { state: 'mounted', isMounted: true },
  ])(
    'UIC-TOAST-1.4 lets onClose add, close and replace toasts on a coherent $state queue',
    ({ isMounted }) => {
      const { queue, show } = setUp(isMounted);
      const seen: string[][] = [];
      let other = '';
      let first = '';
      act(() => {
        other = queue.add({ title: 'Other' });
        queue.add({ title: 'Upload 1' }, { id: 'upload' });
        first = queue.add(
          { title: 'First' },
          {
            onClose: () => {
              seen.push(titles());
              queue.add({ title: 'Next' });
              queue.add({ title: 'Upload 2' }, { id: 'upload' });
              queue.close(other);
              queue.close(first);
            },
          },
        );
      });
      act(() => queue.close(first));
      expect(show()).toEqual(['Upload 2', 'Next']);
      expect(seen).toHaveLength(1);
    },
  );

  it.each([
    { state: 'hidden', isMounted: false },
    { state: 'mounted', isMounted: true },
  ])(
    'UIC-TOAST-1.4 runs every callback once when onClose clears the $state queue or throws',
    ({ isMounted }) => {
      const reportError = vi.fn();
      vi.stubGlobal('reportError', reportError);
      const { queue, show } = setUp(isMounted);
      const later = vi.fn();
      let keys: string[] = [];
      act(() => {
        keys = [
          queue.add({ title: 'Kept' }, { onClose: later }),
          queue.add(
            { title: 'Clearing' },
            {
              onClose: () => {
                queue.clear();
                queue.add({ title: 'After clear' });
              },
            },
          ),
          queue.add(
            { title: 'Failing' },
            {
              onClose: () => {
                throw new Error('callback failed');
              },
            },
          ),
        ];
      });
      act(() => queue.close(requireDefined(keys[2])));
      expect(reportError).toHaveBeenCalledExactlyOnceWith(new Error('callback failed'));
      expect(show()).toEqual(['Clearing', 'Kept']);
      act(() => queue.close(requireDefined(keys[1])));
      expect(show()).toEqual(['After clear']);
      // A cleared toast never calls its onClose.
      expect(later).not.toHaveBeenCalled();
    },
  );
});
