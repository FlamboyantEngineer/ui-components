import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ChatToolCallPart } from './chat-part.js';
import { ChatParts } from './chat-parts.js';

const result = (id: string, fields: Partial<ChatToolCallPart> = {}): ChatToolCallPart => ({
  type: 'tool-call',
  id,
  name: 'check_items',
  grouping: 'standalone',
  status: 'failed',
  label: '80 new check errors',
  defaultExpanded: false,
  ...fields,
});

describe('Standalone activity', () => {
  it('UIC-CHAT-PARTS-3.2 UIC-CHAT-PARTS-6.1 keeps the count visible and reaches all 80 literal entries by keyboard', async () => {
    const user = userEvent.setup();
    const details = Array.from(
      { length: 80 },
      (_, at) => `${at + 1}. <entry> **literal** ${at + 1}`,
    ).join('\n');
    const { container } = render(
      <ChatParts
        parts={[result('count', { result: details, kind: 'command', durationMs: 1000 })]}
      />,
    );
    const trigger = screen.getByRole('button', { name: /80 new check errors/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.ui-chat-steps')).toBeNull();
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('code')?.textContent).toBe(details);
    expect(container.querySelector('.ui-chat-tool-call__status-glyph')).toHaveAttribute(
      'data-glyph',
      'error',
    );
  });

  it('UIC-CHAT-PARTS-3.2 supports default and controlled expansion, independent rows and ordinary grouped calls', async () => {
    const user = userEvent.setup();
    const onExpandedPartsChange = vi.fn();
    const parts = [
      result('one', {
        label: '1 new check error',
        result: '1. One detail.',
        defaultExpanded: true,
      }),
      result('empty', { label: 'No details' }),
      result('ordinary', { grouping: 'auto' }),
    ];
    const { rerender } = render(<ChatParts parts={parts} />);
    expect(screen.getByRole('button', { name: /1 new check error/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await user.click(screen.getByRole('button', { name: /No details/ }));
    expect(
      within(screen.getByRole('group', { name: /No details Failed/ })).getByText('No details'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1 new check error/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    rerender(
      <ChatParts
        parts={parts}
        expandedParts={{ one: false }}
        onExpandedPartsChange={onExpandedPartsChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /1 new check error/ }));
    expect(onExpandedPartsChange).toHaveBeenCalledWith({ one: true });
    expect(screen.getByRole('button', { name: /1 new check error/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
