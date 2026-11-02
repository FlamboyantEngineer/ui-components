import { EditGlyph, FolderGlyph, InfoGlyph, WarningGlyph } from '../../core/glyphs.js';
import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { useEffect, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { addFile, Panel, panelRoot as root } from '../../../test/dock-panel-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import { DockPanel, DockPanelPane } from './dock-panel.js';

beforeEach(() => {
  addFile.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DockPanel structure', () => {
  it('UIC-DOCK-PANEL-1.1 UIC-DOCK-PANEL-1.5 renders a named region with tabs, a separator and the panes', () => {
    const { container } = render(<Panel className="inspector" id="details" data-area="side" />);
    const panel = screen.getByRole('region', { name: 'Details' });
    expect(panel.tagName).toBe('SECTION');
    expect(panel).toHaveAttribute('id', 'details');
    expect(panel).toHaveClass('ui-dock-panel', 'inspector');
    expect(panel).toHaveAttribute('data-area', 'side');
    expect(panel).toHaveAttribute('data-position', 'end');
    expect(within(panel).getByRole('tablist', { name: 'Details' })).toBeInTheDocument();
    expect(within(panel).getByRole('separator')).toBeInTheDocument();
    expect(container.querySelectorAll('.ui-dock-panel__pane')).toHaveLength(3);
    expect(screen.queryByText('Not a pane')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'DOCK-PANEL', {
      slots: [
        'tabs',
        'header',
        'strip',
        'tab-list',
        'tab',
        'fade',
        'toggle',
        'handle',
        'body',
        'panes',
        'pane',
        'actions',
        'content',
        'footer',
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

  it('UIC-DOCK-PANEL-1.2 draws a tab per pane with its icon, label and capped count', () => {
    render(
      <DockPanel label="Output" position="bottom">
        <DockPanelPane id="log" label="Log" icon={InfoGlyph} count={120}>
          Log lines
        </DockPanelPane>
        <DockPanelPane id="warnings" label="Warnings" icon={WarningGlyph} count={9}>
          None
        </DockPanelPane>
      </DockPanel>,
    );
    const log = screen.getByRole('tab', { name: /Log/ });
    expect(log).toHaveClass('ui-dock-panel__tab', 'ui-tabs__tab');
    expect(log).toHaveAttribute('aria-selected', 'true');
    expect(log.querySelector('[data-glyph="info"]')).not.toBeNull();
    expect(log).toHaveTextContent('9+');
    expect(log).toHaveAccessibleDescription('120 items');
    expect(screen.getByRole('tab', { name: /Warnings/ })).toHaveTextContent('9');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Log lines');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', log.id);
    expect(log).toHaveAttribute('aria-controls', screen.getByRole('tabpanel').id);
  });

  it('UIC-DOCK-PANEL-1.3 draws the collapsed launchers with labels and full-count descriptions', () => {
    const { container } = render(<Panel defaultExpanded={false} />);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    const toolbar = screen.getByRole('toolbar', { name: 'Details panes' });
    expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
    expect(toolbar).toHaveAttribute('data-orientation', 'vertical');
    const files = within(toolbar).getByRole('button', { name: 'Files' });
    expect(files).toHaveClass('ui-dock-panel__launcher');
    expect(files).toHaveAttribute('data-selected', 'true');
    expect(files).toHaveAttribute('aria-expanded', 'false');
    expect(files.querySelector('.ui-dock-panel__launcher-label')).toHaveTextContent('Files');
    expect(files.querySelector('[data-glyph="folder"]')).not.toBeNull();
    const people = within(toolbar).getByRole('button', { name: 'People' });
    expect(people).toHaveAccessibleDescription('3 items');
    const count = requireDefined(people.querySelector('.ui-dock-panel__count'));
    expect(count).toHaveClass('ui-badge');
    expect(count).toHaveAttribute('aria-hidden', 'true');
    expect(within(toolbar).getByRole('button', { name: 'Locked' })).toBeDisabled();
    expect(within(toolbar).queryByRole('tooltip')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'DOCK-PANEL', {
      slots: ['launchers', 'launcher', 'launcher-icon', 'launcher-label', 'count'],
    });
  });

  it('UIC-DOCK-PANEL-1.3 caps launcher counts and lays a bottom rail out in a row', () => {
    render(
      <DockPanel label="Output" position="bottom" defaultExpanded={false}>
        <DockPanelPane id="log" label="Log" icon={InfoGlyph} count={120}>
          Log
        </DockPanelPane>
      </DockPanel>,
    );
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-orientation', 'horizontal');
    const log = screen.getByRole('button', { name: 'Log' });
    expect(log.querySelector('.ui-dock-panel__count')).toHaveTextContent('9+');
    expect(log).toHaveAccessibleDescription('120 items');
  });

  it('UIC-DOCK-PANEL-1.4 draws pane actions, content and footer without a title', async () => {
    const { container } = render(<Panel />);
    const files = screen.getByRole('tabpanel', { name: 'Files' });
    expect(files).toHaveClass('ui-dock-panel__pane');
    expect(within(files).queryByRole('heading')).not.toBeInTheDocument();
    expect(files.querySelector('.ui-dock-panel__actions')).toHaveClass('ui-action-row');
    await userEvent.click(within(files).getByRole('button', { name: 'Add' }));
    expect(addFile).toHaveBeenCalledTimes(1);
    expect(files.querySelector('.ui-dock-panel__content')).toHaveAttribute('tabindex', '0');
    expect(files.querySelector('.ui-dock-panel__footer')).toHaveTextContent('Three files');
    const people = requireDefined(
      [...container.querySelectorAll('.ui-dock-panel__pane')].find((pane) =>
        pane.textContent.includes('Maria Santos'),
      ),
    );
    expect(people.querySelector('.ui-dock-panel__actions')).toBeNull();
    expect(people.querySelector('.ui-dock-panel__footer')).toBeNull();
  });

  it('UIC-DOCK-PANEL-1.4 UIC-DOCK-PANEL-1.5 takes caller hooks and renders alone', () => {
    const { container } = render(
      <>
        <DockPanel label="Nested">
          <DockPanelPane id="a" label="Notes" icon={EditGlyph} className="notes" data-kind="text">
            Text
          </DockPanelPane>
        </DockPanel>
        <DockPanelPane id="alone" label="Alone" icon={InfoGlyph}>
          Standalone
        </DockPanelPane>
      </>,
    );
    const notes = screen.getByRole('tabpanel', { name: 'Notes' });
    expect(notes).toHaveClass('ui-dock-panel__pane', 'notes');
    expect(notes).toHaveAttribute('data-kind', 'text');
    expect(screen.getByText('Standalone')).toBeVisible();
    expectHooksMatchSpec(container, 'DOCK-PANEL', { callerAttributes: ['data-kind'] });
  });

  it('UIC-DOCK-PANEL-1.1 renders the panes in place on the server and hydrates without errors', async () => {
    // eslint-disable-next-line testing-library/render-result-naming-convention -- renderToString returns an HTML string, not a render result
    const markup = renderToString(<Panel />);
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = markup;
    expect(host.querySelectorAll('.ui-dock-panel__body > .ui-dock-panel__pane')).toHaveLength(3);
    const hydrateErrors: unknown[] = [];
    let app: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      app = hydrateRoot(host, <Panel />, {
        onRecoverableError: (error) => hydrateErrors.push(error),
      });
    });
    expect(hydrateErrors).toEqual([]);
    expect(host.querySelectorAll('.ui-dock-panel__panes > .ui-dock-panel__pane')).toHaveLength(3);
    act(() => app?.unmount());
    host.remove();
  });
});

describe('DockPanel panes', () => {
  it('UIC-DOCK-PANEL-2.1 selects the first enabled pane, a default or a controlled key', async () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(<Panel defaultSelectedKey="locked" />);
    expect(screen.getByRole('tabpanel', { name: 'Files' })).toBeVisible();
    rerender(<Panel key="b" defaultSelectedKey="people" />);
    expect(screen.getByRole('tabpanel', { name: /People/ })).toBeVisible();
    rerender(<Panel key="c" selectedKey="files" onSelectionChange={onSelectionChange} />);
    await userEvent.click(screen.getByRole('tab', { name: /People/ }));
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('people');
    expect(screen.getByRole('tabpanel', { name: 'Files' })).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'Files' }));
    expect(onSelectionChange).toHaveBeenCalledOnce();
  });

  it('UIC-DOCK-PANEL-2.1 keeps the selection while collapsed', async () => {
    render(<Panel defaultSelectedKey="people" />);
    await userEvent.click(screen.getByRole('button', { name: 'Collapse Details' }));
    expect(screen.getByRole('button', { name: 'People' })).toHaveAttribute('data-selected', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Expand Details' }));
    expect(screen.getByRole('tab', { name: /People/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-DOCK-PANEL-2.2 collapses and expands with the toggle, pointing toward the edge', async () => {
    const onExpandedChange = vi.fn();
    const { container } = render(<Panel onExpandedChange={onExpandedChange} />);
    const toggle = screen.getByRole('button', { name: 'Collapse Details' });
    expect(toggle).toHaveClass('ui-dock-panel__toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute(
      'aria-controls',
      requireDefined(container.querySelector('.ui-dock-panel__body')).id,
    );
    expect(toggle.querySelector('[data-glyph="chevron-double-right"]')).not.toBeNull();
    expect(root(container)).toHaveAttribute('data-expanded', 'true');
    await userEvent.click(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(root(container)).not.toHaveAttribute('data-expanded');
    expect(toggle).toHaveAccessibleName('Expand Details');
    expect(toggle).toHaveFocus();
    expect(toggle.querySelector('[data-glyph="chevron-double-left"]')).not.toBeNull();
    expect(container.querySelector('.ui-dock-panel__body')).not.toBeVisible();
  });

  it('UIC-DOCK-PANEL-2.2 expands from a launcher, which re-activates the selected pane idempotently', async () => {
    const onSelectionChange = vi.fn();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <Panel defaultExpanded={false} {...{ onSelectionChange, onExpandedChange }} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Files' }));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.getByRole('tabpanel', { name: 'Files' })).toBeVisible();
    rerender(<Panel key="b" isExpanded={false} {...{ onSelectionChange, onExpandedChange }} />);
    screen.getByRole('button', { name: 'People' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('people');
  });

  it('UIC-DOCK-PANEL-2.2 refuses the toggle and the separator without an enabled pane', () => {
    render(
      <DockPanel label="Empty">
        <DockPanelPane id="a" label="Off" icon={FolderGlyph} isDisabled>
          Off
        </DockPanelPane>
      </DockPanel>,
    );
    expect(screen.getByRole('button', { name: 'Expand Empty' })).toBeDisabled();
    expect(screen.getByRole('separator')).toHaveAttribute('aria-disabled', 'true');
  });

  it('UIC-DOCK-PANEL-2.3 keeps every pane mounted, hidden and inert through switching and collapsing', async () => {
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
      <DockPanel label="Details">
        <DockPanelPane id="notes" label="Notes" icon={EditGlyph}>
          <Draft label="Note draft" />
        </DockPanelPane>
        <DockPanelPane id="files" label="Files" icon={FolderGlyph}>
          <Draft label="File draft" />
        </DockPanelPane>
      </DockPanel>,
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Note draft' }), 'Unsaved');
    await userEvent.click(screen.getByRole('tab', { name: 'Files' }));
    const hidden = requireDefined(
      screen.getByRole('textbox', { name: 'Note draft', hidden: true }).closest('[hidden]'),
    );
    expect(hidden).toHaveAttribute('inert');
    expect(hidden).toHaveAttribute('data-inert', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Collapse Details' }));
    await userEvent.click(screen.getByRole('button', { name: 'Notes' }));
    expect(screen.getByRole('textbox', { name: 'Note draft' })).toHaveValue('Unsaved');
    expect(mounts.mock.calls).toEqual([['Note draft'], ['File draft']]);
  });
});

describe('DockPanel keyboard and focus', () => {
  it('UIC-DOCK-PANEL-2.4 selects tabs with the arrow keys, Home and End, skipping disabled ones', async () => {
    render(<Panel />);
    act(() => screen.getByRole('tab', { name: 'Files' }).focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /People/ })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: /People/ })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Collapse Details' })).toHaveFocus();
  });

  it('UIC-DOCK-PANEL-2.4 moves between launchers without activating them, then hands focus to the tab', async () => {
    const onExpandedChange = vi.fn();
    render(<Panel defaultExpanded={false} onExpandedChange={onExpandedChange} />);
    act(() => screen.getByRole('button', { name: 'Files' }).focus());
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'People' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Files' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'People' })).toHaveFocus();
    expect(onExpandedChange).not.toHaveBeenCalled();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('tab', { name: /People/ })).toHaveFocus();
  });

  it('UIC-DOCK-PANEL-2.4 returns focus to the launcher when the panel collapses from outside', () => {
    const { rerender } = render(<Panel isExpanded />);
    act(() => screen.getByRole('textbox', { name: 'File filter' }).focus());
    rerender(<Panel isExpanded={false} />);
    expect(screen.getByRole('button', { name: 'Files' })).toHaveFocus();
  });
});
