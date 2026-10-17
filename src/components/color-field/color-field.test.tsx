import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ColorField } from './color-field.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

function trigger() {
  return document.querySelector<HTMLElement>('.ui-color-field__trigger') as HTMLElement;
}

describe('ColorField', () => {
  it('UIC-COLOR-FIELD-1.1 is a field that starts with no colour', () => {
    const { container } = render(<ColorField label="Accent" />);
    expect(root(container)).toHaveClass('ui-field', 'ui-color-field');
    expect(trigger()).toHaveAccessibleName('Accent No color');
    expect(container.querySelector('.ui-color-swatch')).toHaveAttribute('data-empty', 'true');
    expectHooksMatchSpec(container, 'COLOR-FIELD', { slots: ['trigger', 'swatch', 'value'] });
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control'] });
  });

  it('UIC-COLOR-FIELD-1.2 shows a swatch and the colour text in each format', () => {
    const { container, rerender } = render(
      <ColorField id="accent" label="Accent" defaultValue="#aabbcc" description="Brand colour." />,
    );
    const value = () => container.querySelector('.ui-color-field__value');
    expect(value()).toHaveTextContent('#AABBCC');
    expect(value()).not.toHaveAttribute('data-placeholder');
    expect(trigger()).toHaveAccessibleName('Accent #AABBCC');
    expect(trigger()).toHaveAttribute('id', 'accent-control');
    expect(trigger()).toHaveAccessibleDescription('Brand colour.');
    expect(container.querySelector('.ui-color-field__swatch')).toHaveClass('ui-color-swatch');
    rerender(<ColorField id="accent" label="Accent" value="#336699" format="rgb" />);
    expect(value()).toHaveTextContent('rgb(51, 102, 153)');
    rerender(<ColorField id="accent" label="Accent" value="#336699" format="hsl" />);
    expect(value()).toHaveTextContent('hsl(210, 50%, 40%)');
    rerender(<ColorField id="accent" label="Accent" value="#336699" format="hsb" />);
    expect(value()).toHaveTextContent('hsb(210, 66.67%, 60%)');
    rerender(<ColorField id="accent" label="Accent" value={null} placeholder="Pick a colour" />);
    expect(value()).toHaveTextContent('Pick a colour');
    expect(value()).toHaveAttribute('data-placeholder', 'true');
    rerender(<ColorField id="accent" label="Accent" value="#336699" isReadOnly />);
    expect(trigger()).toBeDisabled();
    rerender(<ColorField id="accent" label="Accent" value="#336699" isDisabled />);
    expect(trigger()).toBeDisabled();
  });

  it('UIC-COLOR-FIELD-1.3 opens a picker with an area, a hue slider, a hex input and Clear', async () => {
    const user = userEvent.setup();
    render(<ColorField label="Accent" defaultValue="#336699" />);
    await user.click(trigger());
    const dialog = await screen.findByRole('dialog', { name: 'Accent' });
    expect(dialog).toHaveClass('ui-color-field__dialog');
    expect(dialog.closest('.ui-color-field__popover')).not.toBeNull();
    expect(within(dialog).getByRole('slider', { name: 'Hue' })).toBeInTheDocument();
    expect(within(dialog).getAllByRole('slider').length).toBeGreaterThanOrEqual(2);
    expect(within(dialog).getByRole('textbox', { name: 'Hex color' })).toHaveValue('#336699');
    expect(within(dialog).getByRole('button', { name: 'Clear' })).toBeEnabled();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expectHooksMatchSpec(document.body, 'COLOR-FIELD', {
      slots: [
        'trigger',
        'swatch',
        'value',
        'popover',
        'dialog',
        'area',
        'slider',
        'track',
        'thumb',
        'channels',
        'hex',
        'input',
        'clear',
      ],
    });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('UIC-COLOR-FIELD-1.3 has no Clear button when required', async () => {
    const user = userEvent.setup();
    render(<ColorField label="Accent" defaultValue="#336699" isRequired />);
    await user.click(trigger());
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('UIC-COLOR-FIELD-1.4 forwards the class name, data attributes and id to its root', () => {
    const { container } = render(
      <ColorField id="accent" label="Accent" className="compact" data-test="accent" />,
    );
    expect(root(container)).toHaveClass('ui-color-field', 'compact');
    expect(root(container)).toHaveAttribute('id', 'accent');
    expect(root(container)).toHaveAttribute('data-test', 'accent');
    expectHooksMatchSpec(container, 'COLOR-FIELD', { callerAttributes: ['data-test'] });
  });

  it('UIC-COLOR-FIELD-2.1 sets lowercase hex while picking and commits when the picker closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <ColorField label="Accent" defaultValue="#336699" onChange={onChange} onCommit={onCommit} />,
    );
    await user.click(trigger());
    const dialog = await screen.findByRole('dialog');
    const hue = within(dialog).getByRole('slider', { name: 'Hue' });
    hue.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.lastCall?.[0]).toMatch(/^#[0-9a-f]{6}$/);
    expect(onCommit).not.toHaveBeenCalled();
    const hex = within(dialog).getByRole('textbox', { name: 'Hex color' });
    await user.clear(hex);
    await user.type(hex, 'FF0000{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('#ff0000');
    await user.keyboard('{Escape}');
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('#ff0000');
    expect(trigger()).toHaveAccessibleName('Accent #FF0000');
  });

  it('UIC-COLOR-FIELD-2.2 clears an optional colour from the picker or the keyboard', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { unmount } = render(
      <ColorField label="Accent" defaultValue="#336699" onCommit={onCommit} />,
    );
    await user.click(trigger());
    await user.click(await screen.findByRole('button', { name: 'Clear' }));
    expect(onCommit).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(trigger()).toHaveFocus());
    expect(trigger()).toHaveAccessibleName('Accent No color');
    await user.click(trigger());
    expect(await screen.findByRole('button', { name: 'Clear' })).toBeDisabled();
    await user.keyboard('{Escape}');
    unmount();

    render(<ColorField label="Accent" defaultValue="#336699" onCommit={onCommit} />);
    trigger().focus();
    await user.keyboard('{Backspace}');
    expect(onCommit).toHaveBeenLastCalledWith(null);
    await user.keyboard('{Control>}z{/Control}');
    expect(trigger()).toHaveAccessibleName('Accent #336699');
  });

  it('UIC-COLOR-FIELD-2.2 ignores clearing keys when required', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<ColorField label="Accent" defaultValue="#336699" isRequired onCommit={onCommit} />);
    trigger().focus();
    await user.keyboard('{Delete}');
    expect(onCommit).not.toHaveBeenCalled();
    expect(trigger()).toHaveAccessibleName('Accent #336699');
  });

  it('UIC-COLOR-FIELD-2.3 shows dirty state, restores and sets the default from the menu', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ColorField
        label="Accent"
        committedValue="#336699"
        defaultValue="#000000"
        menu={['clear', 'set-default']}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Accent actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Set to default' }));
    expect(trigger()).toHaveAccessibleName('Accent #000000');
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: 'Restore Accent' }));
    expect(trigger()).toHaveAccessibleName('Accent #336699');
    await user.keyboard('{Control>}z{/Control}');
    expect(trigger()).toHaveAccessibleName('Accent #000000');
    await user.keyboard('{Control>}y{/Control}');
    expect(trigger()).toHaveAccessibleName('Accent #336699');
  });

  it('UIC-COLOR-FIELD-2.3 shows validation statuses', () => {
    const { container, rerender } = render(<ColorField label="Accent" isRequired />);
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
    rerender(
      <ColorField
        label="Accent"
        value="#ffff00"
        validate={() => ({ severity: 'warning', message: 'Low contrast.' })}
      />,
    );
    expect(root(container)).toHaveAttribute('data-validation', 'warning');
    expect(trigger()).toHaveAccessibleDescription('Low contrast.');
    rerender(<ColorField label="Accent" value="#ffff00" isPending />);
    expect(root(container)).toHaveAttribute('data-validation', 'pending');
  });
});
