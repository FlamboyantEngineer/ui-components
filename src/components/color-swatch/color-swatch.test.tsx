import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { ColorSwatch } from './color-swatch.js';

describe('ColorSwatch', () => {
  it('UIC-COLOR-SWATCH-1.1 fills itself with the colour and is named by it', () => {
    const { container } = render(
      <>
        <ColorSwatch color="#336699" />
        <ColorSwatch color="rgb(255, 0, 0)" colorName="Signal red" />
        <ColorSwatch color="#00aa00" aria-label="Ripe" />
      </>,
    );
    const swatch = screen.getByRole('img', { name: 'dark grayish cyan blue' });
    expect(swatch).toHaveClass('ui-color-swatch');
    expect(swatch).toHaveAttribute('aria-roledescription', 'color swatch');
    expect(swatch.style.backgroundColor).toBe('rgb(51, 102, 153)');
    expect(screen.getByRole('img', { name: 'Signal red' }).style.backgroundColor).toBe(
      'rgb(255, 0, 0)',
    );
    expect(screen.getByRole('img', { name: /Ripe$/ })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'COLOR-SWATCH');
  });

  it('UIC-COLOR-SWATCH-1.2 marks an empty swatch and names it from the provider', () => {
    const { container } = render(
      <>
        <ColorSwatch />
        <ColorSwatch color="" />
        <UiProvider strings={{ noColor: 'Aucune couleur' }}>
          <ColorSwatch color={null} />
        </UiProvider>
      </>,
    );
    const empty = screen.getAllByRole('img', { name: 'No color' });
    expect(empty).toHaveLength(2);
    for (const swatch of empty) expect(swatch).toHaveAttribute('data-empty', 'true');
    expect(screen.getByRole('img', { name: 'Aucune couleur' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'COLOR-SWATCH');
  });

  it.each(['red', 'transparent', 'currentColor', 'oklch(70% 0.1 200)', 'rgb(0 0 0 / 50%)'])(
    'UIC-COLOR-SWATCH-1.2 draws %s, a notation React Aria does not read, as an empty swatch',
    (color) => {
      render(<ColorSwatch color={color} />);
      const swatch = screen.getByRole('img', { name: 'No color' });
      expect(swatch).toHaveAttribute('data-empty', 'true');
      expect(swatch.style.backgroundColor).toBe('rgba(255, 255, 255, 0)');
    },
  );

  it('UIC-COLOR-SWATCH-1.3 publishes its size', () => {
    const { container } = render(
      <>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <ColorSwatch key={size} color="#cc3300" size={size} />
        ))}
        <ColorSwatch color="#cc3300" />
      </>,
    );
    expect(
      [...container.querySelectorAll('.ui-color-swatch')].map((node) =>
        node.getAttribute('data-size'),
      ),
    ).toEqual(['xs', 'sm', 'md', 'lg', 'xl', 'md']);
    expectHooksMatchSpec(container, 'COLOR-SWATCH');
  });

  it('UIC-COLOR-SWATCH-1.4 forwards the class name, data attributes and id', () => {
    const { container } = render(
      <ColorSwatch color="#cc3300" id="marker" className="legend" data-test="marker" />,
    );
    const swatch = container.querySelector('.ui-color-swatch');
    expect(swatch).toHaveClass('ui-color-swatch', 'legend');
    expect(swatch).toHaveAttribute('id', 'marker');
    expect(swatch).toHaveAttribute('data-test', 'marker');
    expectHooksMatchSpec(container, 'COLOR-SWATCH', { callerAttributes: ['data-test'] });
  });
});
