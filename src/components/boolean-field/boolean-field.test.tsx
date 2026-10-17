import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { BooleanField } from './boolean-field.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

describe('BooleanField', () => {
  it('UIC-BOOLEAN-FIELD-1.1 is a field that starts unset and publishes its value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<BooleanField label="Ripe" onChange={onChange} />);
    expect(root(container)).toHaveClass('ui-field', 'ui-boolean-field');
    expect(root(container)).toHaveAttribute('data-value', 'unset');
    await user.click(screen.getByRole('checkbox', { name: 'Ripe' }));
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(root(container)).toHaveAttribute('data-value', 'true');
    expectHooksMatchSpec(container, 'BOOLEAN-FIELD');
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control'] });
  });

  it('UIC-BOOLEAN-FIELD-1.1 is invalid while required and unset, and false is a value', () => {
    const { container, rerender } = render(<BooleanField label="Agree" isRequired />);
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
    expect(screen.getByText('A value is required.')).toBeInTheDocument();
    rerender(<BooleanField label="Agree" isRequired value={false} />);
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
  });

  it('UIC-BOOLEAN-FIELD-1.2 draws a checkbox, a switch or two segments', () => {
    const { container, rerender } = render(<BooleanField label="Ripe" defaultValue={null} />);
    expect(root(container)).toHaveAttribute('data-variant', 'checkbox');
    expect(screen.getByRole('checkbox', { name: 'Ripe' })).toBePartiallyChecked();
    expect(container.querySelector('.ui-checkbox__label')).toBeNull();
    expectHooksMatchSpec(container, 'CHECKBOX', { slots: ['box', 'glyph'] });

    rerender(<BooleanField label="Ripe" variant="switch" value />);
    const toggle = screen.getByRole('switch', { name: 'Ripe' });
    expect(toggle).toBeChecked();
    expect(root(container)).toHaveAttribute('data-variant', 'switch');
    expect(container.querySelector('.ui-boolean-field__switch')?.tagName).toBe('LABEL');
    expectHooksMatchSpec(container, 'BOOLEAN-FIELD', { slots: ['switch', 'track', 'thumb'] });

    rerender(<BooleanField label="Ripe" variant="segmented" value={false} />);
    const group = screen.getByRole('radiogroup', { name: 'Ripe' });
    expect(group).toHaveClass('ui-segmented-choice');
    expect(screen.getAllByRole('radio').map((radio) => radio.textContent)).toEqual([
      'False',
      'True',
    ]);
    expect(screen.getByRole('radio', { name: 'False' })).toHaveAttribute('aria-checked', 'true');
    rerender(<BooleanField label="Ripe" variant="segmented" value={null} />);
    expect(screen.getByRole('radio', { name: 'False' })).toHaveAttribute('aria-checked', 'false');
    expectHooksMatchSpec(container, 'BOOLEAN-FIELD');
  });

  it('UIC-BOOLEAN-FIELD-1.3 captions a switch only with custom labels or while unset', () => {
    const { container, rerender } = render(
      <BooleanField label="Notify" variant="switch" value={false} />,
    );
    const caption = () => container.querySelector('.ui-boolean-field__caption');
    expect(caption()).toBeNull();
    rerender(<BooleanField label="Notify" variant="switch" value={null} />);
    expect(caption()).toHaveTextContent('Unset');
    rerender(<BooleanField label="Notify" variant="switch" value={null} unsetLabel="Inherited" />);
    expect(caption()).toHaveTextContent('Inherited');
    rerender(
      <BooleanField
        label="Notify"
        variant="switch"
        value={false}
        trueLabel="Yes"
        falseLabel="No"
      />,
    );
    expect(caption()).toHaveTextContent('No');
    rerender(<BooleanField label="Notify" variant="segmented" value trueLabel="Yes" />);
    expect(screen.getByRole('radio', { name: 'Yes' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'False' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'BOOLEAN-FIELD');
  });

  it('UIC-BOOLEAN-FIELD-1.4 toggles from the field label and describes the control', async () => {
    const user = userEvent.setup();
    for (const variant of ['checkbox', 'switch'] as const) {
      const onChange = vi.fn();
      const { container, unmount } = render(
        <BooleanField
          id="archived"
          label="Show archived"
          description="Include archived rows."
          variant={variant}
          defaultValue={false}
          onChange={onChange}
        />,
      );
      const label = container.querySelector('label.ui-field__label') as HTMLLabelElement;
      const input = container.querySelector('input') as HTMLInputElement;
      expect(label.htmlFor).toBe(input.id);
      expect(input).toHaveAccessibleDescription('Include archived rows.');
      await user.click(screen.getByText('Show archived'));
      expect(onChange).toHaveBeenLastCalledWith(true);
      unmount();
    }
    render(<BooleanField label="Agree" isRequired isReadOnly variant="checkbox" />);
    const box = screen.getByRole('checkbox', { name: 'Agree' });
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveAttribute('aria-readonly', 'true');
    expect(box).toHaveAttribute('aria-required', 'true');
  });

  it('UIC-BOOLEAN-FIELD-1.5 submits its value in a form', () => {
    const form = (variant: 'checkbox' | 'switch' | 'segmented', value: boolean | null) => {
      const { container, unmount } = render(
        <form>
          <BooleanField label="Ripe" name="ripe" variant={variant} value={value} />
        </form>,
      );
      const data = new FormData(container.querySelector('form') as HTMLFormElement);
      unmount();
      return data.getAll('ripe');
    };
    expect(form('checkbox', true)).toEqual(['true']);
    expect(form('checkbox', false)).toEqual([]);
    expect(form('switch', true)).toEqual(['true']);
    expect(form('segmented', false)).toEqual(['false']);
    expect(form('segmented', null)).toEqual([]);
    const { container } = render(
      <BooleanField label="Ripe" name="ripe" variant="segmented" value />,
    );
    expectHooksMatchSpec(container, 'BOOLEAN-FIELD', { slots: ['form-value'] });
  });

  it('UIC-BOOLEAN-FIELD-1.6 forwards the class name, data attributes and id to its root', () => {
    const { container } = render(
      <BooleanField id="ripe" label="Ripe" className="inline" data-test="ripe" />,
    );
    expect(root(container)).toHaveClass('ui-boolean-field', 'inline');
    expect(root(container)).toHaveAttribute('data-test', 'ripe');
    expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'ripe-control');
    expectHooksMatchSpec(container, 'BOOLEAN-FIELD', { callerAttributes: ['data-test'] });
  });

  it('UIC-BOOLEAN-FIELD-2.1 flips and commits on press and Space, and sets a picked segment', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { unmount } = render(
      <BooleanField label="Ripe" variant="switch" defaultValue={false} onCommit={onCommit} />,
    );
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    expect(onCommit).toHaveBeenLastCalledWith(true);
    await user.keyboard(' ');
    expect(onCommit).toHaveBeenLastCalledWith(false);
    unmount();
    render(<BooleanField label="Ripe" variant="segmented" onCommit={onCommit} />);
    await user.click(screen.getByRole('radio', { name: 'True' }));
    expect(onCommit).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole('radio', { name: 'True' }));
    expect(onCommit).toHaveBeenCalledTimes(3);
  });

  it('UIC-BOOLEAN-FIELD-2.2 cycles back to unset with allowsUnset', async () => {
    const user = userEvent.setup();
    const changes: Array<boolean | null> = [];
    const { unmount } = render(
      <BooleanField label="Inherit" allowsUnset onChange={(value) => changes.push(value)} />,
    );
    const box = screen.getByRole('checkbox');
    await user.click(box);
    await user.click(box);
    await user.click(box);
    expect(changes).toEqual([true, false, null]);
    expect(box).toBePartiallyChecked();
    unmount();

    const segmented = render(
      <BooleanField
        label="Inherit"
        variant="segmented"
        allowsUnset
        defaultValue
        menu={['clear']}
        onChange={(value) => changes.push(value)}
      />,
    );
    await user.click(screen.getByRole('radio', { name: 'True' }));
    expect(changes.at(-1)).toBe(null);
    segmented.unmount();

    render(<BooleanField label="Plain" defaultValue menu={['clear']} />);
    await user.click(screen.getByRole('button', { name: 'Plain actions' }));
    expect(await screen.findByRole('menuitem', { name: 'Clear' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('UIC-BOOLEAN-FIELD-2.2 unsets from the field menu with allowsUnset', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BooleanField label="Inherit" variant="switch" allowsUnset defaultValue menu={['clear']} />,
    );
    await user.click(screen.getByRole('button', { name: 'Inherit actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Clear' }));
    expect(root(container)).toHaveAttribute('data-value', 'unset');
  });

  it('UIC-BOOLEAN-FIELD-2.3 refuses presses while locked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <BooleanField label="Ripe" variant="switch" value isReadOnly onChange={onChange} />,
    );
    await user.click(screen.getByRole('switch'));
    rerender(
      <BooleanField label="Ripe" variant="segmented" value isDisabled onChange={onChange} />,
    );
    await user.click(screen.getByRole('radio', { name: 'False' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-BOOLEAN-FIELD-2.3 shows dirty state, restores, undoes and redoes from the control', async () => {
    const user = userEvent.setup();
    const outer: boolean[] = [];
    const { container } = render(
      <div onKeyDown={(event) => outer.push(event.defaultPrevented)}>
        <BooleanField label="Ripe" committedValue={false} defaultValue={false} />
      </div>,
    );
    const box = screen.getByRole('checkbox');
    await user.click(box);
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.keyboard('{Control>}z{/Control}');
    expect(box).not.toBeChecked();
    expect(outer.at(-1)).toBe(true);
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(box).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Restore Ripe' }));
    expect(box).not.toBeChecked();
    expect(root(container)).not.toHaveAttribute('data-dirty');
  });

  it('UIC-BOOLEAN-FIELD-2.3 shows warnings and pending checks', () => {
    const { container, rerender } = render(
      <BooleanField
        label="Ripe"
        value
        validate={(value) => (value ? { severity: 'warning', message: 'Eat it soon.' } : null)}
      />,
    );
    expect(root(container)).toHaveAttribute('data-validation', 'warning');
    rerender(<BooleanField label="Ripe" value isPending />);
    expect(root(container)).toHaveAttribute('data-validation', 'pending');
  });
});
