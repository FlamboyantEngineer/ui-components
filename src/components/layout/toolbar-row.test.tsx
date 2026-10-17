import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ToolbarRow } from './toolbar-row.js';

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
    expect(group).not.toHaveAttribute('data-orientation');
    expectHooksMatchSpec(container, 'LAYOUT');

    rerender(<ToolbarRow role="none">Text</ToolbarRow>);
    expect(container.firstElementChild).not.toHaveAttribute('role');
  });
});
