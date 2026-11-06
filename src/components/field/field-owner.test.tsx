import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, type ReactNode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '../text-field/text-field.js';
import type { FieldControlHandle } from './field-form.js';
import { FieldScopeContext, useRevealScope } from './field-scope.js';

/** A container that hides its fields until revealed, as a collapsed section does. */
function Collapsed({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const scope = useRevealScope(() => setOpen(true));
  return (
    <FieldScopeContext value={scope}>
      <section aria-label="Details" hidden={!isOpen}>
        {children}
      </section>
    </FieldScopeContext>
  );
}

describe('Field owner hooks', () => {
  it('UIC-FIELD-12.1 calls onLeave once focus leaves the field, not when it moves to its own buttons', async () => {
    const user = userEvent.setup();
    const onLeave = vi.fn();
    render(
      <>
        <TextField label="Name" defaultValue="Ann" onLeave={onLeave} />
        <button type="button">After</button>
      </>,
    );
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'e');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Restore Name' })).toHaveFocus();
    expect(onLeave).not.toHaveBeenCalled();
    await user.tab();
    await waitFor(() => expect(onLeave).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('UIC-FIELD-12.2 focuses the control through controlRef, revealing what hides the field first', async () => {
    const user = userEvent.setup();
    const handle = createRef<FieldControlHandle>();
    render(
      <>
        <Collapsed>
          <TextField label="Name" controlRef={handle} />
        </Collapsed>
        <button type="button" onClick={() => handle.current?.focus()}>
          Find the name
        </button>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Find the name' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus());
    expect(screen.getByRole('region', { name: 'Details' })).toBeVisible();
  });

  it('UIC-FIELD-12.3 shows the owner error first, whatever the validation mode, until the owner clears it', () => {
    const { rerender } = render(
      <TextField
        label="Name"
        validationMode="submit"
        isRequired
        errorMessage="Pick another name."
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Pick another name.');
    expect(screen.queryByText('A value is required.')).not.toBeInTheDocument();
    rerender(<TextField label="Name" validationMode="submit" isRequired errorMessage="" />);
    expect(input).not.toHaveAttribute('aria-invalid');
    rerender(<TextField label="Name" errorMessage="Pick another name." isRequired />);
    expect(screen.getByText('Pick another name.')).toBeInTheDocument();
    expect(input.closest('.ui-field')).toHaveAttribute('data-validation', 'invalid');
  });
});
