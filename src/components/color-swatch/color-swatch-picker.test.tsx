import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ColorSwatchPicker, ColorSwatchPickerItem } from './color-swatch-picker.js';

const palette = ['#cc3300', '#2e8b57', '#336699'];

function Palette(props: Partial<Parameters<typeof ColorSwatchPicker>[0]>) {
  return (
    <ColorSwatchPicker aria-label="Palette" {...props}>
      {palette.map((color) => (
        <ColorSwatchPickerItem key={color} color={color} />
      ))}
      <ColorSwatchPickerItem color="#ffd700" colorName="Sunflower" isDisabled />
    </ColorSwatchPicker>
  );
}

describe('ColorSwatchPicker', () => {
  it('UIC-COLOR-SWATCH-2.1 lists swatches as options of a single-selection listbox', () => {
    const { container } = render(<Palette defaultValue="#2e8b57" />);
    const list = screen.getByRole('listbox', { name: 'Palette' });
    expect(list).toHaveClass('ui-color-swatch-picker');
    expect(list).toHaveAttribute('data-size', 'md');
    expect(list).toHaveAttribute('data-layout', 'grid');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveClass('ui-color-swatch-picker__item');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('data-selected', 'true');
    expect(screen.getByRole('option', { name: 'Sunflower' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(options[0]?.querySelector('.ui-color-swatch')).toHaveAttribute('data-size', 'md');
    expectHooksMatchSpec(container, 'COLOR-SWATCH', { slots: 'all' });
  });

  it('UIC-COLOR-SWATCH-2.1 leaves out items and values in a notation React Aria does not read', () => {
    render(
      <ColorSwatchPicker aria-label="Palette" value="red">
        <ColorSwatchPickerItem color="red" />
        <ColorSwatchPickerItem color="#2e8b57" colorName="Sea green" />
        <ColorSwatchPickerItem color="oklch(70% 0.1 200)" />
      </ColorSwatchPicker>,
    );
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveAccessibleName('Sea green');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('UIC-COLOR-SWATCH-2.2 moves with the arrow keys and picks with Enter or a press', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Palette defaultValue="rgb(204, 51, 0)" onChange={onChange} />);
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
    await user.tab();
    expect(screen.getAllByRole('option')[0]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getAllByRole('option')[1]).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('#2e8b57');
    await user.click(screen.getAllByRole('option')[2] as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith('#336699');
    await user.click(screen.getByRole('option', { name: 'Sunflower' }));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('UIC-COLOR-SWATCH-2.3 publishes its swatch size and forwards caller hooks', () => {
    const { container } = render(
      <ColorSwatchPicker
        aria-label="Palette"
        size="lg"
        id="palette"
        className="compact"
        data-test="palette"
        layout="stack"
      >
        <ColorSwatchPickerItem color="#cc3300" className="warm" data-test="red" />
      </ColorSwatchPicker>,
    );
    const list = screen.getByRole('listbox');
    expect(list).toHaveClass('ui-color-swatch-picker', 'compact');
    expect(list).toHaveAttribute('id', 'palette');
    expect(list).toHaveAttribute('data-test', 'palette');
    expect(list).toHaveAttribute('data-layout', 'stack');
    const option = screen.getByRole('option');
    expect(option).toHaveClass('ui-color-swatch-picker__item', 'warm');
    expect(option).toHaveAttribute('data-test', 'red');
    expect(option.querySelector('.ui-color-swatch')).toHaveAttribute('data-size', 'lg');
    expectHooksMatchSpec(container, 'COLOR-SWATCH', { callerAttributes: ['data-test'] });
  });
});
