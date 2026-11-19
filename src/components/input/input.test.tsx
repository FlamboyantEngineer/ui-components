import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Input } from './input.js';

it('UIC-INPUT-1.1 retains native identity, editing, invalidity and form values', async () => {
  const user = userEvent.setup();
  const ref = createRef<HTMLInputElement>();
  const { container } = render(
    <form aria-label="Profile">
      <label htmlFor="name">Name</label>
      <Input id="name" name="name" ref={ref} className="caller" required aria-invalid="true" />
    </form>,
  );
  const input = screen.getByRole('textbox', { name: 'Name' });
  expect(ref.current).toBe(input);
  expect(input).toHaveClass('ui-input', 'caller');
  expect(input).toBeRequired();
  expect(input).toHaveAttribute('data-invalid', 'true');
  await user.tab();
  await user.keyboard('River');
  expect(input).toHaveFocus();
  expect(input).toHaveAttribute('data-focused', 'true');
  expect(screen.getByRole('form', { name: 'Profile' })).toHaveFormValues({ name: 'River' });
  expectHooksMatchSpec(container, 'INPUT');
});
