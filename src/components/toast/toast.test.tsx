import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { ToastList, ToastQueue, ToastRegion } from './toast.js';

const titles = () =>
  [...document.querySelectorAll('.ui-toast__title')].map((node) => node.textContent);

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe('ToastQueue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('UIC-TOAST-1.1 adds toasts newest first and limits how many show', async () => {
    const queue = new ToastQueue({ maxVisibleToasts: 2, defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    let firstKey = '';
    act(() => {
      firstKey = queue.add({ title: 'Apple saved' });
      queue.add({ title: 'Pear saved' });
      queue.add({ title: 'Plum saved' });
    });
    expect(typeof firstKey).toBe('string');
    expect(firstKey).not.toBe('');
    expect(titles()).toEqual(['Plum saved', 'Pear saved']);
    act(() => queue.close(queue.visibleToasts[0]?.key ?? ''));
    expect(titles()).toEqual(['Pear saved', 'Apple saved']);
  });

  it('UIC-TOAST-1.2 closes after the default or given timeout, or never with zero', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const queue = new ToastQueue();
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
    vi.useFakeTimers();
    const queue = new ToastQueue({ defaultTimeout: 5000 });
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
    fireEvent.pointerEnter(region, { pointerType: 'mouse' });
    await advance(10000);
    expect(titles()).toEqual(['Paused']);
    fireEvent.pointerLeave(region, { pointerType: 'mouse' });
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

  it('UIC-TOAST-1.3 replaces a toast with the same id without closing it', async () => {
    vi.useFakeTimers();
    const replacedClose = vi.fn();
    const queue = new ToastQueue();
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
    const queue = new ToastQueue({ defaultTimeout: 0 });
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
    expect(screen.queryByRole('region')).toBeNull();
    act(() => {
      queue.add({ title: 'Third again' }, { id: 'third' });
    });
    expect(titles()).toEqual(['Third again']);
  });
});

describe('ToastRegion', () => {
  it('UIC-TOAST-2.1 portals a named landmark only while it has toasts and keeps focus', () => {
    const queue = new ToastQueue({ defaultTimeout: 0 });
    const { container } = render(
      <>
        <button type="button">Keep</button>
        <ToastRegion queue={queue} />
      </>,
    );
    expect(screen.queryByRole('region')).toBeNull();
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
    const queue = new ToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} aria-label="Messages" />);
    act(() => {
      queue.add({ title: 'Saved' });
    });
    expect(screen.getByRole('region', { name: 'Messages' })).toBeInTheDocument();
  });

  it('UIC-TOAST-2.2 makes each toast a labelled alertdialog with a tone-dependent live region', () => {
    const queue = new ToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ tone: 'info', title: 'Draft saved', description: 'Saved to Report.pdf' });
      queue.add({ tone: 'success', title: 'Sent' });
      queue.add({ tone: 'warning', title: 'Almost full' });
      queue.add({ tone: 'error', title: 'Upload failed' });
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

  it('UIC-TOAST-2.2 moves focus to the next toast when a focused toast closes', () => {
    const queue = new ToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: 'Older' });
      queue.add({ title: 'Newer' });
    });
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Tab' });
      screen.getByRole('alertdialog', { name: 'Newer' }).focus();
    });
    act(() => queue.close(queue.visibleToasts[0]?.key ?? ''));
    expect(screen.getByRole('alertdialog', { name: 'Older' })).toHaveFocus();
  });

  it('UIC-TOAST-2.3 draws a queue in place without a landmark', () => {
    const queue = new ToastQueue({ defaultTimeout: 0 });
    queue.add({ tone: 'warning', title: 'Disk almost full' });
    const { container } = render(
      <ToastList queue={queue} className="caller" data-testid="stack" />,
    );
    const list = container.firstElementChild as HTMLElement;
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('ui-toast-list', 'caller');
    expect(list).toHaveAttribute('data-testid', 'stack');
    expect(screen.queryByRole('region')).toBeNull();
    expect(within(list).getByRole('alertdialog', { name: 'Disk almost full' })).toBeInTheDocument();
    act(() => queue.close(queue.visibleToasts[0]?.key ?? ''));
    expect(within(list).queryByRole('alertdialog')).toBeNull();
    expectHooksMatchSpec(container, 'TOAST');
  });
});

