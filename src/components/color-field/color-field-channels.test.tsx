import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ColorField } from './color-field.js';
import type { ColorFieldFormat } from './color-values.js';

function trigger() {
  return document.querySelector<HTMLElement>('.ui-color-field__trigger') as HTMLElement;
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(trigger());
  return screen.findByRole('dialog');
}

describe('ColorField formats and channels', () => {
  it('UIC-COLOR-FIELD-3.1 writes alpha and adds an alpha slider and input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColorField
        label="Tint"
        format="rgba"
        defaultValue="rgba(51, 102, 153, 0.5)"
        onChange={onChange}
      />,
    );
    expect(trigger()).toHaveAccessibleName('Tint rgba(51, 102, 153, 0.5)');
    const dialog = await openPicker(user);
    const sliders = dialog.querySelectorAll('.ui-color-field__slider');
    expect([...sliders].map((slider) => slider.getAttribute('data-channel'))).toEqual([
      'hue',
      'alpha',
    ]);
    const alpha = within(dialog).getByRole('slider', { name: 'Alpha' });
    alpha.focus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('#3366997d');
    expect(within(dialog).getByRole('textbox', { name: 'Alpha' })).toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'COLOR-FIELD', { slots: ['slider', 'channel'] });
  });

  it('UIC-COLOR-FIELD-3.2 labels each input visibly and steps the channel under the wheel', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColorField
        label="Tint"
        format="rgba"
        defaultValue="rgba(51, 102, 153, 0.5)"
        onChange={onChange}
      />,
    );
    const dialog = await openPicker(user);
    const marks = [...dialog.querySelectorAll('.ui-color-field__channel-label [aria-hidden]')];
    expect(marks.map((mark) => mark.textContent)).toEqual(['R', 'G', 'B', 'A']);
    const green = within(dialog).getByRole('textbox', { name: 'Green' });
    expect(fireEvent.wheel(green, { deltaY: -100 })).toBe(false);
    expect(green).toHaveValue('103');
    expect(onChange).toHaveBeenLastCalledWith('#33679980');
    fireEvent.wheel(green, { deltaY: 1, deltaMode: 1 });
    fireEvent.wheel(green, { deltaY: 3, deltaMode: 1 });
    expect(green).toHaveValue('102');
    // A zoom gesture and a sideways wheel stay the browser's.
    expect(fireEvent.wheel(green, { deltaY: -100, ctrlKey: true })).toBe(true);
    expect(fireEvent.wheel(green, { deltaX: 100, deltaY: 10 })).toBe(true);
    expect(green).toHaveValue('102');
    expect(within(dialog).getByRole('textbox', { name: 'Red' })).toHaveValue('51');
    expect(within(dialog).getByRole('textbox', { name: 'Alpha' })).toHaveValue('50%');
  });

  it('UIC-COLOR-FIELD-3.2 marks the hex input with #', async () => {
    const user = userEvent.setup();
    render(<ColorField label="Accent" defaultValue="#336699" />);
    const dialog = await openPicker(user);
    const hex = within(dialog).getByRole('textbox', { name: 'Hex color' });
    expect(
      dialog.querySelector('.ui-color-field__hex .ui-color-field__channel-label'),
    ).toHaveTextContent('#Hex color');
    fireEvent.wheel(hex, { deltaY: -100 });
    expect(hex).toHaveValue('#336699');
  });

  it('UIC-COLOR-FIELD-3.2 edits the channels of the format as numbers', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(
      <ColorField label="Accent" format="rgb" defaultValue="#336699" onChange={onChange} />,
    );
    let dialog = await openPicker(user);
    expect(within(dialog).queryByRole('textbox', { name: 'Hex color' })).not.toBeInTheDocument();
    const fields = dialog.querySelectorAll('.ui-color-field__channel');
    expect([...fields].map((node) => node.getAttribute('data-channel'))).toEqual([
      'red',
      'green',
      'blue',
    ]);
    const red = within(dialog).getByRole('textbox', { name: 'Red' });
    expect(red).toHaveValue('51');
    expect(red).toHaveClass('ui-color-field__input');
    await user.clear(red);
    await user.type(red, '255{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('#ff6699');
    const blue = within(dialog).getByRole('textbox', { name: 'Blue' });
    blue.focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('#ff669a');
    expectHooksMatchSpec(document.body, 'COLOR-FIELD', { slots: ['channels', 'channel'] });
    await user.keyboard('{Escape}');
    unmount();

    render(<ColorField label="Accent" format="hsb" defaultValue="#336699" />);
    dialog = await openPicker(user);
    for (const name of ['Hue', 'Saturation', 'Brightness']) {
      expect(within(dialog).getByRole('textbox', { name })).toBeInTheDocument();
    }
  });

  it('UIC-COLOR-FIELD-3.3 switches the format from the picker', async () => {
    const user = userEvent.setup();
    const onFormatChange = vi.fn();
    render(
      <ColorField
        label="Accent"
        defaultValue="#336699"
        formats={['hex', 'rgb', 'hsla']}
        onFormatChange={onFormatChange}
      />,
    );
    expect(trigger()).toHaveAccessibleName('Accent #336699');
    const dialog = await openPicker(user);
    const choice = within(dialog).getByRole('radiogroup', { name: 'Color format' });
    expect(choice).toHaveClass('ui-color-field__format', 'ui-segmented-choice');
    expect(within(choice).getByRole('radio', { name: 'HEX' })).toBeChecked();
    await user.click(within(choice).getByRole('radio', { name: 'HSLA' }));
    expect(onFormatChange).toHaveBeenCalledWith('hsla');
    expect(trigger()).toHaveAccessibleName('Accent hsla(210, 50%, 40%, 1)');
    expect(within(dialog).getByRole('textbox', { name: 'Lightness' })).toBeInTheDocument();
    expect(within(dialog).getByRole('slider', { name: 'Alpha' })).toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'COLOR-FIELD', { slots: ['format'] });
  });

  it('UIC-COLOR-FIELD-3.3 keeps a controlled format and draws no choice for one format', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [format, setFormat] = useState<ColorFieldFormat>('rgb');
      return (
        <>
          <ColorField
            label="Accent"
            defaultValue="#336699"
            format="hex"
            formats={['hex', 'rgb']}
            onFormatChange={setFormat}
          />
          <output>{format}</output>
        </>
      );
    }
    const { unmount } = render(<Controlled />);
    const dialog = await openPicker(user);
    await user.click(within(dialog).getByRole('radio', { name: 'RGB' }));
    expect(screen.getByText('rgb', { selector: 'output' })).toBeInTheDocument();
    expect(trigger()).toHaveAccessibleName('Accent #336699');
    await user.keyboard('{Escape}');
    unmount();
    render(<ColorField label="Accent" defaultValue="#336699" formats={['rgb']} />);
    expect(
      within(await openPicker(user)).queryByRole('radiogroup', { name: 'Color format' }),
    ).not.toBeInTheDocument();
  });

  it('UIC-COLOR-FIELD-3.4 stores the value in the value format', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <ColorField
        label="Accent"
        defaultValue="rgb(51, 102, 153)"
        valueFormat="rgb"
        onCommit={onCommit}
      />,
    );
    expect(trigger()).toHaveAccessibleName('Accent #336699');
    const dialog = await openPicker(user);
    const hex = within(dialog).getByRole('textbox', { name: 'Hex color' });
    await user.clear(hex);
    await user.type(hex, 'FF0000{Enter}');
    await user.keyboard('{Escape}');
    expect(onCommit).toHaveBeenLastCalledWith('rgb(255, 0, 0)');
  });
});
