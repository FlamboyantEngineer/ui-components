import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { RelativeDateField } from './relative-date-field.js';

const getNow = () => new Date(2026, 4, 23, 10, 30, 0);

function renderInLocale(element: ReactElement) {
  return render(<UiProvider locale="en-US">{element}</UiProvider>);
}

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-relative-date-field');
}

describe('RelativeDateField', () => {
  it('UIC-RELATIVE-DATE-FIELD-1.1 reads the value relative to now and previews the absolute date', () => {
    const { container } = renderInLocale(
      <RelativeDateField id="due" label="Due" defaultValue="2026-05-24" getNow={getNow} />,
    );
    const field = root(container);
    expect(field).toHaveClass('ui-field', 'ui-relative-date-field');
    expect(field).toHaveAttribute('data-value-kind', 'date');
    expect(field).toHaveAttribute('data-relation', 'future');
    const trigger = screen.getByRole('button', { name: 'Tomorrow Due' });
    expect(trigger).toHaveClass('ui-relative-date-field__trigger');
    expect(trigger).toHaveAttribute('id', 'due-control');
    const preview = container.querySelector('time');
    expect(preview).toHaveClass('ui-relative-date-field__preview');
    expect(preview).toHaveAttribute('datetime', '2026-05-24');
    expect(preview).toHaveTextContent('May 24, 2026');
    expectHooksMatchSpec(container, 'RELATIVE-DATE-FIELD', {
      slots: ['select', 'trigger', 'value', 'chevron', 'preview'],
    });
  });

  it('UIC-RELATIVE-DATE-FIELD-1.2 shows the placeholder for no value or one that is not a date', () => {
    const { container, rerender } = renderInLocale(
      <RelativeDateField label="Due" getNow={getNow} placeholder="No date" />,
    );
    const value = () => container.querySelector('.ui-relative-date-field__value');
    expect(value()).toHaveAttribute('data-placeholder', 'true');
    expect(value()).toHaveTextContent('No date');
    expect(container.querySelector('time')).toBeNull();
    expect(root(container)).not.toHaveAttribute('data-relation');
    rerender(
      <UiProvider locale="en-US">
        <RelativeDateField label="Due" getNow={getNow} value="next-ish" />
      </UiProvider>,
    );
    expect(value()).toHaveTextContent('Select an option');
    rerender(
      <UiProvider locale="en-US">
        <RelativeDateField
          label="Due"
          getNow={getNow}
          valueKind="date-time"
          value="2026-05-23T10:25"
        />
      </UiProvider>,
    );
    expect(value()).toHaveTextContent('5 minutes ago');
    expect(root(container)).toHaveAttribute('data-relation', 'past');
    expect(root(container)).toHaveAttribute('data-value-kind', 'date-time');
  });

  it('UIC-RELATIVE-DATE-FIELD-1.3 lists presets and commits the date each stands for', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <RelativeDateField
        label="Due"
        defaultValue="2026-04-20"
        getNow={getNow}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Due$/ }));
    const listbox = screen.getByRole('listbox');
    const popover = listbox.closest('.ui-relative-date-field__popover') as HTMLElement;
    expect(popover).toHaveAttribute('data-layer', 'dropdown');
    expect(popover.style.zIndex).not.toBe('');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Today',
      'Tomorrow',
      'Yesterday',
      'Next week',
      'Last week',
    ]);
    expectHooksMatchSpec(document.body, 'RELATIVE-DATE-FIELD', {
      slots: ['popover', 'listbox', 'option'],
    });
    await user.click(screen.getByRole('option', { name: 'Tomorrow' }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-05-24');
    expect(screen.getByRole('button', { name: 'Tomorrow Due' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tomorrow Due' }));
    await user.click(screen.getByRole('option', { name: 'Next week' }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-05-30');
  });

  it('UIC-RELATIVE-DATE-FIELD-1.3 takes custom presets and commits local date-times', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <RelativeDateField
        label="Due"
        valueKind="date-time"
        presets={[
          { amount: 3, unit: 'day' },
          { amount: 2, unit: 'month' },
        ]}
        getNow={getNow}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Due$/ }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'In 3 days',
      'In 2 months',
    ]);
    await user.click(screen.getByRole('option', { name: 'In 3 days' }));
    expect(onCommit).toHaveBeenCalledWith('2026-05-26T10:30');
  });

  it('UIC-RELATIVE-DATE-FIELD-1.4 keeps read-only fields closed, disables disabled ones and validates', async () => {
    const user = userEvent.setup();
    const { container, unmount } = renderInLocale(
      <RelativeDateField label="Due" defaultValue="2026-05-24" getNow={getNow} isReadOnly />,
    );
    const trigger = screen.getByRole('button', { name: 'Tomorrow Due' });
    expect(trigger).not.toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(container.querySelector('time')).not.toBeNull();
    unmount();
    const disabled = renderInLocale(
      <RelativeDateField label="Due" defaultValue="2026-05-24" getNow={getNow} isDisabled />,
    );
    expect(screen.getByRole('button', { name: 'Tomorrow Due' })).toBeDisabled();
    expect(disabled.container.querySelector('time')).not.toBeNull();
    disabled.unmount();
    const required = renderInLocale(<RelativeDateField label="Due" getNow={getNow} isRequired />);
    expect(root(required.container)).toHaveAttribute('data-validation', 'invalid');
    expect(required.container.querySelector('.ui-relative-date-field__select')).toHaveAttribute(
      'data-invalid',
      'true',
    );
  });

  it('UIC-RELATIVE-DATE-FIELD-1.4 restores, undoes and clears from the menu', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = renderInLocale(
      <RelativeDateField
        label="Due"
        committedValue="2026-05-23"
        getNow={getNow}
        menu={['clear']}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Today Due' }));
    await user.click(screen.getByRole('option', { name: 'Yesterday' }));
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: 'Restore Due' }));
    expect(screen.getByRole('button', { name: 'Today Due' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Due actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Clear' }));
    expect(onCommit).toHaveBeenLastCalledWith(null);
  });

  it('UIC-RELATIVE-DATE-FIELD-1.5 forwards the caller class, id, data attributes and open state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = renderInLocale(
      <RelativeDateField
        label="Due"
        id="due"
        className="caller"
        data-testid="probe"
        getNow={getNow}
        defaultOpen
        onOpenChange={onOpenChange}
      />,
    );
    const field = root(container);
    expect(field).toHaveClass('caller');
    expect(field).toHaveAttribute('id', 'due');
    expect(field).toHaveAttribute('data-testid', 'probe');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expectHooksMatchSpec(container, 'RELATIVE-DATE-FIELD', { callerAttributes: ['data-testid'] });
  });
});
