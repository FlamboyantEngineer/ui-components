import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { FilterConditionFields, type FilterEditorLabelLayout } from './filter-editor.js';
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
  readers: {
    id: 'readers',
    label: 'Reader',
    type: 'person',
    options: [
      { value: 'maria', label: 'Maria Santos', description: 'Editor' },
      { value: 'jon', label: 'Jon Berg' },
      { value: 'zoe', label: 'Zoe\u0308 Adler' },
    ],
  },
  available: { id: 'available', label: 'Available', type: 'boolean' },
};

function Editor({
  initial,
  onChange,
  labelLayout = 'label-control',
}: {
  initial: FilterCondition;
  onChange?: (condition: FilterCondition) => void;
  labelLayout?: FilterEditorLabelLayout;
}) {
  const [condition, setCondition] = useState(initial);
  return (
    <div role="group" aria-label="Editor">
      <FilterConditionFields
        field={requireDefined(fields[condition.field])}
        condition={condition}
        onChange={(next) => {
          setCondition(next);
          onChange?.(next);
        }}
        labelLayout={labelLayout}
        slotClass={(slot) => `part-${slot}`}
      />
    </div>
  );
}

const slot = (name: string) =>
  screen.getByRole('group', { name: 'Editor' }).querySelector(`.part-${name}`);

