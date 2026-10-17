import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { FieldPreviousValue } from './field.js';

describe('FieldPreviousValue', () => {
  it('UIC-FIELD-8.1 keeps the previous value readable in a del element', () => {
    const { container } = render(
      <FieldPreviousValue className="caller" id="before" data-testid="marker">
        <svg data-testid="swatch" />
        Apple
      </FieldPreviousValue>,
    );
    const marker = screen.getByTestId('marker');
    expect(marker).toHaveClass('ui-field-previous-value', 'caller');
    expect(marker).toHaveAttribute('id', 'before');
    const value = marker.querySelector('del');
    expect(value).toHaveClass('ui-field-previous-value__value');
    expect(value).toHaveTextContent('Apple');
    expect(value).not.toHaveAttribute('aria-hidden');
    expect(value).toContainElement(screen.getByTestId('swatch'));
    expect(screen.queryByRole('button')).toBeNull();
    expectHooksMatchSpec(container, 'FIELD', { slots: ['ui-field-previous-value__value'] });
  });

  it('UIC-FIELD-8.2 restores the value once per press and keeps pointer focus', async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(
      <>
        <input aria-label="Draft" />
        <FieldPreviousValue onRestore={onRestore}>Apple</FieldPreviousValue>
      </>,
    );
    const draft = screen.getByRole('textbox', { name: 'Draft' });
    draft.focus();
    await user.click(screen.getByRole('button', { name: 'Restore Apple' }));
    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(draft).toHaveFocus();
  });

  it('UIC-FIELD-8.2 names the restore button from restoreLabel and disables it when locked', async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(
      <FieldPreviousValue onRestore={onRestore} restoreLabel="Pear" isDisabled>
        <strong>Pear</strong>
      </FieldPreviousValue>,
    );
    const button = screen.getByRole('button', { name: 'Restore Pear' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onRestore).not.toHaveBeenCalled();
  });
});
