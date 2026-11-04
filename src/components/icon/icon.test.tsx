import { render, screen } from '@testing-library/react';
import type { SVGProps } from 'react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  CheckGlyph,
  CloseGlyph,
  type GlyphComponentProps,
  HelpGlyph,
  InfoGlyph,
  PlusGlyph,
} from '../../core/glyphs.js';
import { UiProvider } from '../../core/provider.js';
import { Icon } from './icon.js';
import { toIconProps, toImageProps } from './icon-props.js';

/** An icon from another set: any SVG component that takes the glyph props. */
function ThirdPartyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

describe('Icon', () => {
  it('UIC-ICON-1.1 draws a built-in glyph in the glyph slot', () => {
    const { container } = render(<Icon icon={CloseGlyph} />);
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
        <Icon icon={CheckGlyph} />
      </UiProvider>,
    );
    const dot = container.querySelector('[data-dot]');
    expect(dot).not.toBeNull();
    expect(dot).toHaveClass('ui-icon__glyph');
  });

  it('UIC-ICON-1.1 turns an icon source into Icon props', () => {
    const node = <svg />;
    expect(toIconProps(CloseGlyph)).toEqual({ icon: CloseGlyph });
    expect(toIconProps(node)).toEqual({ children: node });
  });

  it('UIC-ICON-1.1 draws custom text through an element', () => {
    const star = <span>★</span>;
    expect(toIconProps(star)).toEqual({ children: star });
    const { container } = render(<Icon {...toIconProps(star)} />);
    expect(container.querySelector('.ui-icon')).toHaveTextContent('★');
    expect(container.querySelector('.ui-icon__glyph')).toBeNull();
  });

  it('UIC-ICON-1.1 accepts third-party components without a built-in key', () => {
    const { container } = render(<Icon {...toIconProps(ThirdPartyIcon)} label="Close" />);
    expect(screen.getByRole('img', { name: 'Close' })).not.toHaveAttribute('data-glyph');
    expect(container.querySelector('svg')).toHaveClass('ui-glyph', 'ui-icon__glyph');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('UIC-ICON-1.1 can explicitly select the built-in default in provider overrides', () => {
    const { container } = render(
      <UiProvider icons={{ close: CloseGlyph }}>
        <Icon icon={CloseGlyph} />
      </UiProvider>,
    );
    expect(container.querySelector('svg')).toHaveAttribute('data-glyph', 'close');
  });

  it('UIC-ICON-1.2 publishes the size, medium by default', () => {
    const { container, rerender } = render(<Icon icon={PlusGlyph} />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<Icon icon={PlusGlyph} size={size} />);
      expect(container.firstElementChild).toHaveAttribute('data-size', size);
      expectHooksMatchSpec(container, 'ICON');
    }
  });

  it('UIC-ICON-1.5 publishes an inherited size that follows the font', () => {
    const { container } = render(<Icon icon={PlusGlyph} size="inherit" />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'inherit');
    expectHooksMatchSpec(container, 'ICON', { slots: 'all' });
  });

  it('UIC-ICON-1.3 is decorative without a label and an image with one', () => {
    const { container, rerender } = render(<Icon icon={InfoGlyph} />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).not.toHaveAttribute('role');

    rerender(<Icon icon={InfoGlyph} label="Information" />);
    const image = screen.getByRole('img', { name: 'Information' });
    expect(image).not.toHaveAttribute('aria-hidden');
    expect(image.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(toImageProps('Information')).toEqual({ role: 'img', 'aria-label': 'Information' });
    expect(toImageProps('')).toEqual({ 'aria-hidden': true });
  });

  it('UIC-ICON-1.4 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <Icon
        icon={HelpGlyph}
        className="caller"
        id="help-icon"
        data-testid="probe"
        data-size="xl"
      />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-icon', 'caller');
    expect(root).toHaveAttribute('id', 'help-icon');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-size', 'md');
    expectHooksMatchSpec(container, 'ICON');
  });
});

describe('Icon root ref', () => {
  it('UIC-ICON-1.4 forwards ref to its root', () => {
    const ref = { current: null as HTMLSpanElement | null };
    const { container } = render(<Icon ref={ref} icon={CloseGlyph} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.querySelector('.ui-icon'));
  });
});
