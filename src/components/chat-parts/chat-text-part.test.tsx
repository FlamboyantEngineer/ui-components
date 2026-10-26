import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type * as SourcesModule from '../chat-sources/chat-sources.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import type { ChatPart, ChatSourcesPart, ChatTextToken } from './chat-part.js';
import { ChatParts } from './chat-parts.js';

const citations = vi.hoisted(() => ({ created: 0, texts: [] as string[] }));

// Counts the citation overrides created and the text nodes they draw, to check that a streaming
// message keeps one override and does not draw its finished blocks again.
vi.mock('../chat-sources/chat-sources.js', async (importOriginal) => {
  const actual = await importOriginal<typeof SourcesModule>();
  return {
    ...actual,
    createCitationOverride: (sources: Parameters<typeof actual.createCitationOverride>[0]) => {
      citations.created += 1;
      const override = actual.createCitationOverride(sources);
      return (node: Parameters<typeof override>[0]) => {
        if (node.type === 'text') citations.texts.push(node.text);
        return override(node);
      };
    },
  };
});

const weather = { id: 'weather', title: 'Lisbon weather', url: 'https://example.com/weather' };
const rail = { id: 'rail', title: 'Coastal rail', url: 'https://example.com/rail' };
const sourcesPart = (...sources: ChatSourcesPart['sources']): ChatSourcesPart => ({
  type: 'sources',
  sources: [...sources],
});

/** A token over the first occurrence of `covered` in `text`. */
function tokenOver(text: string, covered: string, token: Omit<ChatTextToken, 'start' | 'end'>) {
  const start = text.indexOf(covered);
  return { ...token, start, end: start + covered.length };
}

