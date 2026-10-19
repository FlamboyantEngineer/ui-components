import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import type { GlyphComponentProps } from '../../core/glyphs.js';
import { Icon, isGlyphName, toIconProps, toImageProps } from './icon.js';

describe('Icon', () => {
  it('UIC-ICON-1.1 draws a built-in glyph in the glyph slot', () => {
    const { container } = render(<Icon glyph="close" />);
    const glyph = container.querySelector('.ui-icon > svg');
    expect(glyph).toHaveClass('ui-glyph', 'ui-icon__glyph');
    expect(glyph).toHaveAttribute('data-glyph', 'close');
    expectHooksMatchSpec(container, 'ICON', { slots: 'all' });
  });

  it('UIC-ICON-1.1 draws children when no glyph is given, and provider glyph replacements', () => {
    const { container, rerender } = render(
      <Icon>
        <svg aria-label="Custom glyph" />
      </Icon>,
    );
    expect(screen.getByLabelText('Custom glyph').parentElement).toHaveClass('ui-icon');
    expect(container.querySelector('.ui-icon__glyph')).toBeNull();

    function Dot(props: GlyphComponentProps) {
      return <svg {...props} data-dot="true" />;
    }
    rerender(
      <UiProvider icons={{ check: Dot }}>
        <Icon glyph="check" />
      </UiProvider>,
    );
    const dot = container.querySelector('[data-dot]');
    expect(dot).not.toBeNull();
    expect(dot).toHaveClass('ui-icon__glyph');
  });

  it('UIC-ICON-1.1 turns an icon source into Icon props', () => {
    const node = <svg />;
    expect(isGlyphName('close')).toBe(true);
    expect(isGlyphName(node)).toBe(false);
    expect(toIconProps('close')).toEqual({ glyph: 'close' });
    expect(toIconProps(node)).toEqual({ children: node });
  });

  it('UIC-ICON-1.2 publishes the size, medium by default', () => {
    const { container, rerender } = render(<Icon glyph="plus" />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<Icon glyph="plus" size={size} />);
      expect(container.firstElementChild).toHaveAttribute('data-size', size);
      expectHooksMatchSpec(container, 'ICON');
    }
  });

  it('UIC-ICON-1.5 publishes an inherited size that follows the font', () => {
    const { container } = render(<Icon glyph="plus" size="inherit" />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'inherit');
    expectHooksMatchSpec(container, 'ICON', { slots: 'all' });
  });

  it('UIC-ICON-1.3 is decorative without a label and an image with one', () => {
    const { container, rerender } = render(<Icon glyph="info" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).not.toHaveAttribute('role');

    rerender(<Icon glyph="info" label="Information" />);
    const image = screen.getByRole('img', { name: 'Information' });
    expect(image).not.toHaveAttribute('aria-hidden');
    expect(image.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(toImageProps('Information')).toEqual({ role: 'img', 'aria-label': 'Information' });
    expect(toImageProps('')).toEqual({ 'aria-hidden': true });
  });

  it('UIC-ICON-1.4 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <Icon glyph="help" className="caller" id="help-icon" data-testid="probe" data-size="xl" />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-icon', 'caller');
    expect(root).toHaveAttribute('id', 'help-icon');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-size', 'md');
    expectHooksMatchSpec(container, 'ICON');
  });
});
