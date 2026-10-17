import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, Profiler, useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider, type UiLinkRenderer } from '../../core/provider.js';
import { List, ListRow, ListRowContent, type ListHandle } from './list-row.js';

const primaries = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('.ui-list-row__primary'),
];

const flush = () => act(async () => {});

describe('List', () => {
  it('UIC-LIST-ROW-1.1 renders a named native list whose rows keep link and button roles', () => {
    const { container } = render(
      <List aria-label="Files">
        <ListRow href="/docs/" title="Guide" />
        <ListRow onPress={() => {}} title="Notes" />
        <ListRow title="Report.pdf" />
      </List>,
    );
    const list = screen.getByRole('list', { name: 'Files' });
    expect(list.tagName).toBe('UL');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Guide' })).toHaveAttribute('href', '/docs/');
    expect(screen.getByRole('button', { name: 'Notes' })).toBeInTheDocument();
    expect(primaries(container)[2]?.tagName).toBe('DIV');
    expect(primaries(container)[2]).not.toHaveAttribute('role');
    expectHooksMatchSpec(container, 'LIST-ROW');
  });

  it('UIC-LIST-ROW-1.2 keeps one tab stop that follows focus, re-rendering only the two rows involved', async () => {
    const renders: string[] = [];
    const row = (name: string) => (
      <Profiler key={name} id={name} onRender={(id) => renders.push(id)}>
        <ListRow title={name} onPress={() => {}} />
      </Profiler>
    );
    const { container } = render(
      <List aria-label="Fruit">{['Apple', 'Pear', 'Plum', 'Fig'].map(row)}</List>,
    );
    await flush();
    expect(primaries(container).map((node) => node.tabIndex)).toEqual([0, -1, -1, -1]);

    act(() => primaries(container)[1]?.focus());
    renders.length = 0;
    act(() => primaries(container)[2]?.focus());
    expect(renders.sort()).toEqual(['Pear', 'Plum']);
    expect(primaries(container).map((node) => node.tabIndex)).toEqual([-1, -1, 0, -1]);
    renders.length = 0;
    act(() => primaries(container)[2]?.focus());
    expect(renders).toEqual([]);
  });

  it('UIC-LIST-ROW-1.2 makes a row the tab stop when one of its trailing controls takes focus', async () => {
    const { container } = render(
      <List aria-label="Fruit">
        <ListRow title="Apple" />
        <ListRow title="Pear" trailing={<button type="button">Rename</button>} />
      </List>,
    );
    await flush();
    act(() => screen.getByRole('button', { name: 'Rename' }).focus());
    expect(primaries(container).map((node) => node.tabIndex)).toEqual([-1, 0]);
  });

  it('UIC-LIST-ROW-1.3 moves focus with arrows, Home and End, skipping disabled rows without wrapping or activating', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <List aria-label="Fruit">
        <ListRow title="Apple" onPress={onPress} trailing={<input aria-label="Rename" />} />
        <ListRow title="Pear" onPress={onPress} isDisabled />
        <ListRow title="Plum" onPress={onPress} />
        <ListRow title="Fig" href="/fig" />
      </List>,
    );
    await flush();
    const [apple, , plum, fig] = primaries(container);
    await user.tab();
    expect(apple).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(plum).toHaveFocus();
    await user.keyboard('{End}');
    expect(fig).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(fig).toHaveFocus();
    await user.keyboard('{Home}');
    expect(apple).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(apple).toHaveFocus();
    await user.keyboard('{Control>}{ArrowDown}{/Control}');
    expect(apple).toHaveFocus();
    const input = screen.getByRole('textbox', { name: 'Rename' });
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveFocus();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('UIC-LIST-ROW-1.4 hands ArrowUp on the first row to the caller and focuses the first row on request', async () => {
    const onNavigatePastStart = vi.fn();
    const handle = createRef<ListHandle>();
    const user = userEvent.setup();
    const Rows = ({ ids }: { ids: string[] }) => (
      <List aria-label="Results" handleRef={handle} onNavigatePastStart={onNavigatePastStart}>
        {ids.map((id) => (
          <ListRow key={id} title={id} onPress={() => {}} />
        ))}
      </List>
    );
    const { rerender } = render(<Rows ids={['a', 'b', 'c']} />);
    await flush();
    act(() => handle.current?.focusFirst());
    expect(document.activeElement).toHaveTextContent('a');
    await user.keyboard('{ArrowUp}');
    expect(onNavigatePastStart).toHaveBeenCalledTimes(1);
    rerender(<Rows ids={['c', 'b', 'a']} />);
    act(() => handle.current?.focusFirst());
    expect(document.activeElement).toHaveTextContent('c');
  });

  it('UIC-LIST-ROW-1.5 moves focus from a removed row to its nearest survivor, the next one first', async () => {
    const Rows = ({ ids }: { ids: string[] }) => (
      <List aria-label="History">
        {ids.map((id) => (
          <ListRow key={id} title={id} onPress={() => {}} data-row={id} />
        ))}
      </List>
    );
    const primary = (id: string) =>
      document.querySelector<HTMLElement>(`[data-row="${id}"] .ui-list-row__primary`);
    const { rerender } = render(<Rows ids={['a', 'b', 'c', 'd']} />);
    await flush();
    act(() => primary('b')?.focus());
    rerender(<Rows ids={['a', 'c', 'd']} />);
    await flush();
    expect(primary('c')).toHaveFocus();
    expect(primary('c')).toHaveAttribute('tabindex', '0');

    rerender(<Rows ids={['a', 'c']} />);
    await flush();
    expect(primary('c')).toHaveFocus();
    act(() => primary('c')?.focus());
    rerender(<Rows ids={['a']} />);
    await flush();
    expect(primary('a')).toHaveFocus();
    expect(document.querySelectorAll('.ui-list-row__primary[tabindex="0"]')).toHaveLength(1);
  });

  it('UIC-LIST-ROW-1.5 keeps focus on a row whose primary control is replaced', async () => {
    const Rows = ({ editing }: { editing: boolean }) => (
      <List aria-label="History">
        {['a', 'b', 'c'].map((id) => (
          <ListRow
            key={id}
            title={id}
            data-row={id}
            onPress={editing && id === 'c' ? undefined : () => {}}
            trailing={editing && id === 'c' ? <input aria-label="Rename" autoFocus /> : undefined}
          />
        ))}
      </List>
    );
    const primary = (id: string) =>
      document.querySelector<HTMLElement>(`[data-row="${id}"] .ui-list-row__primary`);
    const { rerender } = render(<Rows editing={false} />);
    await flush();
    act(() => primary('c')?.focus());
    rerender(<Rows editing />);
    await flush();
    expect(screen.getByRole('textbox', { name: 'Rename' })).toHaveFocus();
    rerender(<Rows editing={false} />);
    await flush();
    expect(primary('c')).toHaveFocus();
    expect(primary('c')?.tagName).toBe('BUTTON');
  });

  it('UIC-LIST-ROW-1.5 does not pull focus back once it has left the list', async () => {
    const Rows = ({ ids }: { ids: string[] }) => (
      <>
        <List aria-label="History">
          {ids.map((id) => (
            <ListRow key={id} title={id} onPress={() => {}} data-row={id} />
          ))}
        </List>
        <button type="button">Elsewhere</button>
      </>
    );
    const primary = (id: string) =>
      document.querySelector<HTMLElement>(`[data-row="${id}"] .ui-list-row__primary`);
    const { rerender } = render(<Rows ids={['a', 'b']} />);
    await flush();
    act(() => primary('b')?.focus());
    act(() => primary('b')?.blur());
    expect(document.activeElement).toBe(document.body);
    rerender(<Rows ids={['a']} />);
    await flush();
    expect(document.activeElement).toBe(document.body);
    expect(primary('a')).toHaveAttribute('tabindex', '0');

    rerender(<Rows ids={['a', 'b']} />);
    await flush();
    act(() => primary('b')?.focus());
    act(() => screen.getByRole('button', { name: 'Elsewhere' }).focus());
    rerender(<Rows ids={['a']} />);
    await flush();
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });

  it('UIC-LIST-ROW-1.6 publishes pending and divided states', () => {
    const { container, rerender } = render(
      <List aria-label="Files">
        <ListRow title="Report.pdf" />
      </List>,
    );
    const list = container.querySelector('ul');
    expect(list).not.toHaveAttribute('aria-busy');
    expect(list).not.toHaveAttribute('data-pending');
    rerender(
      <List aria-label="Files" isPending divided>
        <ListRow title="Report.pdf" />
      </List>,
    );
    expect(list).toHaveAttribute('aria-busy', 'true');
    expect(list).toHaveAttribute('data-pending', 'true');
    expect(list).toHaveAttribute('data-divided', 'true');
    expectHooksMatchSpec(container, 'LIST-ROW');
  });

  it('UIC-LIST-ROW-1.7 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = createRef<HTMLUListElement>();
    const { container } = render(
      <List aria-labelledby="heading" className="caller" id="files" ref={ref} data-testid="list">
        <ListRow title="Report.pdf" />
      </List>,
    );
    const list = screen.getByTestId('list');
    expect(list).toHaveClass('ui-list', 'caller');
    expect(list).toHaveAttribute('id', 'files');
    expect(list).toHaveAttribute('aria-labelledby', 'heading');
    expect(ref.current).toBe(list);
    expectHooksMatchSpec(container, 'LIST-ROW');
  });
});

