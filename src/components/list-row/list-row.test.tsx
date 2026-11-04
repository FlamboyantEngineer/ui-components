import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, Profiler, type ReactNode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { deepActive, inShadow, ShadowHost } from '../../../test/shadow-fixtures.js';
import { InfoGlyph } from '../../core/glyphs.js';
import { type UiLinkRenderer, UiProvider } from '../../core/provider.js';
import { List, type ListHandle, ListRow, ListRowContent } from './list-row.js';

const primaries = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('.ui-list-row__primary'),
];

/** Lets pending effects and promise callbacks settle inside act. */
const flush = () => act(() => Promise.resolve());

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

  it('UIC-LIST-ROW-1.2 keeps the tab stop on the first row while rows change before focus enters', async () => {
    const user = userEvent.setup();
    function Results({ names }: { names: string[] }) {
      return (
        <>
          <input aria-label="Query" />
          <List aria-label="Results">
            {names.map((name) => (
              <ListRow key={name} title={name} onPress={() => {}} />
            ))}
          </List>
        </>
      );
    }
    const { rerender } = render(<Results names={['Apple', 'Banana', 'Cherry']} />);
    await flush();
    rerender(<Results names={['Avocado', 'Banana', 'Cherry']} />);
    await flush();
    rerender(<Results names={['Apricot', 'Avocado', 'Banana', 'Cherry']} />);
    await flush();
    act(() => screen.getByRole('textbox', { name: 'Query' }).focus());
    await user.tab();
    expect(screen.getByRole('button', { name: 'Apricot' })).toHaveFocus();
  });

  it('UIC-LIST-ROW-1.2 reads the rows once for a whole batch of mounting rows', async () => {
    const querySelectorAll = vi.spyOn(Element.prototype, 'querySelectorAll');
    const names = Array.from({ length: 200 }, (_, index) => `Row ${index}`);
    render(
      <List aria-label="Many">
        {names.map((name) => (
          <ListRow key={name} title={name} onPress={() => {}} />
        ))}
      </List>,
    );
    await flush();
    const reads = querySelectorAll.mock.calls.filter(([selector]) =>
      String(selector).includes('ui-list-row__primary'),
    );
    expect(reads.length).toBeLessThanOrEqual(2);
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

  function DisabledTrailingList({
    disabled = ['Blue'],
    rows = ['Alpha', 'Blue', 'Gamma'],
  }: {
    disabled?: string[];
    rows?: string[];
  }) {
    return (
      <>
        <button type="button">Before</button>
        <List aria-label="Letters">
          {rows.map((name) => (
            <ListRow
              key={name}
              title={name}
              onPress={() => {}}
              isDisabled={disabled.includes(name)}
              trailing={<button type="button">{`Share ${name}`}</button>}
            />
          ))}
        </List>
        <button type="button">After</button>
      </>
    );
  }
  const tabStops = (container: HTMLElement) =>
    primaries(container).flatMap((node) =>
      node.tabIndex === 0 && !node.matches(':disabled') ? [node.textContent] : [],
    );

  it("UIC-LIST-ROW-1.2 keeps the tab stop on an enabled row when a disabled row's trailing control takes keyboard focus", async () => {
    const user = userEvent.setup();
    const { container } = render(<DisabledTrailingList />);
    await flush();
    await user.click(screen.getByRole('button', { name: 'Before' }));
    await user.tab();
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Share Blue' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'After' }));
    expect(tabStops(container)).toEqual(['Alpha']);
    await user.click(screen.getByRole('button', { name: 'Before' }));
    await user.tab();
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveFocus();
  });

  it("UIC-LIST-ROW-1.2 keeps the last enabled tab stop when a disabled row's trailing control is pressed", async () => {
    const user = userEvent.setup();
    const { container } = render(<DisabledTrailingList />);
    await flush();
    await user.click(screen.getByRole('button', { name: 'Gamma' }));
    await user.click(screen.getByRole('button', { name: 'Share Blue' }));
    expect(tabStops(container)).toEqual(['Gamma']);
    await user.click(screen.getByRole('button', { name: 'Share Alpha' }));
    expect(tabStops(container)).toEqual(['Alpha']);
  });

  it('UIC-LIST-ROW-1.2 moves the tab stop to an enabled row when its row is disabled or removed', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<DisabledTrailingList disabled={[]} />);
    await flush();
    await user.click(screen.getByRole('button', { name: 'Share Blue' }));
    expect(tabStops(container)).toEqual(['Blue']);
    rerender(<DisabledTrailingList />);
    await flush();
    expect(tabStops(container)).toEqual(['Gamma']);
    await user.click(screen.getByRole('button', { name: 'Share Blue' }));
    rerender(<DisabledTrailingList rows={['Alpha', 'Blue']} />);
    await flush();
    expect(tabStops(container)).toEqual(['Alpha']);
    expect(screen.getByRole('button', { name: 'Share Blue' })).toHaveFocus();
  });

  it('UIC-LIST-ROW-1.2 leaves an all-disabled list without a row tab stop while its trailing controls work', async () => {
    const user = userEvent.setup();
    const { container } = render(<DisabledTrailingList disabled={['Alpha', 'Blue', 'Gamma']} />);
    await flush();
    await user.click(screen.getByRole('button', { name: 'Before' }));
    await user.tab();
    expect(screen.getByRole('button', { name: 'Share Alpha' })).toHaveFocus();
    expect(tabStops(container)).toEqual([]);
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

  it('UIC-LIST-ROW-1.5 moves focus from a removed row inside a shadow root', async () => {
    const Rows = ({ ids }: { ids: string[] }) => (
      <ShadowHost name="page">
        <List aria-label="History">
          {ids.map((id) => (
            <ListRow key={id} title={id} onPress={() => {}} />
          ))}
        </List>
      </ShadowHost>
    );
    const { rerender } = render(<Rows ids={['a', 'b', 'c']} />);
    await flush();
    act(() => inShadow('page').getByRole('button', { name: 'b' }).focus());
    rerender(<Rows ids={['a', 'c']} />);
    await flush();
    expect(deepActive()).toBe(inShadow('page').getByRole('button', { name: 'c' }));
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
    expect(document.body).toHaveFocus();
    rerender(<Rows ids={['a']} />);
    await flush();
    expect(document.body).toHaveFocus();
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
      <List aria-labelledby="heading" className="caller" id="files" ref={ref} data-probe="list">
        <ListRow title="Report.pdf" />
      </List>,
    );
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('data-probe', 'list');
    expect(list).toHaveClass('ui-list', 'caller');
    expect(list).toHaveAttribute('id', 'files');
    expect(list).toHaveAttribute('aria-labelledby', 'heading');
    expect(ref.current).toBe(list);
    expectHooksMatchSpec(container, 'LIST-ROW', { callerAttributes: ['data-probe'] });
  });

  it('UIC-LIST-ROW-1.7 runs caller key handlers first and leaves claimed keys to them', async () => {
    const user = userEvent.setup();
    const onBlurCapture = vi.fn();
    const { container } = render(
      <>
        <List
          aria-label="Fruit"
          aria-describedby="fruit-help"
          onBlurCapture={onBlurCapture}
          onKeyDown={(event) => {
            if (event.key === 'End') event.preventDefault();
          }}
        >
          <ListRow title="Apple" onPress={() => {}} />
          <ListRow title="Pear" onPress={() => {}} />
          <ListRow title="Plum" onPress={() => {}} />
        </List>
        <button type="button">After</button>
      </>,
    );
    await flush();
    expect(screen.getByRole('list')).toHaveAttribute('aria-describedby', 'fruit-help');
    const [apple, pear] = primaries(container);
    await user.tab();
    await user.keyboard('{End}');
    expect(apple).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(pear).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(onBlurCapture).toHaveBeenCalled();
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
          icon={InfoGlyph}
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
        <ListRowContent title="Report.pdf" meta="4 KB" leading={<svg />} data-probe="content" />
      </a>,
    );
    const content = screen.getByRole('link').firstElementChild;
    expect(content).toHaveAttribute('data-probe', 'content');
    expect(content).toHaveClass('ui-list-row-content');
    expect(content?.querySelector('a, button, [tabindex]')).toBeNull();
    expectHooksMatchSpec(container, 'LIST-ROW', {
      slots: [
        'ui-list-row-content__leading',
        'ui-list-row-content__title',
        'ui-list-row-content__meta',
      ],
      callerAttributes: ['data-probe'],
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
          <ListRow href="/other/" target="_blank" rel="nofollow" title="Other" />
        </List>
      </UiProvider>,
    );
    const link = screen.getByRole('link', { name: 'Guide' });
    expect(link).toHaveAttribute('data-routed', 'true');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Other' })).toHaveAttribute(
      'rel',
      'nofollow noopener noreferrer',
    );
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    act(() => {
      link.dispatchEvent(click);
    });
    expect(click.defaultPrevented).toBe(false);
    act(() => {
      link.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 1 }));
    });
    act(() => {
      link.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 2 }));
    });
    expect(pressed).toEqual(['press', 'middle']);
  });

  it('UIC-LIST-ROW-2.4 draws title, meta, an icon through IconLabel and decorative leading media', () => {
    const { container, rerender } = render(
      <ListRow title="Report.pdf" meta="4 KB" icon={InfoGlyph} />,
    );
    const label = container.querySelector('.ui-icon-label') as HTMLElement;
    expect(label).toHaveAttribute('data-grow', 'true');
    expect(
      label.querySelector('.ui-icon-label__label .ui-list-row-content__title'),
    ).toHaveTextContent('Report.pdf');
    expect(container.querySelector('.ui-list-row-content__meta')).toHaveTextContent('4 KB');
    expectHooksMatchSpec(container, 'LIST-ROW');

    rerender(<ListRow title="Report.pdf" icon={InfoGlyph} leading={<svg aria-label="Media" />} />);
    expect(screen.queryByLabelText('Media')).not.toBeInTheDocument();

    rerender(<ListRow title="Report.pdf" meta={null} leading={<svg aria-label="Media" />} />);
    expect(screen.getByLabelText('Media').parentElement).toHaveAttribute('aria-hidden', 'true');
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

  it('UIC-LIST-ROW-2.7 publishes the tone, neutral when unset', () => {
    const { container } = render(
      <List aria-label="Tasks">
        <ListRow title="Due" />
        <ListRow title="Overdue" tone="danger" />
      </List>,
    );
    expect([...container.querySelectorAll('li')].map((row) => row.dataset.tone)).toEqual([
      'neutral',
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
        <ListRow
          title="Report.pdf"
          className="caller"
          id="row-1"
          data-row="report"
          data-kind="x"
          aria-setsize={1}
        />
      </Harness>,
    );
    const row = container.querySelector('li') as HTMLElement;
    expect(row).toHaveClass('ui-list-row', 'caller');
    expect(row).toHaveAttribute('id', 'row-1');
    expect(row).toHaveAttribute('aria-setsize', '1');
    expect(row).toHaveAttribute('data-row', 'report');
    expect(row).toHaveAttribute('data-kind', 'static');
    expectHooksMatchSpec(container, 'LIST-ROW', { callerAttributes: ['data-row'] });
  });
});
