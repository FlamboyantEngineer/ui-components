import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TextField } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import type { FieldLabelLayout } from './field.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

function parts(container: HTMLElement) {
  return Array.from(root(container)?.children ?? []).map((node) =>
    node.className.replace(/^.*ui-field__([a-z-]+).*$/, '$1'),
  );
}

describe('Field', () => {
  it('UIC-FIELD-1.1 labels the control it renders and focuses it from the label', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextField id="fruit" />);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    const label = container.querySelector('label');
    expect(label).toHaveClass('ui-field__label');
    expect(label).toHaveAttribute('for', 'fruit-control');
    expect(input).toHaveAttribute('id', 'fruit-control');
    expect(input).toHaveAttribute('aria-labelledby', 'fruit-label');
    await user.click(screen.getByText('Fruit'));
    expect(input).toHaveFocus();
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control', 'message'] });
  });

  it('UIC-FIELD-1.1 highlights the label text under a text match scope', () => {
    render(
      <TextMatchProvider query="ap">
        <TextField label="Grape" />
      </TextMatchProvider>,
    );
    expect(screen.getByText('ap').tagName).toBe('MARK');
    expect(screen.getByRole('textbox', { name: 'Grape' })).toBeInTheDocument();
  });

  it('UIC-FIELD-1.2 places the label for each layout and keeps the control named', () => {
    const order: Record<FieldLabelLayout, string[]> = {
      'label-control': ['label', 'control', 'message'],
      'control-label': ['control', 'label', 'message'],
      'label-colon-control': ['label', 'control', 'message'],
      'control-only': ['control', 'message'],
    };
    for (const layout of Object.keys(order) as FieldLabelLayout[]) {
      const { container, unmount } = render(<TextField labelLayout={layout} />);
      expect(root(container)).toHaveAttribute('data-label-layout', layout);
      expect(parts(container)).toEqual(order[layout]);
      const input = screen.getByRole('textbox', { name: 'Fruit' });
      expect(input.hasAttribute('aria-label')).toBe(layout === 'control-only');
      expect(input.hasAttribute('aria-labelledby')).toBe(layout !== 'control-only');
      const colon = container.querySelector('.ui-field__colon');
      expect(Boolean(colon)).toBe(layout === 'label-colon-control');
      if (colon) expect(colon).toHaveAttribute('aria-hidden', 'true');
      expectHooksMatchSpec(container, 'FIELD');
      unmount();
    }
  });

  it('UIC-FIELD-1.3 UIC-FIELD-1.6 describes the control with the description then the decoration', () => {
    const { container } = render(
      <TextField
        id="fruit"
        description="Pick a seasonal fruit."
        decoration={<span>Imported</span>}
      />,
    );
    expect(parts(container)).toEqual(['label', 'control', 'decoration', 'description', 'message']);
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'fruit-description fruit-decoration',
    );
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'Pick a seasonal fruit. Imported',
    );
    expectHooksMatchSpec(container, 'FIELD', { slots: ['description', 'decoration'] });
  });

  it('UIC-FIELD-1.4 draws a help button whose tooltip and description carry the help', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextField help="Ripe fruit only." />);
    const button = screen.getByRole('button', { name: 'Help for Fruit' });
    expect(button).toHaveClass('ui-field__help', 'ui-icon-button');
    expect(button).toHaveAccessibleDescription('Ripe fruit only.');
    expect(button.querySelector('[data-glyph="help"]')).not.toBeNull();
    await user.tab();
    await user.tab();
    expect(button).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Ripe fruit only.');
    expectHooksMatchSpec(container, 'FIELD', { slots: ['help'] });
  });

  it('UIC-FIELD-1.5 marks a required field without naming the asterisk', () => {
    const { container } = render(<TextField options={{ isRequired: true, defaultValue: 'Fig' }} />);
    const marker = container.querySelector('.ui-field__label .ui-field__required');
    expect(marker).toHaveTextContent('*');
    expect(marker).toHaveAttribute('aria-hidden', 'true');
    expect(root(container)).toHaveAttribute('data-required', 'true');
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    expect(input).toHaveAttribute('aria-required', 'true');
    expectHooksMatchSpec(container, 'FIELD', { slots: ['required'] });
  });

  it('UIC-FIELD-1.7 locks the control and hides dirty state while read-only or disabled', () => {
    const options = { committedValue: 'Fig', value: 'Plum' };
    const { container, rerender } = render(
      <TextField options={{ ...options, isReadOnly: true }} />,
    );
    expect(root(container)).toHaveAttribute('data-readonly', 'true');
    expect(root(container)).not.toHaveAttribute('data-dirty');
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: 'Restore Fruit' })).toBeNull();
    rerender(<TextField options={{ ...options, isDisabled: true }} />);
    expect(root(container)).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('textbox')).toBeDisabled();
    expectHooksMatchSpec(container, 'FIELD');
  });

  it('UIC-FIELD-1.8 appends the caller class, forwards data attributes and derives part ids', () => {
    const { container } = render(
      <TextField id="city" className="caller" data-testid="probe" description="Where" />,
    );
    const field = root(container);
    expect(field).toHaveClass('ui-field', 'caller');
    expect(field).toHaveAttribute('id', 'city');
    expect(field).toHaveAttribute('data-testid', 'probe');
    expect(container.querySelector('#city-description')).toHaveClass('ui-field__description');
    expect(container.querySelector('#city-message')).toHaveClass('ui-field__message');
    const generated = render(<TextField label="Town" />).container;
    const input = generated.querySelector('input');
    expect(input?.id).toMatch(/-control$/);
    expect(input?.getAttribute('aria-labelledby')).toBe(input?.id.replace(/-control$/, '-label'));
    expect(root(generated)).not.toHaveAttribute('id');
  });

  it('UIC-FIELD-2.3 publishes dirty state while the value differs from the committed value', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextField options={{ committedValue: 'Fig' }} />);
    expect(root(container)).not.toHaveAttribute('data-dirty');
    await user.type(screen.getByRole('textbox'), 's');
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.keyboard('{Backspace}');
    expect(root(container)).not.toHaveAttribute('data-dirty');
  });

  it('UIC-FIELD-3.2 UIC-FIELD-3.3 publishes each status with its message and control ARIA', () => {
    const validate = (value: string) => {
      if (value === 'Stone') return { severity: 'error' as const, message: 'Not a fruit.' };
      if (value === 'Lime') return { severity: 'warning' as const, message: 'Very sour.' };
      return null;
    };
    const { container, rerender } = render(
      <TextField id="f" description="Any fruit" options={{ value: 'Kiwi', validate }} />,
    );
    const input = screen.getByRole('textbox');
    const message = container.querySelector('.ui-field__message');
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    expect(message).toBeEmptyDOMElement();
    expect(message).not.toHaveAttribute('data-severity');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAttribute('aria-describedby', 'f-description');

    rerender(<TextField id="f" description="Any fruit" options={{ value: 'Stone', validate }} />);
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
    expect(message).toHaveTextContent('Not a fruit.');
    expect(message).toHaveAttribute('data-severity', 'error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-errormessage', 'f-message');
    expect(input).toHaveAttribute('aria-describedby', 'f-description f-message');
    expectHooksMatchSpec(container, 'FIELD');

    rerender(<TextField id="f" description="Any fruit" options={{ value: 'Lime', validate }} />);
    expect(root(container)).toHaveAttribute('data-validation', 'warning');
    expect(message).toHaveAttribute('data-severity', 'warning');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-errormessage');
    expect(input).toHaveAccessibleDescription('Any fruit Very sour.');

    rerender(<TextField id="f" options={{ value: 'Kiwi', validate, isPending: true }} />);
    expect(root(container)).toHaveAttribute('data-validation', 'pending');
    expect(message).toHaveTextContent('Validating');
    expect(message).not.toHaveAttribute('data-severity');
    expect(input).toHaveAttribute('aria-describedby', 'f-message');
    expectHooksMatchSpec(container, 'FIELD');
  });

  it('UIC-FIELD-3.6 renders the message from the validation and its issues', () => {
    const validate = (value: string) =>
      value.length > 3
        ? [
            { severity: 'error' as const, message: 'Too long.', validity: 'tooLong' as const },
            { severity: 'error' as const, message: 'Use capitals.' },
          ]
        : null;
    const { container, rerender } = render(
      <TextField
        id="f"
        options={{ value: 'Plum!', validate }}
        renderMessage={(validation, issues) => (
          <ul data-status={validation.status}>
            {issues.map((issue) => (
              <li key={issue.message}>
                {issue.validity === 'tooLong' ? 'Four letters at most.' : issue.message}
              </li>
            ))}
          </ul>
        )}
      />,
    );
    const message = container.querySelector('.ui-field__message');
    expect(message?.querySelector('ul')).toHaveAttribute('data-status', 'invalid');
    expect([...(message?.querySelectorAll('li') ?? [])].map((item) => item.textContent)).toEqual([
      'Four letters at most.',
      'Use capitals.',
    ]);
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'Four letters at most. Use capitals.',
    );
    rerender(
      <TextField id="f" options={{ value: 'Fig', validate }} renderMessage={() => 'Unused'} />,
    );
    expect(message).toBeEmptyDOMElement();
  });

  it('UIC-FIELD-3.4 keeps one polite live region for the messages', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextField options={{ isRequired: true, defaultValue: 'Fig' }} />);
    const region = container.querySelector('.ui-field__message');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    await user.clear(screen.getByRole('textbox'));
    expect(container.querySelector('.ui-field__message')).toBe(region);
    expect(region).toHaveTextContent('A value is required.');
  });

  it('UIC-FIELD-4.1 restores the committed value and keeps focus on the control', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextField options={{ committedValue: 'Fig' }} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 's');
    const restore = screen.getByRole('button', { name: 'Restore Fruit' });
    expect(restore).toHaveClass('ui-field-restore-button');
    expectHooksMatchSpec(container, 'FIELD');
    await user.click(restore);
    expect(input).toHaveValue('Fig');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Restore Fruit' })).toBeNull();
  });

  it('UIC-FIELD-4.1 UIC-SLOT-REGISTRY-1.2 moves keyboard focus to the control before the button leaves', async () => {
    const user = userEvent.setup();
    // The caller controls the committed value, so leaving the input keeps the field dirty.
    render(<TextField options={{ committedValue: 'Fig' }} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 's');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Restore Fruit' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(input).toHaveValue('Fig');
    expect(input).toHaveFocus();
    act(() => input.blur());
  });
});
