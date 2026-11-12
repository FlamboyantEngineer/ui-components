import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { BackgroundColorGlyph, FontColorGlyph } from '../../core/drawn-glyphs.js';
import { ColorSwatchButton } from './color-swatch.js';

describe('ColorSwatchButton', () => {
  it('UIC-COLOR-SWATCH-3.1 draws its glyph over a colour bar and is described by the colour', () => {
    const { container } = render(
      <>
        <ColorSwatchButton icon={FontColorGlyph} label="Text color" color="#ff0000" />
        <ColorSwatchButton
          icon={BackgroundColorGlyph}
          label="Fill color"
          color="#ffff00"
          colorName="Marker yellow"
        />
      </>,
    );
    const text = screen.getByRole('button', { name: 'Text color' });
    expect(text).toHaveClass('ui-button', 'ui-color-swatch-button');
    expect(text).toHaveAttribute('data-variant', 'ghost');
    expect(text).toHaveAccessibleDescription('vibrant red');
    expect(text.querySelector('.ui-glyph')).toHaveAttribute('data-glyph', 'font-color');
    const bar = text.querySelector('.ui-color-swatch-button__swatch');
    expect(bar).toHaveClass('ui-color-swatch');
    expect(bar).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    // The glyph comes first, so the bar sits under it in the icon box.
    expect(bar?.previousElementSibling).toHaveAttribute('data-glyph', 'font-color');
    const fill = screen.getByRole('button', { name: 'Fill color' });
    expect(fill).toHaveAccessibleDescription('Marker yellow');
    expect(fill.querySelector('.ui-glyph')).toHaveAttribute('data-glyph', 'background-color');
    expectHooksMatchSpec(container, 'COLOR-SWATCH', { slots: ['swatch'] });
  });

  it('UIC-COLOR-SWATCH-3.1 draws an empty bar for no colour or an unreadable one', () => {
    render(
      <>
        <ColorSwatchButton icon={FontColorGlyph} label="None" />
        <ColorSwatchButton icon={FontColorGlyph} label="Unreadable" color="currentColor" />
      </>,
    );
    for (const name of ['None', 'Unreadable']) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAccessibleDescription('No color');
      expect(button.querySelector('.ui-color-swatch-button__swatch')).toHaveAttribute(
        'data-empty',
        'true',
      );
    }
  });

  it('UIC-COLOR-SWATCH-3.2 presses like a Button and refuses presses while disabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const onDisabledPress = vi.fn();
    render(
      <>
        <ColorSwatchButton
          icon={FontColorGlyph}
          label="Text color"
          color="#336699"
          onPress={onPress}
        />
        <ColorSwatchButton
          icon={FontColorGlyph}
          label="Locked"
          color="#336699"
          isDisabled
          onPress={onDisabledPress}
        />
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Text color' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    const locked = screen.getByRole('button', { name: 'Locked' });
    expect(locked).toBeDisabled();
    await user.click(locked);
    expect(onDisabledPress).not.toHaveBeenCalled();
  });

  it('UIC-COLOR-SWATCH-3.2 passes variant, size and tooltip on and forwards caller attributes', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement | HTMLAnchorElement | HTMLSpanElement>();
    const { container } = render(
      <ColorSwatchButton
        ref={ref}
        id="text-color"
        className="host"
        data-tool="text-color"
        icon={FontColorGlyph}
        label="Text color"
        color="#336699"
        variant="secondary"
        size="sm"
        tooltip="Text color"
        shortcut="Ctrl+Shift+C"
      />,
    );
    const button = screen.getByRole('button', { name: 'Text color' });
    expect(button).toBe(ref.current);
    expect(button).toHaveAttribute('id', 'text-color');
    expect(button).toHaveClass('host');
    expect(button).toHaveAttribute('data-tool', 'text-color');
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('aria-keyshortcuts');
    await user.hover(button);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Text color');
    expectHooksMatchSpec(container, 'COLOR-SWATCH', { callerAttributes: ['data-tool'] });
  });
});
