import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { buildSearchSnippet } from './build-search-snippet.js';
import { SearchSnippet } from './search-snippet.js';

const source = 'Peel the pears and cut each one in half, then poach the halves in a light syrup.';

function snippetFor(match: string, options = {}) {
  const start = source.indexOf(match);
  return buildSearchSnippet({ source, start, end: start + match.length }, options);
}

describe('SearchSnippet', () => {
  it('UIC-SEARCH-PANE-4.2 draws the context, the near words and the match in a mark, in order', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <SearchSnippet
        ref={ref}
        snippet={snippetFor('poach', { beforeLength: 60 })}
        className="host"
        data-row="1"
        id="s"
      />,
    );
    const root = container.querySelector('.ui-search-snippet');
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('host');
    expect(root).toHaveAttribute('data-row', '1');
    expect(root).toHaveAttribute('id', 's');
    expect(root).toHaveTextContent(
      'Peel the pears and cut each one in half, then poach the halves in a light syrup.',
    );
    expect(root).not.toHaveAttribute('data-start-omitted');
    expect(root?.querySelector('.ui-search-snippet__lead > bdi')).toHaveTextContent(
      'Peel the pears and cut each one in half,',
    );
    expect(root?.querySelector('.ui-search-snippet__near')?.textContent).toBe('then ');
    const match = root?.querySelector('mark.ui-search-snippet__match');
    expect(match).toHaveTextContent('poach');
    expect(root?.querySelector('.ui-search-snippet__after')?.textContent).toBe(
      ' the halves in a light syrup.',
    );
    expect(container.querySelector('.ui-search-snippet__ellipsis')).toBeNull();
    expectHooksMatchSpec(container, 'SEARCH-PANE', {
      slots: ['lead', 'near', 'match', 'after'],
      callerAttributes: ['data-row'],
    });
  });

  it('UIC-SEARCH-PANE-4.2 adds an ellipsis only where text was left out', () => {
    const { container } = render(
      <SearchSnippet snippet={snippetFor('poach', { beforeLength: 12, afterLength: 12 })} />,
    );
    const root = container.querySelector('.ui-search-snippet');
    expect(root).toHaveAttribute('data-start-omitted', 'true');
    expect(root).toHaveAttribute('data-end-omitted', 'true');
    expect(root).toHaveTextContent('…half, then poach the halves…');
    const ellipses = container.querySelectorAll('.ui-search-snippet__ellipsis');
    expect(ellipses).toHaveLength(2);
    expect(root?.querySelector('.ui-search-snippet__lead')).toContainElement(
      ellipses[0] as HTMLElement,
    );
    expect(root?.querySelector('.ui-search-snippet__after')).toContainElement(
      ellipses[1] as HTMLElement,
    );
    expectHooksMatchSpec(container, 'SEARCH-PANE', { slots: ['ellipsis'] });
  });

  it('UIC-SEARCH-PANE-4.2 opens the near words with the ellipsis when a long word was cut', () => {
    const long = `${'x'.repeat(30)}needle tail`;
    const start = long.indexOf('needle');
    const snippet = buildSearchSnippet(
      { source: long, start, end: start + 6 },
      { beforeLength: 8 },
    );
    const { container } = render(<SearchSnippet snippet={snippet} />);
    expect(container.querySelector('.ui-search-snippet__lead')).toBeNull();
    const near = container.querySelector('.ui-search-snippet__near');
    expect(near?.textContent).toBe(`…${'x'.repeat(8)}`);
    expect(near?.querySelector('.ui-search-snippet__ellipsis')).not.toBeNull();
  });
});
