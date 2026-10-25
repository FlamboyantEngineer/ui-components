import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage, type UiStorage } from '../../core/storage.js';
import { Section } from '../section-header/section-header.js';
import { DockPanel, DockPanelPane, type DockPanelProps } from './dock-panel.js';

const add = vi.fn();

function Panel(props: Partial<DockPanelProps>) {
  return (
    <DockPanel label="Details" {...props}>
      <DockPanelPane
        id="files"
        label="Files"
        icon="folder"
        title="Recent files"
        actions={[{ verb: 'add', onPress: add }]}
      >
        <input aria-label="File filter" />
      </DockPanelPane>
      <DockPanelPane id="people" label="People" icon="users" count={3}>
        <p>Maria Santos</p>
      </DockPanelPane>
      <DockPanelPane id="locked" label="Locked" icon="lock" isDisabled>
        <p>Hidden</p>
      </DockPanelPane>
      {null}
      <p>Not a pane</p>
    </DockPanel>
  );
}

/** A frame whose client size the fake observer reports. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div role="region" aria-label="Frame">
      {children}
    </div>
  );
}

class FakeResizeObserver {
  static observers: FakeResizeObserver[] = [];
  readonly elements = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.observers.push(this);
  }
  observe(element: Element) {
    this.elements.add(element);
  }
  unobserve(element: Element) {
    this.elements.delete(element);
  }
  disconnect() {
    this.elements.clear();
  }
}

/** Gives the frame a client size and reports it to every observer watching it. */
function resizeFrame(width: number, height: number) {
  // An open drawer hides the frame from the accessibility tree, so look past that.
  const frame = screen.getByRole('region', { name: 'Frame', hidden: true });
  Object.defineProperties(frame, {
    clientWidth: { configurable: true, value: width },
    clientHeight: { configurable: true, value: height },
  });
  const entry = {
    target: frame,
    contentRect: { width, height },
    borderBoxSize: [{ inlineSize: width, blockSize: height }],
  } as unknown as ResizeObserverEntry;
  act(() => {
    for (const observer of FakeResizeObserver.observers) {
      if (observer.elements.has(frame))
        observer.callback([entry], observer as unknown as ResizeObserver);
    }
    for (const callback of frames.splice(0)) callback(0);
  });
}

const frames: FrameRequestCallback[] = [];

/** Observes sizes through the fake observer; `resizeFrame` runs the frames it queues. */
function stubObserver() {
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', () => {});
}

/** Stubs what React Aria's sheet needs in jsdom, and ends its slide. */
function stubSheet() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
}

