import { render, screen, within } from '@testing-library/react';
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
          formats={['hex', 'rgba']}
          swatches={['#336699']}
          allowsEyeDropper
        />
      </>,
    );
    await user.click(trigger('Accent'));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: 'RGBA' }));
    expect(within(dialog).queryByRole('textbox', { name: 'Hex color' })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('radio', { name: 'HEX' }));
    expect(within(dialog).getByRole('textbox', { name: 'Hex color' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('radio', { name: 'RGBA' }));
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
});