describe('ListRow', () => {
  it('UIC-LIST-ROW-2.1 makes the primary control a link, a button or a read-only body', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <List aria-label="Files">
        <ListRow href="/a" title="Link" />
        <ListRow onPress={onPress} title="Action" />
        <ListRow title="Static" />
      </List>,
    );
    const rows = [...container.querySelectorAll('li')];
    expect(rows.map((row) => row.getAttribute('data-kind'))).toEqual(['link', 'action', 'static']);
    const action = screen.getByRole('button', { name: 'Action' });
    await user.click(action);
    action.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
    await flush();
    expect(primaries(container)[2]?.tabIndex).toBe(-1);
    act(() => primaries(container)[2]?.focus());
    expect(primaries(container)[2]).toHaveFocus();
  });

  it('UIC-LIST-ROW-2.2 renders a link row as one link with nothing interactive inside and trailing controls beside it', () => {
    const { container } = render(
      <List aria-label="Files">
        <ListRow
          href="/report"
          title="Report.pdf"
          meta="4 KB"
          icon="info"
          trailing={<button type="button">Share</button>}
        />
      </List>,
    );
    const row = container.querySelector('li') as HTMLElement;
    expect(row.querySelectorAll('a')).toHaveLength(1);
    const link = row.querySelector('a') as HTMLElement;
    expect(link.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull();
    expect(link).toHaveTextContent('Report.pdf');
    const trailing = row.querySelector('.ui-list-row__trailing') as HTMLElement;
    expect(trailing.previousElementSibling).toBe(link);
    expect(link.contains(screen.getByRole('button', { name: 'Share' }))).toBe(false);
    expectHooksMatchSpec(container, 'LIST-ROW', { slots: ['primary', 'trailing'] });
  });

  it('UIC-LIST-ROW-2.2 draws row content without any control for an element that is itself the link', () => {
    const { container } = render(
      <a href="/report">
        <ListRowContent title="Report.pdf" meta="4 KB" leading={<svg />} data-testid="content" />
      </a>,
    );
    const content = screen.getByTestId('content');
    expect(content).toHaveClass('ui-list-row-content');
    expect(content.querySelector('a, button, [tabindex]')).toBeNull();
    expectHooksMatchSpec(container, 'LIST-ROW', {
      slots: [
        'ui-list-row-content__leading',
        'ui-list-row-content__title',
        'ui-list-row-content__meta',
      ],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-LIST-ROW-2.3 renders links through the provider and reports presses without blocking browser modifiers', async () => {
    const pressed: string[] = [];
    const renderLink: UiLinkRenderer = (props) => <a {...props} data-routed="true" />;
    render(
      <UiProvider renderLink={renderLink}>
        <List aria-label="Files">
          <ListRow
            href="/docs/"
            target="_blank"
            title="Guide"
            onPress={() => pressed.push('press')}
            onAuxPress={() => pressed.push('middle')}
          />
          <ListRow href="/other/" target="_blank" rel="external" title="Other" />
        </List>
      </UiProvider>,
    );
    const link = screen.getByRole('link', { name: 'Guide' });
    expect(link).toHaveAttribute('data-routed', 'true');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Other' })).toHaveAttribute('rel', 'external');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    act(() => link.dispatchEvent(click));
    expect(click.defaultPrevented).toBe(false);
    act(() => link.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 1 })));
    act(() => link.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 2 })));
    expect(pressed).toEqual(['press', 'middle']);
  });

  it('UIC-LIST-ROW-2.4 draws title, meta, an icon through IconLabel and decorative leading media', () => {
    const { container, rerender } = render(<ListRow title="Report.pdf" meta="4 KB" icon="info" />);
    const label = container.querySelector('.ui-icon-label') as HTMLElement;
    expect(label).toHaveAttribute('data-grow', 'true');
    expect(
      label.querySelector('.ui-icon-label__label .ui-list-row-content__title'),
    ).toHaveTextContent('Report.pdf');
    expect(container.querySelector('.ui-list-row-content__meta')).toHaveTextContent('4 KB');
    expectHooksMatchSpec(container, 'LIST-ROW');

    rerender(<ListRow title="Report.pdf" icon="info" leading={<svg data-testid="media" />} />);
    expect(screen.queryByTestId('media')).toBeNull();

    rerender(<ListRow title="Report.pdf" meta={null} leading={<svg data-testid="media" />} />);
    expect(screen.getByTestId('media').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.ui-list-row-content__meta')).toBeNull();
    expect(container.querySelector('.ui-icon-label')).toBeNull();
  });

  it('UIC-LIST-ROW-2.5 marks the current row with aria-current and data-current', () => {
    const { container } = render(
      <List aria-label="Pages">
        <ListRow href="/a" title="Link" isCurrent />
        <ListRow onPress={() => {}} title="Action" isCurrent />
        <ListRow title="Static" isCurrent />
        <ListRow title="Other" />
      </List>,
    );
    const [link, action, still, other] = primaries(container);
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(action).toHaveAttribute('aria-current', 'true');
    expect(still).toHaveAttribute('aria-current', 'true');
    expect(other).not.toHaveAttribute('aria-current');
    expect(container.querySelectorAll('li[data-current="true"]')).toHaveLength(3);
    expectHooksMatchSpec(container, 'LIST-ROW');
  });

  it('UIC-LIST-ROW-2.6 refuses activation of a disabled row and leaves it out of navigation', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <List aria-label="Files">
        <ListRow href="/a" title="Link" isDisabled />
        <ListRow onPress={onPress} title="Action" isDisabled />
        <ListRow title="Static" isDisabled />
      </List>,
    );
    await flush();
    expect(container.querySelector('a')).toBeNull();
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(0);
    expect(container.querySelectorAll('li[data-disabled="true"]')).toHaveLength(3);
    expectHooksMatchSpec(container, 'LIST-ROW');
  });

  it('UIC-LIST-ROW-2.7 publishes the tone, default when unset', () => {
    const { container } = render(
      <List aria-label="Tasks">
        <ListRow title="Due" />
        <ListRow title="Overdue" tone="danger" />
      </List>,
    );
    expect([...container.querySelectorAll('li')].map((row) => row.dataset.tone)).toEqual([
      'default',
      'danger',
    ]);
  });

  it('UIC-LIST-ROW-2.8 appends the caller class and forwards id and data attributes to the row', () => {
    const Harness = ({ children }: { children: ReactNode }) => {
      const [label] = useState('Files');
      return <List aria-label={label}>{children}</List>;
    };
    const { container } = render(
      <Harness>
        <ListRow title="Report.pdf" className="caller" id="row-1" data-row="report" data-kind="x" />
      </Harness>,
    );
    const row = container.querySelector('li') as HTMLElement;
    expect(row).toHaveClass('ui-list-row', 'caller');
    expect(row).toHaveAttribute('id', 'row-1');
    expect(row).toHaveAttribute('data-row', 'report');
    expect(row).toHaveAttribute('data-kind', 'static');
    expectHooksMatchSpec(container, 'LIST-ROW', { callerAttributes: ['data-row'] });
  });
});
