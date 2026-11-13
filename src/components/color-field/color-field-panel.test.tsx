import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ColorField } from './color-field.js';

function trigger(name: string) {
  return screen.getByRole('button', { name: new RegExp(`^${name}`) });
}

describe('ColorField picker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-COLOR-FIELD-4.1 offers preset swatches that set the colour and keep the picker open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <ColorField
        label="Accent"
        defaultValue="#2e8b57"
        swatches={['#cc3300', '#2e8b57', '#336699']}
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    await user.click(trigger('Accent'));
    const dialog = await screen.findByRole('dialog');
    const swatches = within(dialog).getByRole('listbox', { name: 'Color swatches' });
    expect(swatches).toHaveClass('ui-color-field__swatches', 'ui-color-swatch-picker');
    expect(swatches).toHaveAttribute('data-size', 'sm');
    const options = within(swatches).getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    await user.click(options[2] as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith('#336699');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(onCommit).toHaveBeenCalledWith('#336699');
  });

  it('UIC-COLOR-FIELD-4.1 offers a repeated swatch as separate pickable options', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ColorField
        label="Accent"
        defaultValue="#336699"
        swatches={['#ffffff', '#cc3300', '#ffffff']}
        onChange={onChange}
      />,
    );
    await user.click(trigger('Accent'));
    const swatches = within(await screen.findByRole('dialog')).getByRole('listbox', {
      name: 'Color swatches',
    });
    const options = within(swatches).getAllByRole('option');
    expect(options).toHaveLength(3);
    await user.click(options[2] as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith('#ffffff');
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
    await user.click(options[1] as HTMLElement);
    await user.click(options[0] as HTMLElement);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('UIC-COLOR-FIELD-4.1 renders every declared part across its modes', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'EyeDropper',
      vi.fn(function eyeDropper() {
        return { open: () => Promise.resolve({ sRGBHex: '#000000' }) };
      }),
    );
    render(
      <>
        <ColorField label="Typed" allowsTyping defaultValue="#336699" />
        <ColorField
          label="Accent"
          defaultValue="#336699"
          formats={['hex', 'rgb']}
          allowsTransparency
          swatches={['#336699']}
          allowsEyeDropper
        />
      </>,
    );
    await user.click(trigger('Accent'));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: 'RGB' }));
    expect(within(dialog).queryByRole('textbox', { name: 'Hex color' })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('radio', { name: 'HEX' }));
    expect(within(dialog).getByRole('textbox', { name: 'Hex color' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('radio', { name: 'RGB' }));
    expectHooksMatchSpec(document.body, 'COLOR-FIELD', {
      slots: [
        'group',
        'entry',
        'trigger',
        'swatch',
        'value',
        'popover',
        'dialog',
        'area',
        'format',
        'slider',
        'track',
        'thumb',
        'channels',
        'channel',
        'input',
        'eye-dropper',
        'swatches',
        'clear',
      ],
    });
  });

  it('UIC-COLOR-FIELD-1.5 edits the hue on a wheel, keeping saturation, brightness and alpha', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColorField
        label="Accent"
        defaultValue="hsba(1, 50%, 40%, 0.5)"
        valueFormat="hsb"
        hueControl="wheel"
        onChange={onChange}
      />,
    );
    await user.click(trigger('Accent'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('data-hue-control', 'wheel');
    expect(dialog.querySelector('.ui-color-field__slider[data-channel="hue"]')).toBeNull();
    const wheel = within(dialog).getByRole('slider', { name: 'Hue' });
    expect(wheel.closest('.ui-color-field__wheel')).not.toBeNull();
    expectHooksMatchSpec(document.body, 'COLOR-FIELD', { slots: ['wheel', 'wheel-track'] });
    await user.click(
      dialog.querySelector('.ui-color-field__wheel .ui-color-field__thumb') as Element,
    );
    expect(wheel).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('hsba(0, 50%, 40%, 0.5)');
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('hsba(359, 50%, 40%, 0.5)');
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('hsba(1, 50%, 40%, 0.5)');
  });

  it('UIC-COLOR-FIELD-1.3 UIC-COLOR-FIELD-1.5 moves the hue slider on a grey', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorField label="Accent" defaultValue="#808080" onChange={onChange} />);
    await user.click(trigger('Accent'));
    const dialog = await screen.findByRole('dialog');
    const hue = within(dialog).getByRole('slider', { name: 'Hue' });
    act(() => hue.focus());
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    // Stored hex cannot hold a grey's hue: the text stays grey while the slider moves.
    expect(hue).toHaveValue('3');
    for (const [value] of onChange.mock.calls) expect(value).toBe('#808080');
  });

  it('UIC-COLOR-FIELD-1.5 keeps the colour, the open picker and focus when the hue control switches', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ColorField label="Accent" defaultValue="#336699" />);
    await user.click(trigger('Accent'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('data-hue-control', 'slider');
    await user.click(
      dialog.querySelector('.ui-color-field__slider .ui-color-field__thumb') as Element,
    );
    const slider = within(dialog).getByRole('slider', { name: 'Hue' });
    expect(slider).toHaveFocus();
    const hue = slider.getAttribute('aria-valuetext');
    rerender(<ColorField label="Accent" defaultValue="#336699" hueControl="wheel" />);
    const wheel = within(screen.getByRole('dialog')).getByRole('slider', { name: 'Hue' });
    expect(wheel.closest('.ui-color-field__wheel')).not.toBeNull();
    expect(wheel).toHaveFocus();
    expect(wheel).toHaveAttribute('aria-valuetext', hue);
  });
});
