import { UndoGlyph } from '../../core/glyphs.js';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import { ButtonGroup } from './button-group.js';

describe('ButtonGroup', () => {
  it('UIC-BUTTON-GROUP-1.1 groups its buttons under a name and keeps each tab stop', async () => {
    const onPress = vi.fn();
    render(
      <ButtonGroup aria-label="History">
        <Button onPress={onPress}>Undo</Button>
        <Button>Redo</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'History' });
    expect(group).toHaveClass('ui-button-group');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();
    expect(group).toHaveAttribute('data-focus-within', 'true');
    expect(group).toHaveAttribute('data-focus-visible', 'true');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Redo' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(document.body, 'BUTTON-GROUP');
  });

  it('UIC-BUTTON-GROUP-1.2 UIC-BUTTON-GROUP-1.3 publishes density, orientation and justification', () => {
    const { rerender } = render(
      <ButtonGroup aria-label="View">
        <Button icon={UndoGlyph} label="Undo" />
      </ButtonGroup>,
    );
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('data-density', 'default');
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(group).not.toHaveAttribute('data-justified');
    rerender(
      <ButtonGroup aria-label="View" attached orientation="vertical" justified>
        <Button icon={UndoGlyph} label="Undo" />
      </ButtonGroup>,
    );
    expect(group).toHaveAttribute('data-attached', 'true');
    expect(group).toHaveAttribute('data-density', 'default');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    expect(group).toHaveAttribute('data-justified', 'true');
    rerender(
      <ButtonGroup aria-label="View" density="compact">
        <Button icon={UndoGlyph} label="Undo" />
      </ButtonGroup>,
    );
    expect(group).toHaveAttribute('data-density', 'compact');
    expectHooksMatchSpec(document.body, 'BUTTON-GROUP');
  });

  it('UIC-BUTTON-GROUP-1.4 forwards caller attributes and ref and renders through the caller element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ButtonGroup
        ref={ref}
        id="history"
        className="caller"
        aria-label="History"
        data-owner="group"
        data-density="caller"
        render={(props, state) => (
          <div {...props} data-swapped="yes" data-within={String(state.isFocusWithin)} />
        )}
      >
        <Button>Undo</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'History' });
    expect(group).toBe(ref.current);
    expect(group).toHaveAttribute('data-owner', 'group');
    expect(group).toHaveAttribute('id', 'history');
    expect(group).toHaveClass('ui-button-group', 'caller');
    expect(group).toHaveAttribute('data-density', 'default');
    expect(group).toHaveAttribute('data-swapped', 'yes');
    expect(group).toHaveAttribute('data-within', 'false');
    expectHooksMatchSpec(document.body, 'BUTTON-GROUP', {
      callerAttributes: ['data-owner', 'data-swapped', 'data-within'],
    });
  });
});
