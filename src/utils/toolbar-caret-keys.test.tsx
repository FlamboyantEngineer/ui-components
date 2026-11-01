import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { ToolbarRow } from '../components/layout/toolbar-row.js';
import { PinInput } from '../components/pin-input/pin-input.js';
import { TextField } from '../components/text-field/text-field.js';
import { ToolbarScroller } from '../components/toolbar-scroller/toolbar-scroller.js';

const toolbars: Record<string, (children: ReactNode) => ReactNode> = {
  ToolbarRow: (children) => <ToolbarRow aria-label="Tools">{children}</ToolbarRow>,
  ToolbarScroller: (children) => <ToolbarScroller aria-label="Tools">{children}</ToolbarScroller>,
};

describe('text controls inside toolbars', () => {
  it.each(Object.keys(toolbars))(
    'UIC-LAYOUT-3.3 UIC-TOOLBAR-SCROLLER-1.2 keeps the caret keys of a text field in a %s until the caret reaches an end',
    async (name) => {
      const user = userEvent.setup();
      render(
        <>
          {toolbars[name]?.(
            <>
              <button type="button">Bold</button>
              <TextField label="Find" defaultValue="pear" />
              <button type="button">Next</button>
            </>,
          )}
        </>,
      );
      const field = screen.getByRole<HTMLInputElement>('textbox', { name: 'Find' });
      await user.click(field);
      await user.keyboard('{End}{ArrowLeft}');
      expect(field).toHaveFocus();
      expect(field.selectionStart).toBe(3);
      await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
      expect(field).toHaveFocus();
      expect(field.selectionStart).toBe(2);
      await user.keyboard('{End}{ArrowRight}');
      expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
      await user.keyboard('{ArrowLeft}');
      expect(field).toHaveFocus();
      await user.keyboard('{Home}{ArrowLeft}');
      expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    },
  );

  it('UIC-LAYOUT-3.3 leaves the arrows between PIN cells to the PIN input', async () => {
    const user = userEvent.setup();
    render(
      <ToolbarRow aria-label="Tools">
        <PinInput label="Code" length={3} defaultValue="123" />
        <button type="button">Send</button>
      </ToolbarRow>,
    );
    const cells = screen.getAllByRole('textbox');
    await user.click(requireCell(cells, 0));
    await user.keyboard('{ArrowRight}');
    expect(requireCell(cells, 1)).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(requireCell(cells, 2)).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(requireCell(cells, 1)).toHaveFocus();
  });
});

function requireCell(cells: HTMLElement[], index: number): HTMLElement {
  const cell = cells[index];
  if (!cell) throw new Error(`No cell ${index}`);
  return cell;
}
