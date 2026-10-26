import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { ChatSources, type ChatSource } from './chat-sources.js';

const sources: ChatSource[] = [
  {
    id: 'weather',
    title: 'Lisbon weather by month',
    url: 'https://www.example.com/lisbon/weather',
    snippet: 'Summers are dry and sunny; winters are mild and wet.',
  },
  { id: 'rail', title: 'Coastal rail timetable', url: '/guides/rail', siteName: 'Rail guide' },
  { id: 'notes', title: 'Trip notes.md' },
];

describe('ChatSources', () => {
  it('UIC-CHAT-SOURCES-1.1 lists the sources in order, labelled by their count', () => {
    const { container } = render(<ChatSources sources={sources} />);
    const list = screen.getByRole('list', { name: '3 sources' });
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('ui-chat-sources__list');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.firstElementChild?.textContent)).toEqual([
      'Lisbon weather by month (opens in a new tab)',
      'Coastal rail timetable',
      'Trip notes.md',
    ]);
    expect(container.querySelector('.ui-chat-sources__label')).toHaveTextContent('3 sources');
    expectHooksMatchSpec(container, 'CHAT-SOURCES', {
      slots: ['label', 'list', 'item', 'title', 'site', 'snippet'],
    });
  });

  it('UIC-CHAT-SOURCES-1.1 names a single source in the singular, from the provider strings', () => {
    const { rerender } = render(<ChatSources sources={sources.slice(0, 1)} />);
    expect(screen.getByRole('list', { name: '1 source' })).toBeInTheDocument();
    rerender(
      <UiProvider strings={{ chatSourcesLabel: (count) => `Sources (${count})` }}>
        <ChatSources sources={sources} />
      </UiProvider>,
    );
    expect(screen.getByRole('list', { name: 'Sources (3)' })).toBeInTheDocument();
  });

  it('UIC-CHAT-SOURCES-1.2 shows each title, site and snippet the source has', () => {
    render(<ChatSources sources={sources} />);
    const [weather, rail, notes] = screen.getAllByRole('listitem');
    const external = within(requireDefined(weather)).getByRole('link', {
      name: /Lisbon weather by month/,
    });
    expect(external).toHaveAttribute('href', 'https://www.example.com/lisbon/weather');
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveClass('ui-chat-sources__title', 'ui-link');
    expect(requireDefined(weather).querySelector('.ui-chat-sources__site')).toHaveTextContent(
      'example.com',
    );
    expect(requireDefined(weather).querySelector('p.ui-chat-sources__snippet')).toHaveTextContent(
      'Summers are dry and sunny',
    );
    const internal = within(requireDefined(rail)).getByRole('link', {
      name: 'Coastal rail timetable',
    });
    expect(internal).not.toHaveAttribute('target');
    expect(requireDefined(rail).querySelector('.ui-chat-sources__site')).toHaveTextContent(
      'Rail guide',
    );
    expect(requireDefined(rail).querySelector('.ui-chat-sources__snippet')).toBeNull();
    expect(within(requireDefined(notes)).queryByRole('link')).not.toBeInTheDocument();
    expect(requireDefined(notes).querySelector('.ui-chat-sources__title')).toHaveTextContent(
      'Trip notes.md',
    );
    expect(requireDefined(notes).querySelector('.ui-chat-sources__site')).toBeNull();
  });

  it('UIC-CHAT-SOURCES-1.3 carries its hooks, the caller class, id and data attributes', () => {
    const { container } = render(
      <ChatSources sources={[]} className="caller" id="answer-sources" data-probe="sources" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-chat-sources', 'caller');
    expect(root).toHaveAttribute('id', 'answer-sources');
    expect(root).toHaveAttribute('data-probe', 'sources');
    expect(screen.getByRole('list', { name: '0 sources' })).toBeEmptyDOMElement();
    expectHooksMatchSpec(container, 'CHAT-SOURCES', { callerAttributes: ['data-probe'] });
  });
});
