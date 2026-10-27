import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { ChatCitation, type ChatSource } from './chat-sources.js';

type User = ReturnType<typeof userEvent.setup>;

const weather: ChatSource = {
  id: 'weather',
  title: 'Lisbon weather by month',
  url: 'https://example.com/lisbon/weather',
  siteName: 'Example Travel',
  snippet: 'Summers are dry and sunny.',
};

const notes: ChatSource = { id: 'notes', title: 'Trip notes', snippet: 'Pack light layers.' };

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

const card = () => document.querySelector<HTMLElement>('.ui-chat-citation__card');

function Sentence({ source = weather }: { source?: ChatSource }) {
  return (
    <p>
      <button type="button">Before</button> Mild winters
      <ChatCitation source={source} index={2} data-probe="cite" className="caller" id="cite-2" />
    </p>
  );
}

describe('ChatCitation', () => {
  let user: User;

  beforeEach(() => {
    vi.useFakeTimers();
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  });

  afterEach(async () => {
    await advance(5000);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('UIC-CHAT-SOURCES-2.1 UIC-CHAT-SOURCES-2.4 shows a hidden [n] marker in a named link to the source', () => {
    const { container } = render(<Sentence />);
    const link = screen.getByRole('link', {
      name: 'Source 2: Lisbon weather by month (opens in a new tab)',
    });
    expect(link).toHaveAttribute('href', weather.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveClass('ui-chat-citation', 'ui-link', 'caller');
    expect(link).toHaveAttribute('data-underline', 'hover');
    expect(link).toHaveAttribute('id', 'cite-2');
    expect(link).toHaveAttribute('data-probe', 'cite');
    const marker = link.querySelector('.ui-chat-citation__marker');
    expect(marker).toHaveTextContent('[2]');
    expect(marker).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(container, 'CHAT-SOURCES', {
      slots: ['marker'],
      callerAttributes: ['data-probe'],
    });
  });

  it('UIC-CHAT-SOURCES-2.1 names the marker from the provider strings and keeps relative links in the page', () => {
    render(
      <UiProvider messages={{ chatCitationLabel: '[{index}] {title}' }}>
        <ChatCitation source={{ ...weather, url: '/weather' }} index={1} />
      </UiProvider>,
    );
    const link = screen.getByRole('link', { name: '[1] Lisbon weather by month' });
    expect(link).not.toHaveAttribute('target');
  });

  it('UIC-CHAT-SOURCES-2.2 previews the source on keyboard focus, named by its title', async () => {
    render(<Sentence />);
    await user.tab();
    await user.tab();
    await advance(600);
    const preview = screen.getByRole('dialog', { name: 'Lisbon weather by month' });
    expect(preview).toBe(card());
    expect(preview).toHaveClass('ui-hover-card');
    expect(preview.querySelector('a.ui-chat-citation__title')).toHaveAttribute('href', weather.url);
    expect(preview.querySelector('.ui-chat-citation__site')).toHaveTextContent('Example Travel');
    expect(preview.querySelector('.ui-chat-citation__snippet')).toHaveTextContent(
      'Summers are dry and sunny.',
    );
    expect(screen.getByRole('link', { name: /Source 2/ })).toHaveFocus();
    expectHooksMatchSpec(document.body, 'CHAT-SOURCES', {
      slots: [
        'ui-chat-citation__card',
        'ui-chat-citation__title',
        'ui-chat-citation__site',
        'ui-chat-citation__snippet',
      ],
      callerAttributes: ['data-probe'],
    });
    await user.keyboard('{Escape}');
    await advance(1000);
    expect(card()).toBeNull();
  });

  it('UIC-CHAT-SOURCES-2.2 previews the source when the pointer rests on the marker', async () => {
    render(<Sentence />);
    const link = screen.getByRole('link', { name: /Source 2/ });
    await user.pointer([
      { target: document.body, coords: { clientX: 1, clientY: 1 } },
      { target: link },
    ]);
    await advance(600);
    expect(card()).not.toBeNull();
    expect(link).not.toHaveFocus();
  });

  it('UIC-CHAT-SOURCES-2.3 opens the card on press for a source without a URL', async () => {
    const { container } = render(<Sentence source={notes} />);
    const button = screen.getByRole('button', { name: 'Source 2: Trip notes' });
    expect(button).toHaveClass('ui-chat-citation', 'ui-button');
    expect(button).toHaveAttribute('data-variant', 'bare');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    await user.pointer({ target: document.body, coords: { clientX: 400, clientY: 400 } });
    await user.click(button);
    await advance(0);
    const preview = screen.getByRole('dialog', { name: 'Trip notes' });
    expect(preview.querySelector('span.ui-chat-citation__title')).toHaveTextContent('Trip notes');
    expect(preview.querySelector('.ui-chat-citation__site')).toBeNull();
    expectHooksMatchSpec(container, 'CHAT-SOURCES', { callerAttributes: ['data-probe'] });
  });
});