describe('Toast', () => {
  it('UIC-TOAST-3.1 publishes the tone and draws its glyph or a custom icon', () => {
    const queue = new ToastQueue({ defaultTimeout: 0 });
    for (const tone of ['info', 'success', 'warning', 'error'] as const) {
      queue.add({ tone, title: `${tone} title` });
    }
    queue.add({ title: 'Default tone' });
    queue.add({ title: 'Custom', icon: <svg data-testid="custom-icon" /> });
    queue.add({ title: 'Glyph', icon: 'help' });
    render(<ToastList queue={queue} />);
    for (const tone of ['info', 'success', 'warning', 'error'] as const) {
      const toast = screen.getByRole('alertdialog', { name: `${tone} title` });
      expect(toast).toHaveClass('ui-toast');
      expect(toast).toHaveAttribute('data-tone', tone);
      const icon = toast.querySelector('.ui-toast__icon');
      expect(icon).toHaveClass('ui-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('data-glyph', tone);
    }
    expect(screen.getByRole('alertdialog', { name: 'Default tone' })).toHaveAttribute(
      'data-tone',
      'info',
    );
    expect(screen.getByTestId('custom-icon').parentElement).toHaveClass('ui-toast__icon');
    expect(
      screen.getByRole('alertdialog', { name: 'Glyph' }).querySelector('.ui-toast__icon'),
    ).toHaveAttribute('data-glyph', 'help');
    expectHooksMatchSpec(document.body, 'TOAST', { slots: ['icon', 'content', 'title', 'close'] });
  });

  it('UIC-TOAST-3.2 shows the title and an optional description', () => {
    const queue = new ToastQueue({ defaultTimeout: 0 });
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
    const queue = new ToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: 'Row deleted', action: { label: 'Undo', onAction } });
    });
    const action = screen.getByRole('button', { name: 'Undo' });
    expect(action).toHaveClass('ui-button', 'ui-toast__action');
    expectHooksMatchSpec(document.body, 'TOAST', { slots: ['action'] });
    await userEvent.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('UIC-TOAST-3.4 dismisses with a named icon button', async () => {
    const onClose = vi.fn();
    const queue = new ToastQueue({ defaultTimeout: 0 });
    render(
      <UiProvider strings={{ dismiss: 'Close message' }}>
        <ToastRegion queue={queue} />
      </UiProvider>,
    );
    act(() => {
      queue.add({ title: 'Saved' }, { onClose });
    });
    const close = screen.getByRole('button', { name: 'Close message' });
    expect(close).toHaveClass('ui-icon-button', 'ui-toast__close');
    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('UIC-TOAST-3.5 forwards caller classes, ids and data attributes and publishes interaction states', async () => {
    const queue = new ToastQueue({ defaultTimeout: 0 });
    render(<ToastRegion queue={queue} className="caller" id="messages" data-testid="region" />);
    act(() => {
      queue.add({ title: 'Saved' });
    });
    const region = screen.getByTestId('region');
    expect(region).toHaveClass('ui-toast-region', 'caller');
    expect(region).toHaveAttribute('id', 'messages');
    fireEvent.pointerMove(region, { pointerType: 'mouse' });
    fireEvent.pointerEnter(region, { pointerType: 'mouse' });
    expect(region).toHaveAttribute('data-hovered', 'true');
    const toast = screen.getByRole('alertdialog', { name: 'Saved' });
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Tab' });
      toast.focus();
    });
    expect(toast).toHaveAttribute('data-focused', 'true');
    expect(toast).toHaveAttribute('data-focus-visible', 'true');
    expectHooksMatchSpec(document.body, 'TOAST');
  });
});
