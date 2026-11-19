import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Textarea } from './textarea.js';

it('UIC-TEXTAREA-1.1 preserves native ref, rows and multiline editing', async () => {
  const user = userEvent.setup();
  const ref = createRef<HTMLTextAreaElement>();
  const { container } = render(
    <Textarea aria-label="Notes" defaultValue="First" rows={3} maxLength={12} ref={ref} />,
  );
  const textarea = screen.getByRole('textbox', { name: 'Notes' });
  expect(ref.current).toBe(textarea);
  expect(textarea).toHaveAttribute('rows', '3');
  expect(textarea).toHaveAttribute('maxlength', '12');
  await user.tab();
  await user.keyboard('{End}{Enter}Second');
  expect(textarea).toHaveValue('First\nSecond');
  expect(textarea).toHaveAttribute('data-focused', 'true');
  expectHooksMatchSpec(container, 'TEXTAREA');
});
