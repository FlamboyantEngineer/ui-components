import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { GridItem, type GridItemOffset, type GridItemSpan } from './grid-item.js';
import { Grid } from './layout.js';

describe('GridItem', () => {
  it('UIC-LAYOUT-1.1 UIC-LAYOUT-1.3 renders a div with its hooks, caller class and attributes', () => {
    const { container } = render(
      <Grid columns={12}>
        <GridItem className="caller" id="cell" data-owner="orchard">
          Apple
        </GridItem>
      </Grid>,
    );
    const item = requireDefined(container.querySelector('.ui-grid-item'));
    expect(item.tagName).toBe('DIV');
    expect(item).toHaveClass('ui-grid-item', 'caller');
    expect(item).toHaveAttribute('id', 'cell');
    expect(item).toHaveAttribute('data-owner', 'orchard');
    expectHooksMatchSpec(container, 'LAYOUT', { callerAttributes: ['data-owner'] });
  });

  it('UIC-LAYOUT-1.2 renders the element chosen with as', () => {
    const { container } = render(
      <Grid as="ul" columns={3}>
        <GridItem as="li" span={2}>
          Apple
        </GridItem>
      </Grid>,
    );
    expect(container.querySelector('ul > li.ui-grid-item')).toHaveAttribute('data-span', '2');
  });

  it('UIC-LAYOUT-2.6 publishes the span and offset, one column and no offset by default', () => {
    const { container, rerender } = render(<GridItem>Apple</GridItem>);
    const item = () => container.firstElementChild;
    expect(item()).toHaveAttribute('data-span', '1');
    expect(item()).toHaveAttribute('data-offset', '0');
    const spans: GridItemSpan[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 'full'];
    for (const span of spans) {
      rerender(<GridItem span={span}>Apple</GridItem>);
      expect(item()).toHaveAttribute('data-span', String(span));
      expectHooksMatchSpec(container, 'LAYOUT');
    }
    const offsets: GridItemOffset[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    for (const offset of offsets) {
      rerender(<GridItem offset={offset}>Apple</GridItem>);
      expect(item()).toHaveAttribute('data-offset', String(offset));
      expectHooksMatchSpec(container, 'LAYOUT');
    }
  });
});