async function settleDrawer() {
  await act(async () => {
    for (const scroller of document.querySelectorAll('[data-sheet-scroll]')) {
      scroller.dispatchEvent(new Event('scrollend'));
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
}

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-dock-panel')!;
}

/** A pane by its label, shown or hidden. */
function pane(name: string) {
  const element = document.querySelector<HTMLElement>(`.ui-dock-panel__pane[aria-label="${name}"]`);
  if (!element) throw new Error(`No pane named ${name}`);
  return element;
}

function prepareCapture(handle: HTMLElement) {
  const capture = { id: null as number | null };
  Object.assign(handle, {
    setPointerCapture: (id: number) => {
      capture.id = id;
    },
    hasPointerCapture: (id: number) => capture.id === id,
    releasePointerCapture: () => {
      capture.id = null;
    },
  });
}

beforeEach(() => {
  add.mockClear();
  FakeResizeObserver.observers = [];
  frames.length = 0;
  Element.prototype.scrollTo = () => {};
});

afterEach(() => {
  vi.unstubAllGlobals();
  // @ts-expect-error -- jsdom has no scrollTo; React Aria's sheet calls it.
  delete Element.prototype.scrollTo;
});

describe('DockPanel structure', () => {
  it('UIC-DOCK-PANEL-1.1 UIC-DOCK-PANEL-1.4 renders a named region with launchers, a separator and the panes', () => {
    const { container } = render(<Panel className="inspector" id="details" data-area="side" />);
    const panel = screen.getByRole('region', { name: 'Details' });
    expect(panel.tagName).toBe('SECTION');
    expect(panel).toHaveAttribute('id', 'details');
    expect(panel).toHaveClass('ui-dock-panel', 'inspector');
    expect(panel).toHaveAttribute('data-area', 'side');
    expect(panel).toHaveAttribute('data-position', 'end');
    expect(within(panel).getByRole('toolbar')).toBeInTheDocument();
    expect(within(panel).getByRole('separator')).toBeInTheDocument();
    expect(container.querySelectorAll('.ui-dock-panel__pane')).toHaveLength(3);
    expect(screen.queryByText('Not a pane')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'DOCK-PANEL', {
      slots: [
        'launchers',
        'launcher',
        'count',
        'toggle',
        'handle',
        'body',
        'pane',
        'header',
        'title',
        'content',
      ],
      callerAttributes: ['data-area'],
    });
  });

  it('UIC-DOCK-PANEL-1.1 publishes each position', () => {
    const { container, rerender } = render(<Panel position="start" />);
    expect(root(container)).toHaveAttribute('data-position', 'start');
    rerender(<Panel position="bottom" />);
    expect(root(container)).toHaveAttribute('data-position', 'bottom');
  });

  it('UIC-DOCK-PANEL-1.2 draws a launcher toolbar with labels, counts and pane links', () => {
    render(<Panel />);
    const toolbar = screen.getByRole('toolbar', { name: 'Details panes' });
    expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
    expect(toolbar).toHaveAttribute('data-orientation', 'vertical');
    const files = within(toolbar).getByRole('button', { name: 'Files' });
    expect(files).toHaveAttribute('aria-expanded', 'true');
    expect(files).toHaveAttribute('aria-controls', pane('Files').id);
    expect(files.querySelector('[data-glyph="folder"]')).not.toBeNull();
    const people = within(toolbar).getByRole('button', { name: 'People' });
    expect(people).toHaveAttribute('aria-expanded', 'false');
    expect(people).toHaveAccessibleDescription('3 items');
    const count = toolbar.querySelector('.ui-dock-panel__count')!;
    expect(count).toHaveClass('ui-badge');
    expect(count).toHaveTextContent('3');
    expect(count).toHaveAttribute('aria-hidden', 'true');
    expect(within(toolbar).getByRole('button', { name: 'Locked' })).toBeDisabled();
  });

  it('UIC-DOCK-PANEL-1.2 caps counts, hides empty ones and lays a bottom toolbar out in a row', () => {
    const { container } = render(
      <DockPanel label="Output" position="bottom">
        <DockPanelPane id="log" label="Log" icon="info" count={120}>
          Log
        </DockPanelPane>
        <DockPanelPane id="warnings" label="Warnings" icon="warning" count={0}>
          None
        </DockPanelPane>
      </DockPanel>,
    );
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-orientation', 'horizontal');
    const counts = container.querySelectorAll('.ui-dock-panel__count');
    expect(counts).toHaveLength(1);
    expect(counts[0]).toHaveTextContent('99+');
    expect(screen.getByRole('button', { name: 'Log' })).toHaveAccessibleDescription('120 items');
  });

  it('UIC-DOCK-PANEL-1.3 draws a pane header with its title and actions', async () => {
    render(<Panel />);
    const files = pane('Files');
    expect(files.tagName).toBe('SECTION');
    expect(files).toHaveClass('ui-dock-panel__pane');
    const header = files.querySelector('.ui-dock-panel__header')!;
    expect(header).toHaveClass('ui-action-row');
    expect(within(files).getByRole('heading', { level: 3, name: 'Recent files' })).toHaveClass(
      'ui-dock-panel__title',
    );
    await userEvent.click(within(files).getByRole('button', { name: 'Add' }));
    expect(add).toHaveBeenCalledTimes(1);
    expect(pane('People').querySelector('.ui-dock-panel__header')).toBeNull();
    expect(pane('People').querySelector('.ui-dock-panel__content')).toHaveTextContent(
      'Maria Santos',
    );
    expect(pane('People').querySelector('.ui-dock-panel__content')).toHaveAttribute(
      'tabindex',
      '0',
    );
  });

  it('UIC-DOCK-PANEL-1.3 UIC-DOCK-PANEL-1.4 takes the heading level and caller hooks, and renders alone', () => {
    const { container } = render(
      <>
        <Section title="Workspace" headingLevel={2}>
          <DockPanel label="Nested">
            <DockPanelPane
              id="a"
              label="Notes"
              icon="edit"
              title="Notes"
              className="notes"
              data-kind="text"
            >
              Text
            </DockPanelPane>
          </DockPanel>
        </Section>
        <DockPanelPane id="alone" label="Alone" icon="info">
          Standalone
        </DockPanelPane>
      </>,
    );
    expect(screen.getByRole('heading', { name: 'Notes' }).tagName).toBe('H3');
    const notes = pane('Notes');
    expect(notes).toHaveClass('ui-dock-panel__pane', 'notes');
    expect(notes).toHaveAttribute('data-kind', 'text');
    const alone = screen.getByRole('region', { name: 'Alone' });
    expect(alone).toBeVisible();
    expect(alone).not.toHaveAttribute('tabindex');
    expectHooksMatchSpec(container, 'DOCK-PANEL', { callerAttributes: ['data-kind'] });
  });
});

describe('DockPanel panes', () => {
  it('UIC-DOCK-PANEL-2.1 selects the first enabled pane, a default or a controlled key', async () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(<Panel defaultSelectedKey="locked" />);
    expect(pane('Files')).toBeVisible();
    rerender(<Panel key="b" defaultSelectedKey="people" />);
    expect(pane('People')).toBeVisible();
    rerender(<Panel key="c" selectedKey="files" onSelectionChange={onSelectionChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'People' }));
    expect(onSelectionChange).toHaveBeenCalledWith('people');
    expect(pane('Files')).toBeVisible();
    expect(pane('People')).not.toBeVisible();
  });

  it('UIC-DOCK-PANEL-2.1 keeps the selection while collapsed', () => {
    render(<Panel defaultSelectedKey="people" defaultExpanded={false} />);
    const launcher = screen
      .getByRole('button', { name: 'People' })
      .closest('.ui-dock-panel__launcher');
    expect(launcher).toHaveAttribute('data-selected', 'true');
    expect(screen.getByRole('button', { name: 'People' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('UIC-DOCK-PANEL-2.2 opens a pane from its launcher and collapses from the open one', async () => {
    const onExpandedChange = vi.fn();
    const { container } = render(
      <Panel defaultExpanded={false} onExpandedChange={onExpandedChange} />,
    );
    const panel = root(container);
    const body = container.querySelector('.ui-dock-panel__body')!;
    expect(panel).not.toHaveAttribute('data-expanded');
    expect(body).not.toBeVisible();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(panel.style.width).toBe('');
    await userEvent.click(screen.getByRole('button', { name: 'People' }));
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(panel).toHaveAttribute('data-expanded', 'true');
    expect(pane('People')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'People' }));
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(body).not.toBeVisible();
  });

  it('UIC-DOCK-PANEL-2.2 flips the panel with the toggle, which points toward its edge', async () => {
    const { container } = render(<Panel />);
    const body = container.querySelector('.ui-dock-panel__body')!;
    const toggle = screen.getByRole('button', { name: 'Collapse Details' });
    expect(toggle).toHaveClass('ui-dock-panel__toggle', 'ui-button');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-controls', body.id);
    expect(toggle.querySelector('[data-glyph="chevron-double-right"]')).not.toBeNull();
    await userEvent.click(toggle);
    const expand = screen.getByRole('button', { name: 'Expand Details' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    expect(expand.querySelector('[data-glyph="chevron-double-left"]')).not.toBeNull();
    expect(body).not.toBeVisible();
  });

  it('UIC-DOCK-PANEL-2.2 picks the toggle glyph by position and reading direction', () => {
    const glyph = () =>
      screen
        .getByRole('button', { name: /Details$/ })
        .querySelector('svg')
        ?.getAttribute('data-glyph');
    const { rerender } = render(<Panel position="start" />);
    expect(glyph()).toBe('chevron-double-left');
    rerender(<Panel position="bottom" />);
    expect(glyph()).toBe('chevron-down');
    rerender(<Panel key="collapsed" position="bottom" defaultExpanded={false} />);
    expect(glyph()).toBe('chevron-up');
    rerender(
      <UiProvider locale="he-IL">
        <Panel position="end" />
      </UiProvider>,
    );
    expect(glyph()).toBe('chevron-double-left');
  });

  it('UIC-DOCK-PANEL-2.2 refuses the toggle without an enabled pane', () => {
    render(
      <DockPanel label="Empty">
        <DockPanelPane id="a" label="Off" icon="info" isDisabled>
          Off
        </DockPanelPane>
      </DockPanel>,
    );
    expect(screen.getByRole('button', { name: 'Collapse Empty' })).toBeDisabled();
  });

  it('UIC-DOCK-PANEL-2.3 keeps hidden panes mounted, hidden and inert', async () => {
    render(<Panel />);
    const filter = screen.getByRole('textbox', { name: 'File filter' });
    await userEvent.type(filter, 'report');
    await userEvent.click(screen.getByRole('button', { name: 'People' }));
    expect(pane('Files')).toHaveAttribute('hidden');
    expect(pane('Files')).toHaveAttribute('inert');
    expect(pane('People')).not.toHaveAttribute('inert');
    await userEvent.click(screen.getByRole('button', { name: 'Files' }));
    expect(screen.getByRole('textbox', { name: 'File filter' })).toHaveValue('report');
  });

  it('UIC-DOCK-PANEL-2.4 moves between launchers with the arrow keys and focus into an opened pane', async () => {
    render(<Panel defaultExpanded={false} />);
    const files = screen.getByRole('button', { name: 'Files' });
    act(() => files.focus());
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'People' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(pane('People')).toHaveFocus();
    expect(pane('People')).toHaveAttribute('tabindex', '-1');
    act(() => screen.getByRole('button', { name: 'People' }).focus());
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'People' })).toHaveFocus();
  });

  it('UIC-DOCK-PANEL-2.4 returns focus to the launcher when the pane holding it closes', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [isExpanded, setExpanded] = useState(true);
      // A caller shortcut closes the panel while focus stays inside it.
      return (
        <div onKeyDown={(event) => event.key === 'F4' && setExpanded(false)}>
          <Panel isExpanded={isExpanded} onExpandedChange={setExpanded} />
        </div>
      );
    }
    render(<Controlled />);
    const filter = screen.getByRole('textbox', { name: 'File filter' });
    act(() => filter.focus());
    await user.keyboard('{F4}');
    expect(screen.getByRole('button', { name: 'Files' })).toHaveFocus();
  });
});

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
  });

  it('UIC-DOCK-PANEL-3.1 leaves minMainSize of the parent to the main content', () => {
    stubObserver();
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

  it('UIC-DOCK-PANEL-3.2 resizes from the inner edge by keyboard', async () => {
    const onSizeChange = vi.fn();
    const { container } = render(<Panel onSizeChange={onSizeChange} />);
    const separator = screen.getByRole('separator', { name: 'Resize Details' });
    expect(separator).toHaveClass('ui-dock-panel__handle', 'ui-resize-handle');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute(
      'aria-controls',
      container.querySelector('.ui-dock-panel__body')!.id,
    );
    expect(separator).toHaveAttribute('aria-valuenow', '320');
    expect(separator).toHaveAttribute('aria-valuemin', '200');
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
  });

  it('UIC-DOCK-PANEL-3.2 grows a start panel toward the end and a bottom panel upward', async () => {
    const { rerender } = render(<Panel position="start" />);
    act(() => screen.getByRole('separator').focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '330');
    rerender(<Panel key="bottom" position="bottom" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    act(() => separator.focus());
    await userEvent.keyboard('{ArrowUp}');
    expect(separator).toHaveAttribute('aria-valuenow', '330');
  });

  it('UIC-DOCK-PANEL-3.2 follows a pointer drag and publishes the resizing state', async () => {
    const user = userEvent.setup();
    const { container } = render(<Panel />);
    const separator = screen.getByRole('separator');
    prepareCapture(separator);
    await user.pointer({ keys: '[MouseLeft>]', target: separator, coords: { clientX: 500 } });
    expect(root(container)).toHaveAttribute('data-resizing', 'true');
    await user.pointer({ target: separator, coords: { clientX: 450 } });
    expect(root(container).style.width).toBe('370px');
    await user.pointer({ keys: '[/MouseLeft]', target: separator, coords: { clientX: 440 } });
    expect(root(container)).not.toHaveAttribute('data-resizing');
    expect(root(container).style.width).toBe('380px');
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

  it('UIC-DOCK-PANEL-3.3 saves and restores the selection, expanded state and size', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const { unmount } = render(persisted(storage));
    await user.click(screen.getByRole('button', { name: 'People' }));
    const separator = screen.getByRole('separator');
    prepareCapture(separator);
    await user.pointer([
      { keys: '[MouseLeft>]', target: separator, coords: { clientX: 500 } },
      { coords: { clientX: 460 } },
    ]);
    expect(JSON.parse(storage.getItem('side')!)).toEqual({ selectedKey: 'people' });
    await user.pointer({ keys: '[/MouseLeft]', target: separator, coords: { clientX: 460 } });
    expect(JSON.parse(storage.getItem('side')!)).toEqual({ selectedKey: 'people', size: 360 });
    await user.click(screen.getByRole('button', { name: 'Collapse Details' }));
    unmount();
    const { container } = render(persisted(storage));
    expect(root(container)).not.toHaveAttribute('data-expanded');
    await user.click(screen.getByRole('button', { name: 'Expand Details' }));
    expect(pane('People')).toBeVisible();
    expect(root(container).style.width).toBe('360px');
  });

  it('UIC-DOCK-PANEL-3.3 falls back to the defaults for unreadable values and unavailable panes', () => {
    const { container, unmount } = render(persisted(createMemoryStorage({ side: 'not json' })));
    expect(pane('Files')).toBeVisible();
    expect(root(container).style.width).toBe('320px');
    unmount();
    const stored = JSON.stringify({ selectedKey: 'locked', isExpanded: 'yes', size: 'wide' });
    const { container: nextContainer } = render(persisted(createMemoryStorage({ side: stored })));
    expect(pane('Files')).toBeVisible();
    expect(root(nextContainer).style.width).toBe('320px');
  });

  it('UIC-DOCK-PANEL-3.3 leaves controlled values to the caller', async () => {
    const storage = createMemoryStorage();
    render(persisted(storage, { selectedKey: 'files', size: 300 }));
    await userEvent.click(screen.getByRole('button', { name: 'People' }));
    act(() => screen.getByRole('separator').focus());
    await userEvent.keyboard('{ArrowLeft}');
    expect(storage.getItem('side')).toBeNull();
  });
});

describe('DockPanel overlay', () => {
  it('UIC-DOCK-PANEL-4.1 opens the selected pane in a drawer below the width', async () => {
    stubObserver();
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
    expect(container.querySelector('.ui-dock-panel__body')).toBeNull();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const people = screen.getByRole('button', { name: 'People' });
    expect(people).toHaveAttribute('aria-haspopup', 'dialog');
    expect(people).not.toHaveAttribute('aria-controls');

    await userEvent.click(people);
    await settleDrawer();
    const dialog = screen.getByRole('dialog', { name: 'People' });
    expect(document.querySelector('.ui-dock-panel__drawer')).toHaveClass('ui-drawer');
    expect(document.querySelector('.ui-dock-panel__drawer')).toHaveAttribute(
      'data-position',
      'right',
    );
    expect(within(dialog).getByText('Maria Santos')).toBeInTheDocument();
    expect(within(dialog).queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    expect(people).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(container.querySelectorAll('.ui-dock-panel__pane')).toHaveLength(0);
  });

  it('UIC-DOCK-PANEL-4.1 titles the drawer by the pane title, opens from the toggle and closes when docked', async () => {
    stubObserver();
    stubSheet();
    render(
      <Frame>
        <Panel overlayBelow={600} position="bottom" />
      </Frame>,
    );
    resizeFrame(500, 400);
    await userEvent.click(screen.getByRole('button', { name: 'Expand Details' }));
    await settleDrawer();
    expect(screen.getByRole('dialog', { name: 'Recent files' })).toBeInTheDocument();
    expect(document.querySelector('.ui-dock-panel__drawer')).toHaveAttribute(
      'data-position',
      'bottom',
    );
    resizeFrame(900, 400);
    expect(root(document.body)).not.toHaveAttribute('data-overlay');
    expect(pane('Files')).toBeVisible();
  });
});
