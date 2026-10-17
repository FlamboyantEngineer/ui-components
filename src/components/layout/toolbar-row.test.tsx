import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
});
