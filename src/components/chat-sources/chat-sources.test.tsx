import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { type ChatSource, ChatSources } from './chat-sources.js';

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
    const { container } = render(<ChatSources sources={sources} defaultExpanded />);
    const list = screen.getByRole('list', { name: 'Sources (3)' });
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('ui-chat-sources__list');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.firstElementChild?.textContent)).toEqual([
      'Lisbon weather by month (opens in a new tab)',
      'Coastal rail timetable',
      'Trip notes.md',
    ]);
    expect(container.querySelector('.ui-chat-sources__label')).toHaveTextContent('Sources (3)');
    expectHooksMatchSpec(container, 'CHAT-SOURCES', {
      slots: ['trigger', 'label', 'indicator', 'panel', 'list', 'item', 'title', 'site', 'snippet'],
    });
  });

  it('UIC-CHAT-SOURCES-1.1 counts a single source, and reads the label from the provider strings', () => {
    const { rerender } = render(<ChatSources sources={sources.slice(0, 1)} defaultExpanded />);
    expect(screen.getByRole('list', { name: 'Sources (1)' })).toBeInTheDocument();
    rerender(
      <UiProvider messages={{ chatSourcesLabel: '{count} sources' }}>
        <ChatSources sources={sources} defaultExpanded />
      </UiProvider>,
    );
    expect(screen.getByRole('list', { name: '3 sources' })).toBeInTheDocument();
  });

  it('UIC-CHAT-SOURCES-1.2 shows each title, site and snippet the source has', () => {
    render(<ChatSources sources={sources} defaultExpanded />);
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

  it('UIC-CHAT-SOURCES-1.2 shows the title of a source with an unsafe URL as text', () => {
    render(
      <ChatSources
        sources={[
          { id: 'data', title: 'Packed page', url: 'data:text/html,<p>x</p>' },
          { id: 'file', title: 'Local file', url: 'file:///notes.txt' },
        ]}
      />,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Packed page')).toHaveClass('ui-chat-sources__title');
    expect(screen.getByText('Local file')).toHaveClass('ui-chat-sources__title');
  });

  it('UIC-CHAT-SOURCES-1.3 carries its hooks, the caller class, id and data attributes', () => {
    const { container } = render(
      <ChatSources
        sources={[]}
        className="caller"
        id="answer-sources"
        data-probe="sources"
        defaultExpanded
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-chat-sources', 'caller');
    expect(root).toHaveAttribute('id', 'answer-sources');
    expect(root).toHaveAttribute('data-probe', 'sources');
    expect(screen.getByRole('list', { name: 'Sources (0)' })).toBeEmptyDOMElement();
    expectHooksMatchSpec(container, 'CHAT-SOURCES', { callerAttributes: ['data-probe'] });
  });

  it('UIC-CHAT-SOURCES-1.4 starts collapsed and toggles the list from its trigger', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container } = render(
      <ChatSources sources={sources} onExpandedChange={onExpandedChange} />,
    );
    const root = container.firstElementChild as HTMLElement;
    const trigger = screen.getByRole('button', { name: 'Sources (3)' });
    expect(trigger).toHaveClass('ui-chat-sources__trigger');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(root).not.toHaveAttribute('data-expanded');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(trigger.lastElementChild).toHaveClass('ui-chat-sources__indicator', 'ui-glyph');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(root).toHaveAttribute('data-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Sources (3)' })).toHaveClass(
      'ui-chat-sources__panel',
    );
    expect(screen.getByRole('list', { name: 'Sources (3)' })).toBeInTheDocument();
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedChange).toHaveBeenCalledTimes(3);
  });

  it('UIC-CHAT-SOURCES-1.4 follows a controlled state', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <ChatSources sources={sources} isExpanded={false} onExpandedChange={onExpandedChange} />,
    );
    const trigger = screen.getByRole('button', { name: 'Sources (3)' });
    await user.click(trigger);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    rerender(<ChatSources sources={sources} isExpanded onExpandedChange={onExpandedChange} />);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('list', { name: 'Sources (3)' })).toBeInTheDocument();
  });
});
