import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ToolbarRow, ToolbarRowGroup, ToolbarRowSeparator } from './toolbar-row.js';

describe('ToolbarRow', () => {
  it('UIC-LAYOUT-3.3 renders a toolbar with arrow-key focus, a group or no role, and a variant', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <>
        <button type="button">Before</button>
        <ToolbarRow aria-label="Fruit actions">
          <button type="button">Peel</button>
          <button type="button">Slice</button>
        </ToolbarRow>
      </>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Fruit actions' });
    expect(toolbar).toHaveClass('ui-toolbar-row');
    expect(toolbar).toHaveAttribute('data-variant', 'plain');
    expect(toolbar).toHaveAttribute('data-orientation', 'horizontal');
    expectHooksMatchSpec(container, 'LAYOUT');

    await user.click(screen.getByRole('button', { name: 'Peel' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Slice' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Peel' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();

    rerender(
      <ToolbarRow role="group" variant="surface" aria-label="Fruit actions">
        <button type="button">Peel</button>
      </ToolbarRow>,
    );
    const group = screen.getByRole('group', { name: 'Fruit actions' });
    expect(group).toHaveAttribute('data-variant', 'surface');
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expectHooksMatchSpec(container, 'LAYOUT');

    rerender(<ToolbarRow role="none">Text</ToolbarRow>);
    expect(container.firstElementChild).not.toHaveAttribute('role');
  });

  it('UIC-LAYOUT-3.6 stacks a vertical row and moves toolbar focus with Up and Down', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <ToolbarRow aria-label="Tools" orientation="vertical">
        <button type="button">Peel</button>
        <button type="button">Slice</button>
      </ToolbarRow>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Tools' });
    expect(toolbar).toHaveAttribute('data-orientation', 'vertical');
    expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
    await user.click(screen.getByRole('button', { name: 'Peel' }));
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Slice' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: 'Peel' })).toHaveFocus();
    expectHooksMatchSpec(container, 'LAYOUT');

    for (const role of ['group', 'none'] as const) {
      rerender(
        <ToolbarRow role={role} orientation="vertical" aria-label="Tools">
          <button type="button">Peel</button>
        </ToolbarRow>,
      );
      expect(container.firstElementChild).toHaveAttribute('data-orientation', 'vertical');
    }
  });

  it('UIC-LAYOUT-3.7 groups controls and separates them across the row', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <ToolbarRow aria-label="Editing">
        <ToolbarRowGroup aria-label="Clipboard" data-owner="kitchen">
          <button type="button">Cut</button>
          <button type="button">Copy</button>
        </ToolbarRowGroup>
        <ToolbarRowSeparator data-owner="kitchen" />
        <ToolbarRowGroup aria-label="History" className="caller">
          <button type="button">Undo</button>
        </ToolbarRowGroup>
      </ToolbarRow>,
    );
    const clipboard = screen.getByRole('group', { name: 'Clipboard' });
    expect(clipboard).toHaveClass('ui-toolbar-row__group');
    expect(clipboard).toHaveAttribute('data-orientation', 'horizontal');
    expect(clipboard).toHaveAttribute('data-owner', 'kitchen');
    expect(screen.getByRole('group', { name: 'History' })).toHaveClass('caller');
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('ui-toolbar-row__separator');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
    expect(separator).toHaveAttribute('data-owner', 'kitchen');
    expect(separator).not.toHaveAttribute('tabindex');
    expectHooksMatchSpec(container, 'LAYOUT', {
      slots: ['group', 'separator'],
      callerAttributes: ['data-owner'],
    });

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();

    rerender(
      <ToolbarRow aria-label="Editing" orientation="vertical">
        <ToolbarRowGroup aria-label="Clipboard">
          <button type="button">Cut</button>
        </ToolbarRowGroup>
        <ToolbarRowSeparator />
      </ToolbarRow>,
    );
    expect(screen.getByRole('group', { name: 'Clipboard' })).toHaveAttribute(
      'data-orientation',
      'vertical',
    );
    const rule = container.querySelector('.ui-toolbar-row__separator')!;
    expect(rule.tagName).toBe('HR');
    expect(rule).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('UIC-LAYOUT-3.8 wraps the row and its groups, scrolls it in a toolbar scroller, or keeps one row', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <ToolbarRow aria-label="Kitchen">
        <ToolbarRowGroup aria-label="Knives">
          <button type="button">Peel</button>
        </ToolbarRowGroup>
      </ToolbarRow>,
    );
    const row = screen.getByRole('toolbar', { name: 'Kitchen' });
    expect(row).toHaveAttribute('data-overflow', 'wrap');
    expect(row).toHaveAttribute('data-wrap', 'wrap');
    expect(screen.getByRole('group', { name: 'Knives' })).toHaveAttribute('data-wrap', 'wrap');
    expectHooksMatchSpec(container, 'LAYOUT', { slots: ['group'] });

    rerender(
      <ToolbarRow aria-label="Kitchen" overflow="scroll" data-owner="kitchen">
        <ToolbarRowGroup aria-label="Knives">
          <button type="button">Peel</button>
          <button type="button">Slice</button>
        </ToolbarRowGroup>
        <button type="button">Juice</button>
      </ToolbarRow>,
    );
    const root = container.querySelector('.ui-toolbar-row')!;
    expect(root).toHaveAttribute('data-overflow', 'scroll');
    expect(root).toHaveAttribute('data-wrap', 'nowrap');
    expect(root).toHaveAttribute('data-owner', 'kitchen');
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('aria-label');
    const strip = screen.getByRole('toolbar', { name: 'Kitchen' });
    expect(strip).toHaveClass('ui-toolbar-scroller__strip');
    expect(root.firstElementChild).toHaveClass('ui-toolbar-scroller');
    expect(screen.getByRole('group', { name: 'Knives' })).toHaveAttribute('data-wrap', 'nowrap');
    await user.click(screen.getByRole('button', { name: 'Slice' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Juice' })).toHaveFocus();
    expectHooksMatchSpec(container, 'LAYOUT', {
      slots: ['group'],
      callerAttributes: ['data-owner'],
    });

    rerender(
      <ToolbarRow aria-label="Kitchen" overflow="none">
        <button type="button">Peel</button>
      </ToolbarRow>,
    );
    expect(screen.getByRole('toolbar', { name: 'Kitchen' })).toHaveAttribute(
      'data-overflow',
      'none',
    );
    expect(screen.getByRole('toolbar', { name: 'Kitchen' })).toHaveAttribute('data-wrap', 'nowrap');

    rerender(
      <ToolbarRow aria-label="Kitchen" overflow="scroll" orientation="vertical">
        <button type="button">Peel</button>
      </ToolbarRow>,
    );
    const column = screen.getByRole('toolbar', { name: 'Kitchen' });
    expect(column).toHaveClass('ui-toolbar-row');
    expect(column).toHaveAttribute('data-overflow', 'none');
    expect(container.querySelector('.ui-toolbar-scroller')).toBeNull();
  });

  it('UIC-LAYOUT-3.9 keeps a pending row in place with inert controls', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { container, rerender } = render(
      <ToolbarRow aria-label="Editing" isPending>
        <button type="button" onClick={onPress}>
          Bold
        </button>
      </ToolbarRow>,
    );
    const row = container.querySelector('.ui-toolbar-row')!;
    expect(row).toHaveAttribute('data-pending', 'true');
    expect(row).toHaveAttribute('inert');
    expectHooksMatchSpec(container, 'LAYOUT');

    rerender(
      <ToolbarRow aria-label="Editing" isPending overflow="scroll">
        <button type="button">Bold</button>
      </ToolbarRow>,
    );
    expect(container.querySelector('.ui-toolbar-row')).toHaveAttribute('inert');

    rerender(
      <ToolbarRow aria-label="Editing">
        <button type="button" onClick={onPress}>
          Bold
        </button>
      </ToolbarRow>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Editing' });
    expect(toolbar).not.toHaveAttribute('data-pending');
    expect(toolbar).not.toHaveAttribute('inert');
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('UIC-LAYOUT-3.10 joins the controls of an attached group', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ToolbarRow aria-label="Text">
        <ToolbarRowGroup aria-label="Alignment" density="attached">
          <button type="button">Left</button>
          <button type="button">Centre</button>
        </ToolbarRowGroup>
        <ToolbarRowGroup aria-label="History">
          <button type="button">Undo</button>
        </ToolbarRowGroup>
      </ToolbarRow>,
    );
    expect(screen.getByRole('group', { name: 'Alignment' })).toHaveAttribute(
      'data-density',
      'attached',
    );
    expect(screen.getByRole('group', { name: 'History' })).toHaveAttribute(
      'data-density',
      'regular',
    );
    await user.click(screen.getByRole('button', { name: 'Left' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Centre' })).toHaveFocus();
    expectHooksMatchSpec(container, 'LAYOUT', { slots: ['group'] });
  });
});