describe('FilterConditionFields', () => {
  it('UIC-FILTER-BAR-2.2 edits text and changes the operator', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Editor initial={{ field: 'title', operator: 'contains', value: '' }} onChange={onChange} />,
    );
    await user.type(screen.getByRole('textbox', { name: 'Value' }), 'sea');
    expect(onChange).toHaveBeenLastCalledWith({
      field: 'title',
      operator: 'contains',
      value: 'sea',
    });
    expect(slot('value')).toHaveClass('ui-text-field');
    await user.click(screen.getByRole('button', { name: /Condition/ }));
    await user.click(await screen.findByRole('option', { name: 'starts with' }));
    expect(onChange).toHaveBeenLastCalledWith({
      field: 'title',
      operator: 'starts-with',
      value: 'sea',
    });
    expect(slot('operator')).toHaveClass('ui-select-field');
    await user.click(screen.getByRole('button', { name: /Condition/ }));
    await user.click(await screen.findByRole('option', { name: 'is empty' }));
    expect(onChange).toHaveBeenLastCalledWith({ field: 'title', operator: 'empty', value: null });
    expect(slot('value')).toBeNull();
  });

  it('UIC-FILTER-BAR-2.2 edits a number and a range of numbers', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(
      <Editor
        initial={{ field: 'pages', operator: 'at-least', value: null }}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Value' });
    await user.type(input, '300');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith({ field: 'pages', operator: 'at-least', value: 300 });
    unmount();
    render(
      <Editor
        initial={{ field: 'pages', operator: 'between', value: { min: 2, max: null } }}
        onChange={onChange}
      />,
    );
    const range = screen.getByRole('group', { name: 'Value' });
    expect(range).toHaveClass('part-value');
    await user.type(within(range).getByRole('textbox', { name: 'To' }), '5');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith({
      field: 'pages',
      operator: 'between',
      value: { min: 2, max: 5 },
    });
  });

  it('UIC-FILTER-BAR-2.2 edits a date and a range of dates', () => {
    const { unmount } = render(
      <Editor initial={{ field: 'published', operator: 'after', value: '2024-03-02' }} />,
    );
    expect(slot('value')).toHaveClass('ui-date-time-field');
    expect(slot('value')).toHaveAttribute('data-mode', 'date');
    unmount();
    render(
      <Editor
        initial={{
          field: 'published',
          operator: 'between',
          value: { start: '2024-03-02', end: '2024-03-09' },
        }}
      />,
    );
    expect(slot('value')).toHaveAttribute('data-mode', 'date-range');
  });

  it('UIC-FILTER-BAR-2.2 chooses options for a choice field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Editor initial={{ field: 'genre', operator: 'any-of', value: [] }} onChange={onChange} />,
    );
    expect(slot('value')).toHaveAttribute('data-selection-mode', 'multiple');
    await user.click(screen.getByRole('button', { name: /Value/ }));
    await user.click(await screen.findByRole('option', { name: 'Travel' }));
    expect(onChange).toHaveBeenLastCalledWith({
      field: 'genre',
      operator: 'any-of',
      value: ['travel'],
    });
  });

  it.each<[string, FilterCondition]>([
    ['a choice list of null', { field: 'genre', operator: 'any-of', value: null }],
    ['a person list of null', { field: 'readers', operator: 'any-of', value: null }],
    ['a number as text', { field: 'pages', operator: 'equals', value: 'many' }],
    ['a range of null', { field: 'pages', operator: 'between', value: null }],
    ['a date as a number', { field: 'published', operator: 'equals', value: 3 }],
    ['text as a list', { field: 'title', operator: 'contains', value: ['sea'] }],
    ['a boolean as text', { field: 'available', operator: 'equals', value: 'yes' }],
  ])('UIC-FILTER-BAR-2.2 shows %s as an empty value instead of failing', (_, condition) => {
    render(<Editor initial={condition} />);
    expect(slot('value')).toBeInTheDocument();
  });

  it('UIC-FILTER-BAR-2.2 corrects a list of null through the editor', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Editor initial={{ field: 'genre', operator: 'any-of', value: null }} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /Value/ }));
    await user.click(await screen.findByRole('option', { name: 'Travel' }));
    expect(onChange).toHaveBeenLastCalledWith({
      field: 'genre',
      operator: 'any-of',
      value: ['travel'],
    });
  });

  it('UIC-FILTER-BAR-2.2 keeps an open editor whose field turns from number to choice', () => {
    const condition: FilterCondition = { field: 'pages', operator: 'any-of', value: 3 };
    const props = {
      condition,
      onChange: () => {},
      labelLayout: 'label-control' as const,
      slotClass: (part: string) => `part-${part}`,
    };
    const view = render(
      <FilterConditionFields {...props} field={{ id: 'pages', label: 'Pages', type: 'number' }} />,
    );
    view.rerender(
      <FilterConditionFields
        {...props}
        field={{
          id: 'pages',
          label: 'Pages',
          type: 'choice',
          options: [{ value: '3', label: 'Three' }],
        }}
      />,
    );
    expect(screen.getByRole('button', { name: /Value/ })).toBeInTheDocument();
  });

  it('UIC-FILTER-BAR-2.2 searches a person field’s own people', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Editor
        initial={{ field: 'readers', operator: 'none-of', value: [] }}
        onChange={onChange}
        labelLayout="control-only"
      />,
    );
    expect(slot('value')).toHaveClass('ui-people-picker');
    const input = screen.getByRole('combobox', { name: 'Value' });
    await user.type(input, 'mar');
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)));
    await user.click(await screen.findByRole('option', { name: /Maria Santos/ }));
    expect(onChange).toHaveBeenLastCalledWith({
      field: 'readers',
      operator: 'none-of',
      value: ['maria'],
    });
  });

  it('UIC-FILTER-BAR-2.2 searches people whatever the composition and case of their names', async () => {
    const user = userEvent.setup();
    render(
      <Editor
        initial={{ field: 'readers', operator: 'any-of', value: [] }}
        labelLayout="control-only"
      />,
    );
    await user.type(screen.getByRole('combobox', { name: 'Value' }), 'ZOË');
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)));
    expect(await screen.findByRole('option', { name: /Adler/ })).toBeInTheDocument();
  });

  it('UIC-FILTER-BAR-2.2 names the chosen people of a person value before any search', () => {
    render(<Editor initial={{ field: 'readers', operator: 'any-of', value: ['maria'] }} />);
    const chips = requireDefined(slot('value')).querySelector('.ui-combobox__chips');
    expect(chips).toHaveTextContent('Maria Santos');
    expect(chips).not.toHaveTextContent('maria');
  });

  it('UIC-FILTER-BAR-2.2 picks true or false, with no operator select for one operator', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Editor
        initial={{ field: 'available', operator: 'equals', value: true }}
        onChange={onChange}
      />,
    );
    expect(screen.queryByRole('button', { name: /Condition/ })).not.toBeInTheDocument();
    expect(slot('value')).toHaveAttribute('data-variant', 'segmented');
    await user.click(screen.getByRole('radio', { name: 'False' }));
    expect(onChange).toHaveBeenLastCalledWith({
      field: 'available',
      operator: 'equals',
      value: false,
    });
  });
});
