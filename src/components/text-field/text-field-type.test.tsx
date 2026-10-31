import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Form } from '../form/form.js';
import { TextField } from './text-field.js';

describe('TextField type checks', () => {
  it.each([
    {
      type: 'email',
      bad: 'not-email',
      good: 'ada@example.com',
      message: 'Enter an email address.',
    },
    {
      type: 'url',
      bad: 'example',
      good: 'https://example.com/a',
      message: 'Enter a full URL, such as https://example.com.',
    },
  ] as const)(
    'UIC-TEXT-FIELD-2.3 checks a $type value in the field and its form',
    async ({ type, bad, good, message }) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
      const { container } = render(
        <Form aria-label="Contact" validationBehavior="aria" onSubmit={onSubmit}>
          <TextField label="Contact" name="contact" type={type} defaultValue={bad} />
          <button type="submit">Send</button>
        </Form>,
      );
      const input = screen.getByRole('textbox', { name: 'Contact' });
      await user.click(screen.getByRole('button', { name: 'Send' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription(message);
      await user.clear(input);
      await user.type(input, good);
      await user.click(screen.getByRole('button', { name: 'Send' }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
      await user.clear(input);
      await user.click(screen.getByRole('button', { name: 'Send' }));
      expect(onSubmit).toHaveBeenCalledTimes(2);
      expect(container.querySelector('.ui-text-field')).toHaveAttribute('data-validation', 'valid');
    },
  );

  it('UIC-TEXT-FIELD-4.2 submits a valid email that shows a display value', () => {
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    render(
      <Form aria-label="Owner" onSubmit={onSubmit}>
        <TextField
          label="Owner"
          name="owner"
          type="email"
          defaultValue="ada@example.com"
          displayValue="Account owner"
        />
      </Form>,
    );
    const input = screen.getByRole('textbox', { name: 'Owner' });
    expect(input).toHaveValue('Account owner');
    expect(input).toHaveAttribute('type', 'text');
    const form = screen.getByRole('form', { name: 'Owner' }) as HTMLFormElement;
    act(() => form.requestSubmit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(new FormData(form).get('owner')).toBe('ada@example.com');
  });
});
