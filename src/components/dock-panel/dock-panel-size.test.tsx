import { EditGlyph, FolderGlyph } from '../../core/glyphs.js';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  flushFrames,
  Frame,
  Panel,
  panelRoot as root,
  prepareCapture,
  resizeFrame,
  settleDrawer,
  stubFrames,
  stubSheet,
} from '../../../test/dock-panel-fixtures.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage, type UiStorage } from '../../core/storage.js';
import { requireDefined } from '../../utils/require-defined.js';
import { DockPanel, DockPanelPane, type DockPanelProps } from './dock-panel.js';

beforeEach(() => {
  stubFrames();
  Element.prototype.scrollTo = () => {};
});

afterEach(() => {
  vi.unstubAllGlobals();
  // @ts-expect-error -- jsdom has no scrollTo; React Aria's sheet calls it.
  delete Element.prototype.scrollTo;
});

/** Presses the separator at `x`, moves through `moves` (a frame after each) and releases. */
async function drag(separator: HTMLElement, x: number, moves: readonly number[], release = true) {
  const user = userEvent.setup();
  prepareCapture(separator);
  await user.pointer({ keys: '[MouseLeft>]', target: separator, coords: { clientX: x } });
  for (const clientX of moves) {
    await user.pointer({ target: separator, coords: { clientX } });
    flushFrames();
  }
  const last = moves.at(-1) ?? x;
  if (release) {
    await user.pointer({ keys: '[/MouseLeft]', target: separator, coords: { clientX: last } });
  }
  return user;
}

