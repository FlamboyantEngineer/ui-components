import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { ColorField } from './color-field.js';

function stubEyeDropper(open: () => Promise<{ sRGBHex: string }>) {
  const EyeDropper = vi.fn(function eyeDropper() {
    return { open };
  });
  vi.stubGlobal('EyeDropper', EyeDropper);
  return EyeDropper;
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^Accent/ }));
  return screen.findByRole('dialog');
}

describe('ColorField eye dropper', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-COLOR-FIELD-4.2 samples a screen colour into the picker', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const EyeDropper = stubEyeDropper(() => Promise.resolve({ sRGBHex: '#ff8800' }));
    render(
      <ColorField
        label="Accent"
        defaultValue="#336699"
        allowsEyeDropper
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    const dialog = await openPicker(user);
    const button = within(dialog).getByRole('button', { name: 'Pick a color from the screen' });
    expect(button).toHaveClass('ui-color-field__eye-dropper', 'ui-button');
    expect(button.querySelector('[data-glyph="eye-dropper"]')).not.toBeNull();
    await user.click(button);
    expect(EyeDropper).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('#ff8800'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onCommit).toHaveBeenCalledWith('#ff8800');
  });

  it('UIC-COLOR-FIELD-4.2 ignores a dismissed sample and names the button from the provider', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const open = vi.fn(() => Promise.reject(new DOMException('Canceled', 'AbortError')));
    stubEyeDropper(open);
    render(
      <UiProvider strings={{ pickScreenColor: 'Pipette' }}>
        <ColorField label="Accent" defaultValue="#336699" allowsEyeDropper onChange={onChange} />
      </UiProvider>,
    );
    const dialog = await openPicker(user);
    await user.click(within(dialog).getByRole('button', { name: 'Pipette' }));
    await waitFor(() => expect(open).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-COLOR-FIELD-4.2 draws no eye dropper without the browser API or the prop', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ColorField label="Accent" allowsEyeDropper />);
    let dialog = await openPicker(user);
    expect(dialog.querySelector('.ui-color-field__eye-dropper')).toBeNull();
    await user.keyboard('{Escape}');
    unmount();
    stubEyeDropper(() => Promise.resolve({ sRGBHex: '#000000' }));
    render(<ColorField label="Accent" />);
    dialog = await openPicker(user);
    expect(dialog.querySelector('.ui-color-field__eye-dropper')).toBeNull();
  });
});
