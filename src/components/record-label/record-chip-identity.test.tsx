import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecordLabel, type RecordLabelProps } from './record-label.js';

// The chip keeps its label while the preview and layout change (UIC-RECORD-LABEL-11.8).

const chip = (props: Partial<RecordLabelProps>) => (
  <RecordLabel
    mode="chip"
    identifier="REQ-12"
    name="Limits"
    href="/records/12"
    version="v3"
    onRemove={() => {}}
    {...props}
  />
);

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

const card = () => document.querySelector('.ui-record-label__preview');

async function focusedLink(props: Partial<RecordLabelProps>) {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const view = render(chip(props));
  await user.tab();
  const link = screen.getByRole('link', { name: 'REQ-12 Limits' });
  expect(link).toHaveFocus();
  return { ...view, link, remove: screen.getByRole('button', { name: 'Remove REQ-12' }) };
}

describe('RecordLabel chip identity', () => {
  afterEach(async () => {
    await advance(5000);
    vi.useRealTimers();
  });

  it('UIC-RECORD-LABEL-11.8 keeps the focused link when a preview arrives, without opening it', async () => {
    const { link, remove, rerender } = await focusedLink({});
    expect(link).not.toHaveAttribute('aria-haspopup');
    rerender(chip({ preview: <p>Owner</p> }));
    await advance(1000);
    expect(screen.getByRole('link', { name: 'REQ-12 Limits' })).toBe(link);
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('aria-haspopup', 'dialog');
    expect(card()).toBeNull();
    expect(screen.getByRole('button', { name: 'Remove REQ-12' })).toBe(remove);
  });

  it('UIC-RECORD-LABEL-11.8 keeps the focused link and closes the card when the preview goes', async () => {
    const { link, rerender } = await focusedLink({ preview: <p>Owner</p> });
    await advance(700);
    expect(card()).toHaveTextContent('Owner');
    rerender(chip({}));
    await advance(1000);
    expect(card()).toBeNull();
    expect(screen.getByRole('link', { name: 'REQ-12 Limits' })).toBe(link);
    expect(link).toHaveFocus();
    expect(link).not.toHaveAttribute('aria-haspopup');
    expect(link).not.toHaveAttribute('aria-expanded');
    rerender(chip({ preview: <p>Owner</p> }));
    await advance(1000);
    expect(card()).toBeNull();
  });

  it('UIC-RECORD-LABEL-11.8 keeps the focused link and remove button across layouts', async () => {
    const { link, remove, rerender, container } = await focusedLink({ preview: <p>Owner</p> });
    for (const layout of ['stacked', 'inline', 'stacked'] as const) {
      rerender(chip({ preview: <p>Owner</p>, layout }));
      expect(container.firstElementChild).toHaveAttribute('data-layout', layout);
      expect(screen.getByRole('link', { name: /^REQ-12/ })).toBe(link);
      expect(screen.getByRole('button', { name: 'Remove REQ-12' })).toBe(remove);
      expect(link).toHaveFocus();
    }
  });

  it('UIC-RECORD-LABEL-11.8 replaces the link with plain text when the record becomes unavailable', async () => {
    const { rerender } = await focusedLink({ preview: <p>Owner</p> });
    rerender(chip({ preview: <p>Owner</p>, unavailable: 'missing' }));
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    await advance(1000);
    expect(card()).toBeNull();
  });
});
