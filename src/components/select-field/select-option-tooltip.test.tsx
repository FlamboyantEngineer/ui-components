import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SelectField } from './select-field.js';

const options = [
  { id: 'body', label: 'Body', shortcut: 'Ctrl+Alt+0', tooltip: 'Body (Ctrl+Alt+0)' },
  { id: 'title', label: 'Title', shortcut: 'Ctrl+Alt+1', tooltip: 'Title (Ctrl+Alt+1)' },
  { id: 'note', label: 'Note' },
];

describe('SelectField option hints', () => {
  it('UIC-FIELD-11.3 shows an option hint while its row is hovered, and none for an option without one', async () => {
    const user = userEvent.setup();
    render(<SelectField label="Style" options={options} value="body" />);
    await user.click(screen.getByRole('button', { name: /Style$/ }));
    await user.hover(screen.getByRole('option', { name: /^Title/ }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Title (Ctrl+Alt+1)');
    await user.hover(screen.getByRole('option', { name: /^Note/ }));
    await expect.poll(() => screen.queryByRole('tooltip')).toBeNull();
  });

  it('UIC-FIELD-11.3 shows the hint of the option keyboard focus reaches, describing it', async () => {
    const user = userEvent.setup();
    render(<SelectField label="Style" options={options} value="body" />);
    screen.getByRole('button', { name: /Style$/ }).focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    const title = screen.getByRole('option', { name: /^Title/ });
    expect(title).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Title (Ctrl+Alt+1)');
    expect(title).toHaveAccessibleDescription('Title (Ctrl+Alt+1)');
  });
});