describe('DockPanel size', () => {
  it('UIC-DOCK-PANEL-3.1 sizes the expanded panel inline within its bounds', () => {
    const { container, rerender } = render(<Panel />);
    expect(root(container).style.width).toBe('320px');
    rerender(<Panel key="b" position="bottom" defaultSize={180} minSize={120} />);
    expect(root(container).style.height).toBe('180px');
    expect(root(container).style.width).toBe('');
    rerender(<Panel key="c" size={900} />);
    expect(root(container).style.width).toBe('640px');
    rerender(<Panel key="d" size={50} />);
    expect(root(container).style.width).toBe('200px');
    rerender(<Panel key="e" size={300} isExpanded={false} />);
    expect(root(container).style.width).toBe('');
  });

  it('UIC-DOCK-PANEL-3.1 leaves minMainSize of the parent to the main content', () => {
    const { container } = render(
      <Frame>
        <Panel defaultSize={500} minMainSize={600} />
      </Frame>,
    );
    resizeFrame(900, 500);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuemax', '300');
    expect(root(container).style.width).toBe('300px');
    resizeFrame(700, 500);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuemax', '200');
  });

  it('UIC-DOCK-PANEL-3.2 resizes from the inner edge by keyboard, from every edge', async () => {
    const onSizeChange = vi.fn();
    const { container, rerender } = render(<Panel onSizeChange={onSizeChange} />);
    const separator = screen.getByRole('separator', { name: 'Resize Details' });
    expect(separator).toHaveClass('ui-dock-panel__handle', 'ui-resize-handle');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('tabindex', '0');
    expect(separator).toHaveAttribute(
      'aria-controls',
      requireDefined(container.querySelector('.ui-dock-panel__body')).id,
    );
    act(() => separator.focus());
    await userEvent.keyboard('{ArrowLeft}');
    expect(separator).toHaveAttribute('aria-valuenow', '330');
    expect(onSizeChange).toHaveBeenLastCalledWith(330);
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(separator).toHaveAttribute('aria-valuenow', '328');
    await userEvent.keyboard('{Home}');
    expect(root(container).style.width).toBe('200px');
    await userEvent.keyboard('{End}');
    expect(root(container).style.width).toBe('640px');
    rerender(<Panel key="start" position="start" />);
    act(() => screen.getByRole('separator').focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '330');
    rerender(<Panel key="bottom" position="bottom" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
    act(() => screen.getByRole('separator').focus());
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '330');
  });

  it('UIC-DOCK-PANEL-3.2 keeps a collapsed separator draggable but out of the tab order', () => {
    render(<Panel defaultExpanded={false} />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('tabindex', '-1');
    expect(separator).not.toHaveAttribute('aria-disabled');
  });

  it('UIC-DOCK-PANEL-3.4 previews a drag once per frame and ends it once with the final size', async () => {
    const onSizeChange = vi.fn();
    const onSizeChangeEnd = vi.fn();
    const { container } = render(<Panel {...{ onSizeChange, onSizeChangeEnd }} />);
    const separator = screen.getByRole('separator');
    const user = userEvent.setup();
    prepareCapture(separator);
    await user.pointer({ keys: '[MouseLeft>]', target: separator, coords: { clientX: 500 } });
    expect(root(container)).toHaveAttribute('data-resizing', 'true');
    await user.pointer({ target: separator, coords: { clientX: 480 } });
    await user.pointer({ target: separator, coords: { clientX: 450 } });
    expect(onSizeChange).not.toHaveBeenCalled();
    flushFrames();
    expect(onSizeChange.mock.calls).toEqual([[370]]);
    expect(root(container).style.width).toBe('370px');
    await user.pointer({ target: separator, coords: { clientX: 445 } });
    await user.pointer({ keys: '[/MouseLeft]', target: separator, coords: { clientX: 440 } });
    expect(onSizeChange.mock.calls).toEqual([[370], [380]]);
    expect(onSizeChangeEnd.mock.calls).toEqual([[380]]);
    expect(root(container)).not.toHaveAttribute('data-resizing');
    expect(root(container).style.width).toBe('380px');
    flushFrames();
    expect(onSizeChange).toHaveBeenCalledTimes(2);
  });
});

describe('DockPanel drag to expand', () => {
  it('UIC-DOCK-PANEL-3.3 expands at the remembered size on the first move and keeps resizing', async () => {
    const onExpandedChange = vi.fn();
    const onSizeChangeEnd = vi.fn();
    const { container } = render(
      <Panel
        defaultExpanded={false}
        defaultSize={260}
        {...{ onExpandedChange, onSizeChangeEnd }}
      />,
    );
    const separator = screen.getByRole('separator');
    const user = await drag(separator, 500, [495], false);
    expect(onExpandedChange.mock.calls).toEqual([[true]]);
    expect(root(container)).toHaveAttribute('data-expanded', 'true');
    expect(root(container).style.width).toBe('265px');
    // The same element keeps the captured gesture as the panel expands.
    expect(screen.getByRole('separator')).toBe(separator);
    await user.pointer({ target: separator, coords: { clientX: 440 } });
    flushFrames();
    expect(root(container).style.width).toBe('320px');
    await user.pointer({ keys: '[/MouseLeft]', target: separator, coords: { clientX: 440 } });
    expect(onExpandedChange).toHaveBeenCalledOnce();
    expect(onSizeChangeEnd.mock.calls).toEqual([[320]]);
    expect(separator).toHaveAttribute('tabindex', '0');
  });

  it('UIC-DOCK-PANEL-3.3 leaves the panel collapsed after a press without a move', async () => {
    const onExpandedChange = vi.fn();
    const onSizeChangeEnd = vi.fn();
    const { container } = render(
      <Panel defaultExpanded={false} {...{ onExpandedChange, onSizeChangeEnd }} />,
    );
    await drag(screen.getByRole('separator'), 500, []);
    expect(root(container)).not.toHaveAttribute('data-expanded');
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(onSizeChangeEnd).not.toHaveBeenCalled();
  });

  it('UIC-DOCK-PANEL-3.3 expands a start panel dragged toward the end and a bottom panel upward', async () => {
    const { container, rerender } = render(<Panel position="start" defaultExpanded={false} />);
    await drag(screen.getByRole('separator'), 100, [130]);
    expect(root(container).style.width).toBe('350px');
    rerender(<Panel key="bottom" position="bottom" defaultExpanded={false} />);
    const separator = screen.getByRole('separator');
    act(() => separator.focus());
    await userEvent.keyboard('{ArrowUp}');
    expect(root(container)).toHaveAttribute('data-expanded', 'true');
    expect(root(container).style.height).toBe('330px');
  });
});

describe('DockPanel abandoned resize', () => {
  it('UIC-DOCK-PANEL-3.4 cancels a drag that expanded the panel, collapsing it again', async () => {
    const onExpandedChange = vi.fn();
    const onSizeChangeCancel = vi.fn();
    const onSizeChangeEnd = vi.fn();
    const { container } = render(
      <Panel
        defaultExpanded={false}
        {...{ onExpandedChange, onSizeChangeCancel, onSizeChangeEnd }}
      />,
    );
    const separator = screen.getByRole('separator');
    await drag(separator, 500, [470], false);
    expect(root(container)).toHaveAttribute('data-expanded', 'true');
    fireEvent.pointerCancel(separator, { pointerId: 1 });
    expect(onSizeChangeCancel).toHaveBeenCalledOnce();
    expect(onExpandedChange.mock.calls).toEqual([[true], [false]]);
    expect(root(container)).not.toHaveAttribute('data-expanded');
    expect(root(container)).not.toHaveAttribute('data-resizing');
    expect(onSizeChangeEnd).not.toHaveBeenCalled();
  });

  it('UIC-DOCK-PANEL-3.4 drops a drag when the panel collapses mid-drag', async () => {
    const onSizeChangeCancel = vi.fn();
    const { container, rerender } = render(
      <Panel isExpanded onSizeChangeCancel={onSizeChangeCancel} />,
    );
    const separator = screen.getByRole('separator');
    const user = await drag(separator, 500, [545], false);
    expect(root(container).style.width).toBe('275px');
    rerender(<Panel isExpanded={false} onSizeChangeCancel={onSizeChangeCancel} />);
    expect(onSizeChangeCancel).toHaveBeenCalledOnce();
    await user.pointer({ keys: '[/MouseLeft]', target: separator, coords: { clientX: 545 } });
    rerender(<Panel isExpanded onSizeChangeCancel={onSizeChangeCancel} />);
    expect(root(container)).not.toHaveAttribute('data-resizing');
    expect(root(container).style.width).toBe('320px');
  });

  it('UIC-DOCK-PANEL-3.4 drops a drag when the panel moves to another edge', async () => {
    const { container, rerender } = render(<Panel />);
    const separator = screen.getByRole('separator');
    const user = await drag(separator, 500, [545], false);
    rerender(<Panel position="bottom" />);
    expect(root(container)).not.toHaveAttribute('data-resizing');
    expect(root(container).style.height).toBe('320px');
    await user.pointer({ keys: '[/MouseLeft]', target: separator, coords: { clientY: 200 } });
    expect(root(container).style.height).toBe('320px');
  });
});

describe('DockPanel persistence', () => {
  function persisted(storage: UiStorage, props: Partial<DockPanelProps> = {}) {
    return (
      <UiProvider storage={storage}>
        <Panel persistKey="side" {...props} />
      </UiProvider>
    );
  }

  it('UIC-DOCK-PANEL-3.5 saves and restores the selection, expanded state and size', async () => {
    const storage = createMemoryStorage();
    const { unmount } = render(persisted(storage));
    await userEvent.click(screen.getByRole('tab', { name: /People/ }));
    const separator = screen.getByRole('separator');
    const user = await drag(separator, 500, [480, 460], false);
    expect(storage.getItem('side:selected')).toBe('"people"');
    expect(storage.getItem('side:size')).toBeNull();
    await user.pointer({ keys: '[/MouseLeft]', target: separator, coords: { clientX: 460 } });
    expect(storage.getItem('side:size')).toBe('360');
    await user.click(screen.getByRole('button', { name: 'Collapse Details' }));
    expect(storage.getItem('side:expanded')).toBe('false');
    unmount();
    const { container } = render(persisted(storage));
    expect(root(container)).not.toHaveAttribute('data-expanded');
    await userEvent.click(screen.getByRole('button', { name: 'Expand Details' }));
    expect(screen.getByRole('tabpanel', { name: /People/ })).toBeVisible();
    expect(root(container).style.width).toBe('360px');
  });

  it('UIC-DOCK-PANEL-3.5 falls back to the defaults for unreadable values and unavailable panes', () => {
    const unreadable = { 'side:selected': '{', 'side:expanded': '{', 'side:size': '{' };
    const { container, unmount } = render(persisted(createMemoryStorage(unreadable)));
    expect(screen.getByRole('tabpanel', { name: 'Files' })).toBeVisible();
    expect(root(container).style.width).toBe('320px');
    unmount();
    const stored = { 'side:selected': '"locked"', 'side:expanded': '"yes"', 'side:size': '"wide"' };
    const { container: next } = render(persisted(createMemoryStorage(stored)));
    expect(screen.getByRole('tabpanel', { name: 'Files' })).toBeVisible();
    expect(root(next).style.width).toBe('320px');
  });

  it('UIC-DOCK-PANEL-3.5 leaves controlled values to the caller', async () => {
    const storage = createMemoryStorage();
    render(persisted(storage, { selectedKey: 'files', size: 300 }));
    await userEvent.click(screen.getByRole('tab', { name: /People/ }));
    act(() => screen.getByRole('separator').focus());
    await userEvent.keyboard('{ArrowLeft}');
    expect(storage.getItem('side:selected')).toBeNull();
    expect(storage.getItem('side:size')).toBeNull();
  });
});

describe('DockPanel overlay', () => {
  it('UIC-DOCK-PANEL-4.1 opens the selected pane in a drawer below the width', async () => {
    stubSheet();
    const onExpandedChange = vi.fn();
    const { container } = render(
      <Frame>
        <Panel overlayBelow={600} onExpandedChange={onExpandedChange} />
      </Frame>,
    );
    resizeFrame(500, 400);
    const panel = root(container);
    expect(panel).toHaveAttribute('data-overlay', 'true');
    expect(panel).not.toHaveAttribute('data-expanded');
    expect(panel.style.width).toBe('');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    const people = screen.getByRole('button', { name: 'People' });
    expect(people).toHaveAttribute('aria-haspopup', 'dialog');
    expect(people).not.toHaveAttribute('aria-controls');

    await userEvent.click(people);
    await settleDrawer();
    const dialog = screen.getByRole('dialog', { name: 'People' });
    expect(document.querySelector('.ui-dock-panel__drawer')).toHaveClass('ui-drawer');
    expect(within(dialog).getByText('Maria Santos')).toBeInTheDocument();
    expect(people).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(container.querySelectorAll('.ui-dock-panel__pane')).toHaveLength(0);
    expect(dialog.querySelectorAll('.ui-dock-panel__pane')).toHaveLength(3);
    expectHooksMatchSpec(document.body, 'DOCK-PANEL', {
      slots: ['drawer', 'drawer-body', 'panes'],
    });
    await userEvent.click(people);
    await settleDrawer();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-DOCK-PANEL-2.3 UIC-DOCK-PANEL-4.1 keeps every pane mounted across the drawer and the width', async () => {
    stubSheet();
    const mounts = vi.fn();
    function Draft({ label }: { label: string }) {
      const [value, setValue] = useState('');
      useEffect(() => mounts(label), [label]);
      return (
        <input
          aria-label={label}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      );
    }
    render(
      <Frame>
        <DockPanel label="Details" overlayBelow={600}>
          <DockPanelPane id="notes" label="Notes" icon={EditGlyph}>
            <Draft label="Note draft" />
          </DockPanelPane>
          <DockPanelPane id="files" label="Files" icon={FolderGlyph}>
            <Draft label="File draft" />
          </DockPanelPane>
        </DockPanel>
      </Frame>,
    );
    resizeFrame(800, 400);
    await userEvent.type(screen.getByRole('textbox', { name: 'Note draft' }), 'Unsaved note');
    for (const _crossing of [1, 2]) {
      resizeFrame(500, 400);
      await userEvent.click(screen.getByRole('button', { name: 'Notes' }));
      await settleDrawer();
      const dialog = screen.getByRole('dialog', { name: 'Notes' });
      expect(within(dialog).getByRole('textbox', { name: 'Note draft' })).toHaveValue(
        'Unsaved note',
      );
      await userEvent.keyboard('{Escape}');
      await settleDrawer();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      resizeFrame(800, 400);
    }
    expect(screen.getByRole('textbox', { name: 'Note draft' })).toHaveValue('Unsaved note');
    expect(mounts).toHaveBeenCalledTimes(2);
  });
});