describe('ChatParts text', () => {
  it('UIC-CHAT-PARTS-2.1 renders text as Markdown by default', () => {
    const { container } = render(<ChatParts parts={[{ type: 'text', text: 'Pack **light**.' }]} />);
    const text = container.querySelector('.ui-chat-parts__text');
    expect(text).toHaveClass('ui-markdown');
    expect(text).toHaveAttribute('data-format', 'markdown');
    expect(text).not.toHaveAttribute('data-streaming');
    expect(screen.getByText('light').tagName).toBe('STRONG');
    expectHooksMatchSpec(container, 'CHAT-PARTS', { slots: ['text'] });
  });

  it('UIC-CHAT-PARTS-2.1 follows textFormat unless the part sets its own format', () => {
    render(
      <ChatParts
        textFormat="plain"
        parts={[
          { type: 'text', text: '**as written**' },
          { type: 'text', text: 'Mark it **bold**', format: 'markdown' },
        ]}
      />,
    );
    expect(screen.getByText('**as written**')).toHaveAttribute('data-format', 'plain');
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('UIC-CHAT-PARTS-2.1 streams the Markdown of a streaming part', () => {
    const { container } = render(
      <ChatParts parts={[{ type: 'text', text: 'Pack **light', status: 'streaming' }]} />,
    );
    expect(container.querySelector('.ui-chat-parts__text')).toHaveAttribute(
      'data-streaming',
      'true',
    );
    expect(screen.getByText('light').tagName).toBe('STRONG');
  });

  it('UIC-CHAT-PARTS-2.2 draws fenced code as a code block, with Apply only given onApplyCode', async () => {
    const user = userEvent.setup();
    const onApplyCode = vi.fn();
    const parts: ChatPart[] = [{ type: 'text', text: 'Run:\n\n```ts\nconst total = 2;\n```' }];
    const { rerender } = render(<ChatParts parts={parts} />);
    const block = screen.getByRole('group', { name: 'ts' });
    expect(block).toHaveClass('ui-code-block');
    expect(within(block).queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    rerender(<ChatParts parts={parts} onApplyCode={onApplyCode} />);
    await user.click(within(block).getByRole('button', { name: 'Apply' }));
    expect(onApplyCode).toHaveBeenCalledWith('const total = 2;', {
      type: 'code',
      code: 'const total = 2;',
      language: 'ts',
    });
  });

  it('UIC-CHAT-PARTS-2.2 cites the sources of every sources part, in order', () => {
    render(
      <ChatParts
        parts={[
          { type: 'text', text: 'Mild in winter [1], with trains north [2].' },
          sourcesPart(weather),
          sourcesPart(rail),
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: /^Source 1: Lisbon weather/ })).toHaveClass(
      'ui-chat-citation',
    );
    expect(screen.getByRole('link', { name: /^Source 2: Coastal rail/ })).toBeInTheDocument();
  });

  it('UIC-CHAT-PARTS-2.2 keeps its overrides and finished blocks while the message streams', async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const latest = vi.fn();
    const streamed = (text: string): ChatPart[] => [
      { type: 'text', text, status: 'streaming' },
      sourcesPart({ ...weather }),
    ];
    const finished = 'Mild in winter [1].\n\n```sh\nls\n```\n\n';
    citations.created = 0;
    const { rerender } = render(
      <ChatParts parts={streamed(`${finished}Pack`)} onApplyCode={first} isStreaming />,
    );
    citations.texts = [];
    rerender(
      <ChatParts parts={streamed(`${finished}Pack layers`)} onApplyCode={latest} isStreaming />,
    );
    expect(citations.created).toBe(1);
    expect(citations.texts).toEqual(['Pack layers']);
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith('ls', { type: 'code', code: 'ls', language: 'sh' });
  });

  it('UIC-CHAT-PARTS-2.3 renders plain text as written, with its line breaks', () => {
    const { container } = render(
      <TextMatchProvider query="second">
        <ChatParts
          textFormat="plain"
          parts={[{ type: 'text', text: 'First line\nSecond *line*' }]}
        />
      </TextMatchProvider>,
    );
    const text = container.querySelector('.ui-chat-parts__text');
    expect(text?.tagName).toBe('DIV');
    expect(text).not.toHaveClass('ui-markdown');
    expect(text?.querySelectorAll('br')).toHaveLength(1);
    expect(text).toHaveTextContent('First lineSecond *line*');
    expect(container.querySelector('mark.ui-text-match')).toHaveTextContent('Second');
    expectHooksMatchSpec(container, 'CHAT-PARTS', { slots: ['text'] });
  });

  it('UIC-CHAT-PARTS-2.4 shows tokens as pills in Markdown, beside emphasis and citations', () => {
    const text = '/plan a trip with **@Ana** to Porto [1]';
    const tokens = [
      tokenOver(text, '/plan', { kind: 'command', id: 'plan', label: '/plan' }),
      tokenOver(text, '@Ana', { kind: 'mention', id: 'ana', label: 'Ana Lopez' }),
    ];
    const { container } = render(
      <ChatParts parts={[{ type: 'text', text, tokens }, sourcesPart(weather)]} />,
    );
    const command = screen.getByText('/plan');
    expect(command).toHaveClass('ui-chat-parts__token');
    expect(command).toHaveAttribute('data-kind', 'command');
    const mention = screen.getByText('Ana Lopez');
    expect(mention).toHaveAttribute('data-kind', 'mention');
    expect(mention.parentElement?.tagName).toBe('STRONG');
    expect(screen.getByRole('link', { name: /^Source 1: Lisbon weather/ })).toBeInTheDocument();
    expect(container.querySelector('.ui-chat-parts__text')).toHaveTextContent(
      '/plan a trip with Ana Lopez to Porto',
    );
    expectHooksMatchSpec(container, 'CHAT-PARTS', { slots: ['text', 'token'] });
  });

  it('UIC-CHAT-PARTS-2.4 keeps a token in code as written', () => {
    const text = 'Type `@Ana` to mention @Ana';
    const start = text.lastIndexOf('@Ana');
    const tokens: ChatTextToken[] = [
      { ...tokenOver(text, '@Ana', { kind: 'mention', id: 'ana', label: 'Ana Lopez' }) },
      { start, end: start + 4, kind: 'mention', id: 'ana', label: 'Ana Lopez' },
    ];
    const { container } = render(<ChatParts parts={[{ type: 'text', text, tokens }]} />);
    expect(screen.getByText('@Ana').tagName).toBe('CODE');
    expect(container.querySelectorAll('.ui-chat-parts__token')).toHaveLength(1);
  });

  it('UIC-CHAT-PARTS-2.4 shows tokens as pills in plain text', () => {
    const text = 'Hi @Ana\n/plan the **trip**';
    const tokens = [
      tokenOver(text, '@Ana', { kind: 'mention', id: 'ana', label: 'Ana Lopez' }),
      tokenOver(text, '/plan', { kind: 'command', id: 'plan', label: '/plan' }),
    ];
    const { container } = render(
      <ChatParts parts={[{ type: 'text', text, tokens, format: 'plain' }]} />,
    );
    expect(screen.getByText('Ana Lopez')).toHaveAttribute('data-kind', 'mention');
    expect(screen.getByText('/plan')).toHaveAttribute('data-kind', 'command');
    const plain = container.querySelector('.ui-chat-parts__text');
    expect(plain?.querySelectorAll('br')).toHaveLength(1);
    expect(plain).toHaveTextContent('Hi Ana Lopez/plan the **trip**');
  });

  it('UIC-CHAT-PARTS-2.5 UIC-RECORD-LABEL-3.2 shows references as record chips the host looks up by id, in both formats', () => {
    const text = 'Compare **TRIP-4** with NOTE-12';
    const tokens: ChatTextToken[] = [
      tokenOver(text, 'TRIP-4', {
        kind: 'reference',
        id: 'trip-uuid',
        label: 'TRIP-4',
        recordType: 'itinerary',
      }),
      tokenOver(text, 'NOTE-12', { kind: 'reference', id: 'note-uuid', label: 'NOTE-12' }),
    ];
    const getReference = vi.fn((reference: { id: string }) =>
      reference.id === 'trip-uuid'
        ? { name: 'Lisbon weekend', href: '/trips/4' }
        : { unavailable: 'restricted' as const },
    );
    const { container } = render(
      <>
        <ChatParts parts={[{ type: 'text', text, tokens }]} getReference={getReference} />
        <ChatParts
          parts={[{ type: 'text', text, tokens, format: 'plain' }]}
          getReference={getReference}
        />
      </>,
    );
    expect(getReference).toHaveBeenCalledWith({
      id: 'trip-uuid',
      label: 'TRIP-4',
      recordType: 'itinerary',
    });
    expect(getReference).toHaveBeenCalledWith({ id: 'note-uuid', label: 'NOTE-12' });
    const pills = container.querySelectorAll('.ui-chat-parts__token[data-kind="reference"]');
    expect(pills).toHaveLength(4);
    expect(pills[0]?.closest('strong')).not.toBeNull();
    expect(screen.getAllByRole('link', { name: 'TRIP-4 Lisbon weekend' })[0]).toHaveAttribute(
      'href',
      '/trips/4',
    );
    expect(pills[1]?.querySelector('.ui-record-label')).toHaveAttribute(
      'data-unavailable',
      'restricted',
    );
    expect(pills[1]).toHaveTextContent('Restricted item');
  });

  it('UIC-CHAT-PARTS-2.5 shows a reference as its label without a lookup, and never as markup', () => {
    const text = 'See <b>X</b>';
    const tokens: ChatTextToken[] = [
      tokenOver(text, '<b>X</b>', { kind: 'reference', id: 'x', label: '<b>X</b>' }),
    ];
    const { container } = render(<ChatParts parts={[{ type: 'text', text, tokens }]} />);
    const pill = container.querySelector('.ui-chat-parts__token[data-kind="reference"]');
    expect(pill).toHaveTextContent('<b>X</b>');
    expect(pill?.querySelector('b')).toBeNull();
    expect(pill?.querySelector('a')).toBeNull();
  });
});
