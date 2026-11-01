import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { RecordLabelResolver } from '../record-label/record-label.js';
import type { ChatPart, ChatTextToken } from './chat-part.js';
import { ChatParts } from './chat-parts.js';

const getReference: RecordLabelResolver = ({ label }) => ({
  name: `Trip ${label}`,
  href: `https://example.com/records/${label}`,
});

/** A text part whose `NOTE-1` is a reference token. */
function textWith(text: string): ChatPart[] {
  const start = text.indexOf('NOTE-1');
  const token: ChatTextToken = {
    start,
    end: start + 6,
    kind: 'reference',
    id: 'note-1',
    label: 'NOTE-1',
  };
  return [{ type: 'text', id: 'text', text, tokens: [token] }];
}

describe('ChatParts reference pills by place', () => {
  it('UIC-CHAT-PARTS-2.5 draws a reference chip without its link inside a Markdown link or task label', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <ChatParts
        parts={textWith('[See NOTE-1](https://example.com/outer)')}
        getReference={getReference}
      />,
    );
    expect(container.querySelector('a a')).toBeNull();
    const outer = screen.getByRole('link', { name: /^See NOTE-1/ });
    expect(outer).toHaveAttribute('href', 'https://example.com/outer');
    expect(outer.querySelector('.ui-chat-parts__token')).toHaveTextContent('NOTE-1');
    outer.focus();
    await user.tab();
    expect(outer).not.toHaveFocus();
    rerender(<ChatParts parts={textWith('- [x] Booked NOTE-1')} getReference={getReference} />);
    expect(container.querySelector('label a')).toBeNull();
    expect(screen.getByRole('checkbox', { name: /Booked NOTE-1/ })).toBeChecked();
    rerender(<ChatParts parts={textWith('Booked NOTE-1')} getReference={getReference} />);
    expect(screen.getByRole('link', { name: /NOTE-1/ })).toHaveAttribute(
      'href',
      'https://example.com/records/NOTE-1',
    );
  });

  it('UIC-CHAT-PARTS-2.5 hydrates a reference token inside a Markdown link without a mismatch', async () => {
    const element = (
      <ChatParts
        parts={textWith('[See NOTE-1](https://example.com/outer)')}
        getReference={getReference}
      />
    );
    const host = document.createElement('div');
    document.body.append(host);
    host.innerHTML = renderToString(element);
    expect(host.querySelector('a a')).toBeNull();
    const recoverable: unknown[] = [];
    let app: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      app = hydrateRoot(host, element, { onRecoverableError: (error) => recoverable.push(error) });
    });
    expect(recoverable).toEqual([]);
    act(() => app?.unmount());
    host.remove();
  });
});
