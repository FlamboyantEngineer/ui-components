import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { createTriggerCompletions, type Completion } from '../completion-list/completion-list.js';
import { TextField } from './text-field.js';

const cities: Completion[] = [
  { label: 'Lisbon', description: 'Portugal' },
  { label: 'London', description: 'United Kingdom' },
  { label: 'Lyon', description: 'France' },
];

const people: Completion[] = [
  { label: 'Maria Santos', insertText: '@maria ', kind: 'person' },
  { label: 'Jon Berg', insertText: '@jon ', kind: 'person' },
];

const mentions = createTriggerCompletions([
  {
    character: '@',
    getCompletions: (query) =>
      people.filter(({ label }) => label.toLowerCase().includes(query.toLowerCase())),
  },
]);

const optionTexts = () => screen.queryAllByRole('option').map((option) => option.textContent);

describe('TextField completions', () => {
  it('UIC-TEXT-FIELD-5.1 opens a completion list under the box while the input keeps focus', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextField label="City" completions={cities} />);
    const input = screen.getByRole('textbox', { name: 'City' });
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await user.type(input, 'L');
    const list = await screen.findByRole('listbox', { name: 'Suggestions' });
    expect(optionTexts()).toEqual(['Lisbon Portugal', 'London United Kingdom', 'Lyon France']);
    expect(input).toHaveAttribute('aria-controls', list.id);
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[0]?.id);
    expect(input).toHaveFocus();
    const popover = document.querySelector('.ui-text-field__completions');
    expect(popover).toHaveClass('ui-completion-list');
    expectHooksMatchSpec(document.body, 'TEXT-FIELD', { slots: ['box', 'input', 'completions'] });
    await user.tab();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(container.querySelector('.ui-text-field__completions')).toBeNull();
  });

  it('UIC-TEXT-FIELD-5.1 offers nothing while read-only or without completions', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TextField label="City" completions={cities} isReadOnly />);
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Control>} {/Control}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    rerender(<TextField label="City" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-autocomplete');
  });

  it('UIC-TEXT-FIELD-5.2 inserts on Enter without committing and closes on Escape without reverting', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <TextField
        label="City"
        completions={cities}
        onCommit={onCommit}
        onKeyDown={(event) => onKeyDown(event.key)}
      />,
    );
    const input = screen.getByRole<HTMLInputElement>('textbox');
    await user.type(input, 'Lo');
    await screen.findByRole('listbox', { name: 'Suggestions' });
    onKeyDown.mockClear();
    expect(optionTexts()).toEqual(['London United Kingdom', 'Lisbon Portugal', 'Lyon France']);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(input).toHaveValue('Lisbon');
    expect(input.selectionStart).toBe(6);
    expect(onCommit).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
    await user.keyboard(' L');
    await screen.findByRole('listbox', { name: 'Suggestions' });
    expect(optionTexts()).toHaveLength(3);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('Lisbon L');
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenCalledWith('Lisbon L');
    expect(onKeyDown).toHaveBeenLastCalledWith('Enter');
  });

  it('UIC-TEXT-FIELD-5.2 completes @ mentions in a multiline field with their tokens', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextField label="Note" multiline completions={mentions} onChange={onChange} />);
    const area = screen.getByRole<HTMLTextAreaElement>('textbox');
    await user.type(area, 'Ask @');
    await screen.findByRole('listbox', { name: 'Suggestions' });
    expect(optionTexts()).toEqual(['Maria Santos', 'Jon Berg']);
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('data-kind', 'person');
    await user.keyboard('j');
    expect(optionTexts()).toEqual(['Jon Berg']);
    await user.keyboard('{Tab}');
    expect(area).toHaveValue('Ask @jon ');
    expect(onChange).toHaveBeenLastCalledWith('Ask @jon ');
    expect(area.selectionStart).toBe(9);
    await user.keyboard('or mail me@example');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('UIC-TEXT-FIELD-5.3 draws each completion with renderCompletion', async () => {
    const user = userEvent.setup();
    render(
      <TextField
        label="City"
        completions={cities}
        renderCompletion={(city, { isActive }) => `${isActive ? '> ' : ''}${city.label}`}
      />,
    );
    await user.type(screen.getByRole('textbox'), 'Ly');
    await screen.findByRole('listbox', { name: 'Suggestions' });
    expect(optionTexts()).toEqual(['> Lyon']);
  });
});
