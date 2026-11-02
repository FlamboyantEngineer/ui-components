import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ToolbarRow, ToolbarRowSeparator } from '../layout/toolbar-row.js';
import { Menu, MenuItem, MenuSeparator } from '../menu/menu.js';
import { Separator } from './separator.js';

const variants = ['solid', 'dashed', 'dotted', 'wiggly'] as const;
const positions = ['start', 'center', 'end'] as const;

describe('Separator', () => {
  it('UIC-SEPARATOR-1.1 UIC-SEPARATOR-3.1 renders a horizontal rule as an hr with the separator role', () => {
    const { container } = render(<Separator />);
    const rule = screen.getByRole('separator');
    expect(rule.tagName).toBe('HR');
    expect(rule).toHaveClass('ui-separator');
    expect(rule).not.toHaveAttribute('aria-orientation');
    expect(rule).not.toHaveAttribute('role');
    expect(rule.childNodes).toHaveLength(0);
    expectHooksMatchSpec(container, 'SEPARATOR');
  });

  it('UIC-SEPARATOR-1.2 UIC-SEPARATOR-3.1 renders a vertical rule as a div stating its orientation', () => {
    const { container } = render(<Separator orientation="vertical" />);
    const rule = screen.getByRole('separator');
    expect(rule.tagName).toBe('DIV');
    expect(rule).toHaveAttribute('role', 'separator');
    expect(rule).toHaveAttribute('aria-orientation', 'vertical');
    expect(rule).toHaveAttribute('data-orientation', 'vertical');
    expectHooksMatchSpec(container, 'SEPARATOR');
  });

  it('UIC-SEPARATOR-1.1 renders the element `as` names', () => {
    render(<Separator as="div" />);
    const rule = screen.getByRole('separator');
    expect(rule.tagName).toBe('DIV');
    expect(rule).toHaveAttribute('role', 'separator');
  });

  it('UIC-SEPARATOR-1.2 UIC-SEPARATOR-1.3 publishes orientation and line style with defaults', () => {
    const { container, rerender } = render(<Separator />);
    const rule = () => container.querySelector('.ui-separator');
    expect(rule()).toHaveAttribute('data-orientation', 'horizontal');
    expect(rule()).toHaveAttribute('data-variant', 'solid');
    expect(rule()).not.toHaveAttribute('data-label-position');
    expect(rule()).not.toHaveAttribute('data-label-placement');
    for (const variant of variants) {
      for (const orientation of ['horizontal', 'vertical'] as const) {
        rerender(<Separator variant={variant} orientation={orientation} />);
        expect(rule()).toHaveAttribute('data-variant', variant);
        expect(rule()).toHaveAttribute('data-orientation', orientation);
        expectHooksMatchSpec(container, 'SEPARATOR');
      }
    }
  });

  it('UIC-SEPARATOR-1.4 appends the caller class and keeps its hooks over caller attributes', () => {
    const { container } = render(
      <Separator
        className="caller"
        id="rule"
        data-variant="caller"
        data-owner="kitchen"
        aria-label="Desserts"
      />,
    );
    const rule = screen.getByRole('separator', { name: 'Desserts' });
    expect(rule).toHaveClass('ui-separator', 'caller');
    expect(rule).toHaveAttribute('id', 'rule');
    expect(rule).toHaveAttribute('data-variant', 'solid');
    expect(rule).toHaveAttribute('data-owner', 'kitchen');
    expectHooksMatchSpec(container, 'SEPARATOR', { callerAttributes: ['data-owner'] });
  });

  it('UIC-SEPARATOR-1.5 hands the finished props to render', () => {
    const { container } = render(
      <Separator
        label="or"
        variant="dashed"
        render={(props, state) => <div {...props} data-swapped={state.orientation} />}
      />,
    );
    const rule = screen.getByRole('separator', { name: 'or' });
    expect(rule).toHaveAttribute('data-swapped', 'horizontal');
    expect(rule).toHaveClass('ui-separator');
    expect(rule).toHaveAttribute('data-variant', 'dashed');
    expect(rule.querySelector('.ui-separator__label')).toHaveTextContent('or');
    expectHooksMatchSpec(container, 'SEPARATOR', {
      slots: 'all',
      callerAttributes: ['data-swapped'],
    });
  });

  it('UIC-SEPARATOR-2.1 UIC-SEPARATOR-3.2 draws a labelled separator named by its label between two lines', () => {
    const { container } = render(<Separator label="Desserts" />);
    const rule = screen.getByRole('separator', { name: 'Desserts' });
    expect(rule.tagName).toBe('DIV');
    const parts = [...rule.children];
    expect(parts.map((part) => part.className)).toEqual([
      'ui-separator__start-line',
      'ui-separator__label',
      'ui-separator__end-line',
    ]);
    expect(parts[0]).toHaveAttribute('aria-hidden', 'true');
    expect(parts[2]).toHaveAttribute('aria-hidden', 'true');
    expect(parts[0]).toBeEmptyDOMElement();
    expect(rule).toHaveAttribute('aria-labelledby', parts[1]?.id);
    expectHooksMatchSpec(container, 'SEPARATOR', { slots: 'all' });
  });

  it('UIC-SEPARATOR-2.1 treats an empty label as no label', () => {
    render(<Separator label="" />);
    const rule = screen.getByRole('separator');
    expect(rule.tagName).toBe('HR');
    expect(rule).not.toHaveAttribute('aria-labelledby');
    expect(rule).not.toHaveAttribute('data-label-position');
  });

  it('UIC-SEPARATOR-2.2 publishes the label position of a labelled separator', () => {
    const { container, rerender } = render(<Separator label="2026" />);
    const rule = () => container.querySelector('.ui-separator');
    expect(rule()).toHaveAttribute('data-label-position', 'center');
    for (const labelPosition of positions) {
      rerender(<Separator label="2026" labelPosition={labelPosition} orientation="vertical" />);
      expect(rule()).toHaveAttribute('data-label-position', labelPosition);
      expect(rule()).toHaveAttribute('aria-orientation', 'vertical');
      expectHooksMatchSpec(container, 'SEPARATOR', { slots: 'all' });
    }
  });

  it('UIC-SEPARATOR-2.3 publishes the label placement of a labelled separator apart from its position', () => {
    const { container, rerender } = render(<Separator label="2026" labelPosition="end" />);
    const rule = () => container.querySelector('.ui-separator');
    expect(rule()).toHaveAttribute('data-label-placement', 'across');
    for (const labelPlacement of ['before', 'after'] as const) {
      for (const orientation of ['horizontal', 'vertical'] as const) {
        rerender(
          <Separator
            label="2026"
            labelPlacement={labelPlacement}
            labelPosition="end"
            orientation={orientation}
          />,
        );
        expect(rule()).toHaveAttribute('data-label-placement', labelPlacement);
        expect(rule()).toHaveAttribute('data-label-position', 'end');
        expect(screen.getByRole('separator', { name: '2026' })).toBe(rule());
        expectHooksMatchSpec(container, 'SEPARATOR', { slots: 'all' });
      }
    }
    rerender(<Separator labelPlacement="before" />);
    expect(rule()).not.toHaveAttribute('data-label-placement');
  });

  it('UIC-SEPARATOR-3.2 lets the caller name a labelled separator', () => {
    render(
      <>
        <span id="heading">Fruit section</span>
        <Separator label="Fruit" aria-labelledby="heading" />
        <Separator label="Pastry" aria-label="Pastry section" />
      </>,
    );
    expect(screen.getByRole('separator', { name: 'Fruit section' })).toBeInTheDocument();
    expect(screen.getByRole('separator', { name: 'Pastry section' })).not.toHaveAttribute(
      'aria-labelledby',
    );
  });

  it('UIC-SEPARATOR-3.3 takes no focus', async () => {
    render(
      <>
        <button type="button">Before</button>
        <Separator label="or" />
        <Separator orientation="vertical" />
        <button type="button">After</button>
      </>,
    );
    for (const rule of screen.getAllByRole('separator'))
      expect(rule).not.toHaveAttribute('tabindex');
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('UIC-SEPARATOR-3.4 renders a decorative rule with no role, orientation or name', () => {
    const { container } = render(
      <>
        <Separator decorative orientation="vertical" />
        <Separator decorative label="or" aria-label="Alternatives" />
      </>,
    );
    expect(screen.queryAllByRole('separator')).toHaveLength(0);
    const [vertical, labelled] = [...container.querySelectorAll('.ui-separator')];
    expect(vertical).toHaveAttribute('role', 'none');
    expect(vertical).not.toHaveAttribute('aria-orientation');
    expect(vertical).toHaveAttribute('data-orientation', 'vertical');
    expect(labelled).toHaveAttribute('role', 'none');
    expect(labelled).not.toHaveAttribute('aria-labelledby');
    expect(labelled).not.toHaveAttribute('aria-label');
    expect(labelled).toHaveTextContent('or');
    expectHooksMatchSpec(container, 'SEPARATOR', { slots: 'all' });
  });

  it('UIC-SEPARATOR-4.1 underlies the toolbar row and menu separators', () => {
    const { container } = render(
      <>
        <ToolbarRow aria-label="Editing">
          <button type="button">Cut</button>
          <ToolbarRowSeparator className="caller" />
          <button type="button">Undo</button>
        </ToolbarRow>
        <Menu aria-label="Edit">
          <MenuItem>Cut</MenuItem>
          <MenuSeparator />
          <MenuItem>Undo</MenuItem>
        </Menu>
      </>,
    );
    const toolbarRule = container.querySelector('.ui-toolbar-row__separator');
    expect(toolbarRule).toHaveClass('ui-separator', 'caller');
    expect(toolbarRule).toHaveAttribute('role', 'separator');
    expect(toolbarRule).toHaveAttribute('data-orientation', 'vertical');
    expect(toolbarRule).toHaveAttribute('data-variant', 'solid');
    const menuRule = within(screen.getByRole('menu', { name: 'Edit' })).getByRole('separator');
    expect(menuRule).toHaveClass('ui-separator', 'ui-menu-separator');
    expect(menuRule.tagName).toBe('HR');
    expect(menuRule).toHaveAttribute('data-orientation', 'horizontal');
    expectHooksMatchSpec(container, 'SEPARATOR');
    expectHooksMatchSpec(container, 'LAYOUT', { slots: ['separator'] });
    expectHooksMatchSpec(document.body, 'MENU');
  });
});

describe('Separator root ref', () => {
  it('UIC-SEPARATOR-1.4 forwards ref to its root', () => {
    const ref = { current: null as HTMLElement | null };
    const { container } = render(<Separator ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.querySelector('.ui-separator'));
    expect(ref.current?.tagName).toBe('HR');
  });
});
