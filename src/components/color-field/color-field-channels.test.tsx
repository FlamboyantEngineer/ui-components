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
        format="rgb"
        allowsTransparency
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
        format="rgb"
        allowsTransparency
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

  it("UIC-COLOR-FIELD-3.2 shows the hex input's # only beside the Alpha input", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ColorField label="Accent" defaultValue="#336699" />);
    let dialog = await openPicker(user);
    const hex = within(dialog).getByRole('textbox', { name: 'Hex color' });
    expect(dialog.querySelector('.ui-color-field__hex .ui-color-field__channel-label')).toBeNull();
    fireEvent.wheel(hex, { deltaY: -100 });
    expect(hex).toHaveValue('#336699');
    await user.keyboard('{Escape}');
    unmount();
    render(<ColorField label="Accent" defaultValue="#336699" allowsTransparency />);
    dialog = await openPicker(user);
    expect(within(dialog).getByRole('textbox', { name: 'Hex color' })).toHaveValue('#336699');
    expect(
      dialog.querySelector('.ui-color-field__hex .ui-color-field__channel-label'),
    ).toHaveTextContent('#Hex color');
  });

  it('UIC-COLOR-FIELD-3.1 offers opacity for a translucent value without allowsTransparency', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorField label="Stroke" defaultValue="#33669980" onChange={onChange} />);
    expect(trigger()).toHaveAccessibleName('Stroke #33669980');
    let dialog = await openPicker(user);
    expect(within(dialog).getByRole('slider', { name: 'Alpha' })).toBeInTheDocument();
    expect(
      dialog.querySelector('.ui-color-field__hex .ui-color-field__channel-label'),
    ).toHaveTextContent('#Hex color');
    const hex = within(dialog).getByRole('textbox', { name: 'Hex color' });
    await user.clear(hex);
    await user.type(hex, 'FF0000{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('#ff000080');
    // Raising the alpha to one keeps the controls while the picker is open.
    const alpha = within(dialog).getByRole('textbox', { name: 'Alpha' });
    await user.clear(alpha);
    await user.type(alpha, '100{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('#ff0000');
    expect(within(dialog).getByRole('slider', { name: 'Alpha' })).toBeInTheDocument();
    expect(alpha).toHaveFocus();
    await user.clear(alpha);
    await user.type(alpha, '0{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('#ff000000');
    await user.clear(alpha);
    await user.type(alpha, '100{Enter}');
    await user.keyboard('{Escape}');
    // Closed on an opaque colour, the picker offers the colour alone again.
    expect(trigger()).toHaveAccessibleName('Stroke #FF0000');
    dialog = await openPicker(user);
    expect(within(dialog).queryByRole('slider', { name: 'Alpha' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('textbox', { name: 'Alpha' })).not.toBeInTheDocument();
  });

  it.each([
    ['hex', '#336699cc', '#336699CC'],
    ['rgb', 'rgba(51, 102, 153, 0.8)', 'rgba(51, 102, 153, 0.8)'],
    ['hsl', 'hsla(210, 50%, 40%, 0.8)', 'hsla(210, 50%, 40%, 0.8)'],
    ['hsb', 'hsba(210, 67%, 60%, 0.8)', 'hsba(210, 67%, 60%, 0.8)'],
  ] as const)(
    'UIC-COLOR-FIELD-3.1 offers opacity for a %s colour shown with alpha',
    async (format, value, shown) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <ColorField
          label="Tint"
          format={format}
          valueFormat={format}
          defaultValue={value}
          onChange={onChange}
        />,
      );
      expect(trigger()).toHaveAccessibleName(`Tint ${shown}`);
      const dialog = await openPicker(user);
      expect(within(dialog).getByRole('slider', { name: 'Alpha' })).toBeInTheDocument();
      const alpha = within(dialog).getByRole('textbox', { name: 'Alpha' });
      await user.clear(alpha);
      await user.type(alpha, '25{Enter}');
      expect(onChange).toHaveBeenLastCalledWith(expect.stringMatching(/0\.25\)$|40$/));
    },
  );

  it('UIC-COLOR-FIELD-3.1 offers opacity once a typed colour turns translucent', async () => {
    const user = userEvent.setup();
    render(<ColorField label="Tint" allowsTyping defaultValue="#336699" />);
    const entry = screen.getByRole('textbox', { name: 'Tint' });
    await user.clear(entry);
    await user.type(entry, '#ff000040{Enter}');
    await user.click(screen.getByRole('button', { name: 'Tint picker' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('slider', { name: 'Alpha' })).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: 'Alpha' })).toHaveValue('25%');
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
        formats={['hex', 'rgb', 'hsl']}
        allowsTransparency
        onFormatChange={onFormatChange}
      />,
    );
    expect(trigger()).toHaveAccessibleName('Accent #336699FF');
    const dialog = await openPicker(user);
    const choice = within(dialog).getByRole('radiogroup', { name: 'Color format' });
    expect(choice).toHaveClass('ui-color-field__format', 'ui-segmented-choice');
    expect(within(choice).getByRole('radio', { name: 'HEX' })).toBeChecked();
    await user.click(within(choice).getByRole('radio', { name: 'HSL' }));
    expect(onFormatChange).toHaveBeenCalledWith('hsl');
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
