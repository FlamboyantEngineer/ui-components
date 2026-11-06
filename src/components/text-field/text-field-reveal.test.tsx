import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextField, type TextFieldProps } from './text-field.js';

function passwordInput(name: string): HTMLInputElement {
  const label = screen.getByText(name, { selector: 'label' });
  return document.getElementById(label.getAttribute('for') ?? '') as HTMLInputElement;
}

/** A password field shown or hidden from the host's own switch, beside the built-in button. */
function HostRevealed(props: Partial<TextFieldProps>) {
  const [isRevealed, setIsRevealed] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setIsRevealed((shown) => !shown)}>
        Toggle
      </button>
      <TextField
        label="Password"
        type="password"
        isRevealed={isRevealed}
        onRevealChange={setIsRevealed}
        {...props}
      />
    </>
  );
}

describe('TextField reveal state', () => {
  it('UIC-TEXT-FIELD-3.5 starts from defaultRevealed and reports changes', async () => {
    const user = userEvent.setup();
    const onRevealChange = vi.fn();
    render(
      <TextField
        label="Password"
        type="password"
        allowsReveal
        defaultRevealed
        defaultValue="s3cret"
        onRevealChange={onRevealChange}
      />,
    );
    const input = passwordInput('Password');
    const reveal = screen.getByRole('button', { name: 'Show Password' });
    expect(input).toHaveAttribute('type', 'text');
    expect(reveal).toHaveAttribute('aria-pressed', 'true');
    await user.click(reveal);
    expect(onRevealChange).toHaveBeenCalledWith(false);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('UIC-TEXT-FIELD-3.5 follows a host control and keeps the input, its value and selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const ref = vi.fn();
    render(
      <HostRevealed
        allowsReveal
        defaultValue="correct horse"
        autoComplete="current-password"
        name="secret"
        inputRef={ref}
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    const input = passwordInput('Password');
    input.setSelectionRange(2, 5);
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Show Password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(passwordInput('Password')).toBe(input);
    expect(input).toHaveValue('correct horse');
    expect(input).toHaveAttribute('autocomplete', 'current-password');
    expect(input).toHaveAttribute('name', 'secret');
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 5]);
    await user.click(screen.getByRole('button', { name: 'Show Password' }));
    expect(input).toHaveAttribute('type', 'password');
    expect(ref).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('UIC-TEXT-FIELD-3.5 shows the text from a host control without the built-in button', async () => {
    const user = userEvent.setup();
    render(<HostRevealed defaultValue="s3cret" />);
    expect(screen.queryByRole('button', { name: 'Show Password' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(passwordInput('Password')).toHaveAttribute('type', 'text');
  });

  it('UIC-TEXT-FIELD-3.5 stays masked when the host refuses the change', async () => {
    const user = userEvent.setup();
    const onRevealChange = vi.fn();
    render(
      <TextField
        label="Password"
        type="password"
        allowsReveal
        isRevealed={false}
        onRevealChange={onRevealChange}
      />,
    );
    const reveal = screen.getByRole('button', { name: 'Show Password' });
    await user.click(reveal);
    expect(onRevealChange).toHaveBeenCalledWith(true);
    expect(passwordInput('Password')).toHaveAttribute('type', 'password');
    expect(reveal).toHaveAttribute('aria-pressed', 'false');
  });

  it('UIC-TEXT-FIELD-3.5 keeps the state across type, disabled and read-only changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TextField label="Password" type="password" allowsReveal isRevealed />,
    );
    const input = passwordInput('Password');
    rerender(<TextField label="Password" type="password" allowsReveal isRevealed isDisabled />);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Show Password' })).toBeDisabled();
    rerender(<TextField label="Password" type="password" allowsReveal isRevealed isReadOnly />);
    expect(screen.getByRole('button', { name: 'Show Password' })).toBeEnabled();
    rerender(<TextField label="Password" type="text" allowsReveal />);
    expect(screen.queryByRole('button', { name: 'Show Password' })).not.toBeInTheDocument();
    rerender(<TextField label="Password" type="password" allowsReveal />);
    const reveal = screen.getByRole('button', { name: 'Show Password' });
    await user.click(reveal);
    rerender(<TextField label="Password" type="email" allowsReveal />);
    expect(input).toHaveAttribute('type', 'email');
    rerender(<TextField label="Password" type="password" allowsReveal />);
    expect(input).toHaveAttribute('type', 'text');
  });

  it('UIC-TEXT-FIELD-3.5 holds one state per field', async () => {
    const user = userEvent.setup();
    render(
      <>
        <TextField label="Current" type="password" allowsReveal />
        <TextField label="New" type="password" allowsReveal />
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Show Current' }));
    expect(passwordInput('Current')).toHaveAttribute('type', 'text');
    expect(passwordInput('New')).toHaveAttribute('type', 'password');
  });
});
