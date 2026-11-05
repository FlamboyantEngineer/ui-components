import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ChatPart } from '../chat-parts/chat-part.js';
import { ChatParts } from '../chat-parts/chat-parts.js';
import { Markdown } from '../markdown/markdown.js';
import type { MarkdownNodePlace } from '../markdown/markdown-place.js';
import type { ChatSource } from './chat-sources.js';
import { createCitationOverride } from './markdown-citations.js';

const sources: ChatSource[] = [
  { id: 'source', title: 'Harbour timetable', url: 'https://example.com/source' },
  { id: 'notes', title: 'Trip notes' },
];

function partsOf(text: string): ChatPart[] {
  return [
    { type: 'text', id: 'answer', text },
    { type: 'sources', id: 'sources', sources },
  ];
}

describe('Citations by place', () => {
  it('UIC-MARKDOWN-2.8 tells renderNode whether a node sits in a link or a task label', () => {
    const places: [string, boolean][] = [];
    render(
      <Markdown
        source={
          'Plain **bold [x](https://example.com/a) *deep*** text\n\n- [ ] Task *label*\n\n  Body'
        }
        renderNode={(node, _children, place: MarkdownNodePlace) => {
          if (node.type === 'text') places.push([node.text, place.isInteractive]);
          return undefined;
        }}
      />,
    );
    expect(places).toEqual([
      ['Plain ', false],
      ['bold ', false],
      ['x', true],
      [' ', false],
      ['deep', false],
      [' text', false],
      ['Task ', true],
      ['label', true],
      ['Body', false],
    ]);
  });

  it('UIC-CHAT-SOURCES-3.1 keeps markers in a link as text and cites them elsewhere', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ChatParts
        parts={partsOf('[See [1]](https://example.com/outer) and [1].\n\n- [x] Booked [2]')}
      />,
    );
    expect(
      container.querySelector('a a, a button, label a[href*="source"], label button'),
    ).toBeNull();
    const outer = screen.getByRole('link', { name: /^See \[1\]/ });
    expect(outer).toHaveAttribute('href', 'https://example.com/outer');
    expect(screen.getByRole('checkbox', { name: 'Booked [2]' })).toBeInTheDocument();
    const citations = container.querySelectorAll<HTMLElement>('.ui-chat-citation');
    expect(citations).toHaveLength(1);
    const [citation] = citations;
    expect(outer).not.toContainElement(citation ?? null);
    outer.focus();
    await user.tab();
    expect(citation).toHaveFocus();
  });

  it('UIC-CHAT-SOURCES-3.1 hydrates a citation marker inside a link without a mismatch', async () => {
    const element = <ChatParts parts={partsOf('[See [1]](https://example.com/outer) and [2].')} />;
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
    expect(host.querySelectorAll('.ui-chat-citation')).toHaveLength(1);
    act(() => app?.unmount());
    host.remove();
  });

  it('UIC-CHAT-SOURCES-3.1 leaves markers in a link to createCitationOverride as text', () => {
    render(
      <Markdown
        source="[Read [1]](https://example.com/outer)"
        renderNode={createCitationOverride(sources)}
      />,
    );
    expect(screen.getByRole('link')).toHaveTextContent('Read [1]');
  });
});
