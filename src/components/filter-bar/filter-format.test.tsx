import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { joinFilterConditionText, useFilterConditionText } from './filter-format.js';
import type { FilterCondition, FilterField } from './filter-model.js';

const fields: Record<string, FilterField> = {
  title: { id: 'title', label: 'Title', type: 'text' },
  pages: { id: 'pages', label: 'Pages', type: 'number' },
  published: { id: 'published', label: 'Published', type: 'date' },
  genre: {
    id: 'genre',
    label: 'Genre',
    type: 'choice',
    options: [
      { value: 'history', label: 'History' },
      { value: 'travel', label: 'Travel' },
    ],
  },
  available: { id: 'available', label: 'Available', type: 'boolean' },
};

function Text({ condition }: { condition: FilterCondition }) {
  const read = useFilterConditionText();
  return (
    <output>
      {joinFilterConditionText(read(condition, requireDefined(fields[condition.field])))}
    </output>
  );
}

const cases: Array<[FilterCondition, string]> = [
  [{ field: 'title', operator: 'contains', value: 'sea' }, 'Title contains sea'],
  [{ field: 'pages', operator: 'at-least', value: 1200 }, 'Pages is at least 1,200'],
  [{ field: 'pages', operator: 'between', value: { min: 2, max: 5 } }, 'Pages is between 2 and 5'],
  [
    { field: 'published', operator: 'before', value: '2024-03-02' },
    'Published is before Mar 2, 2024',
  ],
  [
    { field: 'published', operator: 'between', value: { start: '2024-03-02', end: '2024-03-09' } },
    'Published is between Mar 2 – 9, 2024',
  ],
  [
    { field: 'genre', operator: 'any-of', value: ['history', 'travel', 'other'] },
    'Genre is any of History, Travel, other',
  ],
  [{ field: 'available', operator: 'equals', value: false }, 'Available is False'],
  [{ field: 'genre', operator: 'empty', value: null }, 'Genre is empty'],
  [{ field: 'pages', operator: 'between', value: { min: 2, max: null } }, 'Pages is between'],
];

describe('filter condition text', () => {
  it.each(cases)('UIC-FILTER-BAR-2.1 reads %o as %s', (condition, expected) => {
    render(<Text condition={condition} />);
    expect(screen.getByRole('status')).toHaveTextContent(expected);
  });

  it('UIC-FILTER-BAR-2.1 formats numbers and dates in the provider locale', () => {
    render(
      <UiProvider locale="de-DE">
        <Text condition={{ field: 'pages', operator: 'at-least', value: 1200 }} />
        <Text condition={{ field: 'published', operator: 'before', value: '2024-03-02' }} />
      </UiProvider>,
    );
    const [pages, published] = screen.getAllByRole('status');
    expect(pages).toHaveTextContent('Pages is at least 1.200');
    expect(published).toHaveTextContent('Published is before 02.03.2024');
  });
});
