import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { AspectRatio, type AspectRatioValue } from './aspect-ratio.js';

describe('AspectRatio', () => {
  it('UIC-LAYOUT-1.1 UIC-LAYOUT-1.3 renders a div with its hooks, caller class and attributes', () => {
    const { container } = render(
      <AspectRatio className="caller" id="map" data-owner="atlas" aria-label="Map">
        <img alt="" src="data:," />
      </AspectRatio>,
    );
    const box = requireDefined(container.firstElementChild);
    expect(box.tagName).toBe('DIV');
    expect(box).toHaveClass('ui-aspect-ratio', 'caller');
    expect(box).toHaveAttribute('id', 'map');
    expect(box).toHaveAttribute('data-owner', 'atlas');
    expect(box.querySelector('img')).not.toBeNull();
    expectHooksMatchSpec(container, 'LAYOUT', { callerAttributes: ['data-owner'] });
  });

  it('UIC-LAYOUT-3.5 publishes the ratio, square by default', () => {
    const { container, rerender } = render(<AspectRatio />);
    expect(container.firstElementChild).toHaveAttribute('data-ratio', '1-1');
    const ratios: AspectRatioValue[] = ['4-3', '3-2', '16-9', '21-9', '3-4', '2-3', '9-16'];
    for (const ratio of ratios) {
      rerender(<AspectRatio ratio={ratio} />);
      expect(container.firstElementChild).toHaveAttribute('data-ratio', ratio);
      expectHooksMatchSpec(container, 'LAYOUT');
    }
  });
});
