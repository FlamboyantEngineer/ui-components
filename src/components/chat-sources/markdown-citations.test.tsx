import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from '../markdown/markdown.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import type { ChatSource } from './chat-sources.js';
import { createCitationOverride, splitCitationMarkers } from './markdown-citations.js';

const sources: ChatSource[] = [
  { id: 'weather', title: 'Lisbon weather', url: 'https://example.com/weather' },
  { id: 'rail', title: 'Coastal rail', url: 'https://example.com/rail' },
  { id: 'notes', title: 'Trip notes' },
];

describe('splitCitationMarkers', () => {
  it('UIC-CHAT-SOURCES-3.1 splits text at markers of known sources only', () => {
    expect(splitCitationMarkers('Sunny [1] and mild [2][3].', 3)).toEqual([
      'Sunny ',
      [1],
      ' and mild ',
      [2],
      [3],
      '.',
    ]);
    expect(splitCitationMarkers('Both [1, 3]', 3)).toEqual(['Both ', [1, 3]]);
    expect(splitCitationMarkers('Use arr[0], [4] or [1, 9]', 3)).toEqual([
      'Use arr[0], [4] or [1, 9]',
    ]);
    expect(splitCitationMarkers('[2]', 3)).toEqual([[2]]);
  });
});

describe('createCitationOverride', () => {
  it('UIC-CHAT-SOURCES-3.1 turns markers in an answer into citations and leaves code alone', () => {
    const citationOverride = createCitationOverride(sources);
    render(
      <Markdown
        source={
          'Lisbon is mild in winter [1], **with trains** north [2, 3].\n\nSee `list[1]` and [7].'
        }
        renderNode={citationOverride}
      />,
    );
    expect(screen.getByRole('link', { name: /^Source 1: Lisbon weather/ })).toHaveClass(
      'ui-chat-citation',
    );
    expect(screen.getByRole('link', { name: /^Source 2: Coastal rail/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Source 3: Trip notes' })).toBeInTheDocument();
    expect(screen.getByText('list[1]').tagName).toBe('CODE');
    expect(screen.getByText(/and \[7\]\./)).toBeInTheDocument();
    expect(document.querySelectorAll('.ui-chat-citation')).toHaveLength(3);
  });

  it('UIC-CHAT-SOURCES-3.1 renders the text between markers through TextMatch', () => {
    const { container } = render(
      <TextMatchProvider query="winter">
        <Markdown source="Mild in winter [1]." renderNode={createCitationOverride(sources)} />
      </TextMatchProvider>,
    );
    expect(container.querySelector('mark.ui-text-match')).toHaveTextContent('winter');
  });
});
