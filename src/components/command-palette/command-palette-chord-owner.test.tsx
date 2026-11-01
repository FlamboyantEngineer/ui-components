import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuEntry } from '../menu/menu.js';
import { Modal } from '../modal/modal.js';
import { CommandPalette } from './command-palette.js';

const commands: MenuEntry[] = [{ id: 'new', label: 'New file' }];

function pressShortcut(target: Element = document.body) {
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe('CommandPalette chord owner', () => {
  it('UIC-COMMAND-PALETTE-1.3 opens one palette per press: the last mounted, then the one before it', () => {
    const page = vi.fn();
    const pane = vi.fn();
    const { rerender } = render(
      <>
        <CommandPalette aria-label="Page commands" items={commands} onOpenChange={page} />
        <CommandPalette aria-label="Pane commands" items={commands} onOpenChange={pane} />
      </>,
    );
    pressShortcut();
    expect(pane).toHaveBeenCalledWith(true);
    expect(page).not.toHaveBeenCalled();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    rerender(<CommandPalette aria-label="Page commands" items={commands} onOpenChange={page} />);
    pressShortcut();
    expect(page).toHaveBeenCalledWith(true);
    expect(screen.getByRole('dialog', { name: 'Page commands' })).toBeInTheDocument();
  });

  it('UIC-COMMAND-PALETTE-1.3 lets a palette with another chord answer its own', () => {
    const page = vi.fn();
    render(
      <>
        <CommandPalette aria-label="Page commands" items={commands} onOpenChange={page} />
        <CommandPalette aria-label="Pane commands" items={commands} shortcut="Ctrl+J" />
      </>,
    );
    pressShortcut();
    expect(page).toHaveBeenCalledWith(true);
  });

  it('UIC-COMMAND-PALETTE-1.3 leaves the chord to another open modal', async () => {
    const onOpenChange = vi.fn();
    render(
      <>
        <CommandPalette items={commands} onOpenChange={onOpenChange} />
        <Modal title="Settings" isOpen>
          <input aria-label="Name" />
        </Modal>
      </>,
    );
    const name = await screen.findByRole('textbox', { name: 'Name' });
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Settings' })).toBeVisible());
    const event = pressShortcut(name);
    expect(event.defaultPrevented).toBe(false);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
