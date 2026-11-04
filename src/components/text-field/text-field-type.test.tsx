import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Form } from '../form/form.js';
import { TextField } from './text-field.js';

async function withoutUrlCanParse(run: () => void | Promise<void>) {
  const descriptor = Object.getOwnPropertyDescriptor(URL, 'canParse');
  Object.defineProperty(URL, 'canParse', { configurable: true, value: undefined });
  try {
    await run();
  } finally {
    if (descriptor) Object.defineProperty(URL, 'canParse', descriptor);
    else Reflect.deleteProperty(URL, 'canParse');
  }
}

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

  it.each([
    { value: 'https://example.com/a', isValid: true },
    { value: '  https://example.com/a  ', isValid: true },
    { value: 'mailto:ada@example.com', isValid: true },
    { value: 'example.com', isValid: false },
    { value: '/about', isValid: false },
    { value: '//example.com', isValid: false },
  ])(
    'UIC-TEXT-FIELD-2.3 validates initial URL "$value" without URL.canParse',
    async ({ value, isValid }) => {
      await withoutUrlCanParse(() => {
        render(
          <TextField label="Website" type="url" defaultValue={value} validationMode="immediate" />,
        );
        const input = screen.getByRole('textbox', { name: 'Website' });
        if (isValid) {
          expect(input).not.toHaveAttribute('aria-invalid');
          expect(input).not.toHaveAccessibleDescription();
        } else {
          expect(input).toHaveAttribute('aria-invalid', 'true');
          expect(input).toHaveAccessibleDescription(
            'Enter a full URL, such as https://example.com.',
          );
        }
      });
    },
  );

  it('UIC-TEXT-FIELD-2.3 validates the first URL edit and clears feedback without URL.canParse', async () => {
    await withoutUrlCanParse(async () => {
      const user = userEvent.setup();
      render(<TextField label="Website" type="url" validationMode="immediate" />);
      const input = screen.getByRole('textbox', { name: 'Website' });
      expect(input).not.toHaveAttribute('aria-invalid');
      await user.type(input, 'h');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription('Enter a full URL, such as https://example.com.');
      await user.type(input, 'ttps://example.com');
      expect(input).not.toHaveAttribute('aria-invalid');
      expect(input).not.toHaveAccessibleDescription();
      await user.clear(input);
      expect(input).not.toHaveAttribute('aria-invalid');
      expect(input).not.toHaveAccessibleDescription();
    });
  });

  it('UIC-TEXT-FIELD-2.3 checks a URL value in its form without URL.canParse', async () => {
    await withoutUrlCanParse(async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
      render(
        <Form aria-label="Contact" validationBehavior="aria" onSubmit={onSubmit}>
          <TextField label="Website" name="website" type="url" defaultValue="example.com" />
          <button type="submit">Send</button>
        </Form>,
      );
      const input = screen.getByRole('textbox', { name: 'Website' });
      const send = screen.getByRole('button', { name: 'Send' });
      await user.click(send);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription('Enter a full URL, such as https://example.com.');
      await user.clear(input);
      await user.type(input, 'https://example.com');
      await user.click(send);
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(input).not.toHaveAttribute('aria-invalid');
      await user.clear(input);
      await user.click(send);
      expect(onSubmit).toHaveBeenCalledTimes(2);
      expect(input).not.toHaveAttribute('aria-invalid');
    });
  });

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
