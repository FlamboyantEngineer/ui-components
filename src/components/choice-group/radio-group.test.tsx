import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { RadioGroup, RadioGroupItem } from './radio-group.js';

it('UIC-CHOICE-GROUP-5.1 exposes radio parts with native single selection and form values', async () => {
  const user = userEvent.setup();
  const onCommit = vi.fn();
  const onSubmit = vi.fn((event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    return new FormData(event.currentTarget).get('view');
  });
  render(
    <form onSubmit={onSubmit}>
      <RadioGroup label="View" name="view" defaultValue="grid" onCommit={onCommit}>
        <RadioGroupItem value="grid">Grid</RadioGroupItem>
        <RadioGroupItem value="list" description="Shows more detail">
          List
        </RadioGroupItem>
      </RadioGroup>
      <button type="submit">Save</button>
    </form>,
  );
  const group = screen.getByRole('radiogroup', { name: 'View' });
  const grid = within(group).getByRole('radio', { name: 'Grid' });
  const list = within(group).getByRole('radio', { name: 'List' });
  expect(grid).toBeChecked();
  await user.tab();
  expect(grid).toHaveFocus();
  await user.keyboard('{ArrowDown}');
  expect(list).toBeChecked();
  expect(list).toHaveAccessibleDescription('Shows more detail');
  expect(onCommit).toHaveBeenCalledWith('list');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSubmit).toHaveReturnedWith('list');
});
