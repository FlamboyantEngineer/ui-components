import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TextField } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { FieldValidation } from './field.js';

const tooltip = () => document.querySelector<HTMLElement>('.ui-field__message-tooltip');

/** Too short below three characters; a digit is a second issue. */
const options = {
  defaultValue: 'ab',
  validationMode: 'immediate' as const,
  validate: (value: string) => [
    ...(value.length < 3
      ? [{ severity: 'error' as const, message: 'Use 3 characters or more.' }]
      : []),
    ...(/\d/.test(value) ? [{ severity: 'error' as const, message: 'No digits.' }] : []),
  ],
};

const listIssues = (_validation: FieldValidation, issues: readonly { message: string }[]) => (
  <ul>
    {issues.map((issue) => (
      <li key={issue.message}>{issue.message}</li>
    ))}
  </ul>
);

describe('Field message tooltip', () => {
  it('UIC-FIELD-3.13 keeps the message region and shows the message in a tooltip while focused', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextField options={options} messageDisplay="tooltip" />);
    const root = container.querySelector('.ui-field');
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    expect(root).toHaveAttribute('data-message-display', 'tooltip');
    // The region still describes the control and announces; the tooltip waits for focus or hover.
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Use 3 characters or more.');
    expect(tooltip()).toBeNull();
    await user.click(input);
    expect(tooltip()).toHaveTextContent('Use 3 characters or more.');
    expect(tooltip()).toHaveAttribute('data-severity', 'error');
    expect(tooltip()).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(document.body, 'FIELD', { slots: ['message-tooltip'] });
    // Valid again: no message, no tooltip; invalid again: it shows while focus stays.
    await user.type(input, 'c');
    await waitFor(() => expect(tooltip()).toBeNull());
    await user.type(input, '1');
    expect(tooltip()).toHaveTextContent('No digits.');
    // Leaving the field, by focus and pointer, hides it.
    await user.click(document.body);
    await waitFor(() => expect(tooltip()).toBeNull());
  });

  it('UIC-FIELD-3.13 hides on Escape until the field is entered again', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextField options={options} messageDisplay="tooltip" />);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.click(input);
    expect(tooltip()).not.toBeNull();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(tooltip()).toBeNull());
    await user.tab();
    const root = container.querySelector('.ui-field');
    await waitFor(() => expect(root).not.toHaveAttribute('data-focused'));
    act(() => input.focus());
    expect(tooltip()).not.toBeNull();
  });

  it('UIC-FIELD-3.13 shows while the pointer rests on the field and lists every issue', async () => {
    const user = userEvent.setup();
    render(
      <TextField
        options={{ ...options, defaultValue: '1' }}
        messageDisplay="tooltip"
        renderMessage={listIssues}
      />,
    );
    await user.hover(screen.getByText('Fruit'));
    expect(tooltip()?.querySelectorAll('li')).toHaveLength(2);
    await user.unhover(screen.getByText('Fruit'));
    await waitFor(() => expect(tooltip()).toBeNull());
  });

  it('UIC-FIELD-3.13 draws no tooltip with the inline message', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextField options={options} />);
    expect(container.querySelector('.ui-field')).toHaveAttribute('data-message-display', 'inline');
    await user.click(screen.getByRole('textbox'));
    expect(tooltip()).toBeNull();
  });
});
