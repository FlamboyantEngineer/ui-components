import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  type ColorSwatchPickerProps,
} from './color-swatch-picker.js';

// Empty, unreadable and equal colours (UIC-COLOR-SWATCH-2.4, UIC-COLOR-SWATCH-2.5).

const selectedNames = () =>
  screen
    .queryAllByRole('option')
    .filter((option) => option.getAttribute('aria-selected') === 'true')
    .map((option) => option.querySelector('[role="img"]')?.getAttribute('aria-label'));

function Primaries(props: Partial<ColorSwatchPickerProps>) {
  return (
    <ColorSwatchPicker aria-label="Palette" {...props}>
      <ColorSwatchPickerItem color="#ff0000" colorName="Red" />
      <ColorSwatchPickerItem color="#00ff00" colorName="Green" />
    </ColorSwatchPicker>
  );
}

describe('ColorSwatchPicker values', () => {
  const error = vi.spyOn(console, 'error');
  const warn = vi.spyOn(console, 'warn');
  afterEach(() => {
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    error.mockClear();
    warn.mockClear();
  });

  it('UIC-COLOR-SWATCH-2.4 picks nothing while a controlled value is empty or unreadable', () => {
    const { rerender } = render(<Primaries value="#ff0000" />);
    expect(selectedNames()).toEqual(['Red']);
    rerender(<Primaries value="not-a-color" />);
    expect(selectedNames()).toEqual([]);
    rerender(<Primaries value="rgb(0, 255, 0)" />);
    expect(selectedNames()).toEqual(['Green']);
    rerender(<Primaries value="" />);
    expect(selectedNames()).toEqual([]);
  });

  it('UIC-COLOR-SWATCH-2.4 reports a pick but stays on the controlled value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Primaries value="not-a-color" onChange={onChange} />);
    await user.click(screen.getByRole('option', { name: 'Green' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('#00ff00');
    expect(selectedNames()).toEqual([]);
  });

  it('UIC-COLOR-SWATCH-2.4 picks nothing at first without a default and keeps its own pick', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const palette = (defaultValue?: string) => (
      <ColorSwatchPicker aria-label="Palette" defaultValue={defaultValue} onChange={onChange}>
        <ColorSwatchPickerItem color="#000000" colorName="Black" />
        <ColorSwatchPickerItem color="#ff0000" colorName="Red" />
      </ColorSwatchPicker>
    );
    const { rerender } = render(palette());
    expect(selectedNames()).toEqual([]);
    await user.click(screen.getByRole('option', { name: 'Red' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('#ff0000');
    expect(selectedNames()).toEqual(['Red']);
    rerender(palette('#000000'));
    expect(selectedNames()).toEqual(['Red']);
  });

  it('UIC-COLOR-SWATCH-2.5 lists equal colours as separate options picked together', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColorSwatchPicker aria-label="Palette" defaultValue="hsl(0, 100%, 50%)" onChange={onChange}>
        <ColorSwatchPickerItem key="hex" color="#ff0000" colorName="Hex red" />
        <ColorSwatchPickerItem key="rgb" color="rgb(255, 0, 0)" colorName="RGB red" />
        <ColorSwatchPickerItem key="again" color="#ff0000" colorName="Hex red again" />
        <ColorSwatchPickerItem key="off" color="#F00" colorName="Disabled red" isDisabled />
        <ColorSwatchPickerItem key="green" color="#00ff00" colorName="Green" />
      </ColorSwatchPicker>,
    );
    expect(screen.getAllByRole('option')).toHaveLength(5);
    expect(selectedNames()).toEqual(['Hex red', 'RGB red', 'Hex red again', 'Disabled red']);
    await user.click(screen.getByRole('option', { name: 'Green' }));
    await user.click(screen.getByRole('option', { name: 'RGB red' }));
    expect(onChange).toHaveBeenLastCalledWith('rgb(255, 0, 0)');
    await user.click(screen.getByRole('option', { name: 'Hex red again' }));
    expect(onChange).toHaveBeenLastCalledWith('#ff0000');
    await user.click(screen.getByRole('option', { name: 'Disabled red' }));
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('UIC-COLOR-SWATCH-2.5 reports the spelling of the item picked after equal colours move', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const palette = (colors: readonly string[]) => (
      <ColorSwatchPicker aria-label="Palette" value="#00ff00" onChange={onChange}>
        {colors.map((color) => (
          <ColorSwatchPickerItem key={color} color={color} colorName={color} />
        ))}
        <ColorSwatchPickerItem color="#00ff00" colorName="Green" />
      </ColorSwatchPicker>
    );
    const { rerender } = render(palette(['#ff0000', 'rgb(255, 0, 0)', 'hsl(0, 100%, 50%)']));
    rerender(palette(['hsl(0, 100%, 50%)', '#ff0000']));
    expect(screen.getAllByRole('option')).toHaveLength(3);
    await user.click(screen.getByRole('option', { name: 'hsl(0, 100%, 50%)' }));
    expect(onChange).toHaveBeenLastCalledWith('hsl(0, 100%, 50%)');
    rerender(palette(['#ff0000']));
    await user.click(screen.getByRole('option', { name: '#ff0000' }));
    expect(onChange).toHaveBeenLastCalledWith('#ff0000');
  });
});
