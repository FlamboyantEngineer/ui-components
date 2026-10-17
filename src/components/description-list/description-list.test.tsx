import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { DescriptionList, DescriptionRow } from './description-list.js';

function Sample(props: { layout?: 'inline' | 'stacked'; columns?: 1 | 2 }) {
  return (
    <DescriptionList {...props} aria-label="Summary">
      <DescriptionRow label={<code>{'{{count}}'}</code>} secondary={<span>Per crate</span>}>
        {0}
      </DescriptionRow>
      <DescriptionRow label="Title" data-testid="title-row">
        Safe {'<title>'} &amp; value
      </DescriptionRow>
      <DescriptionRow label="Empty">{''}</DescriptionRow>
    </DescriptionList>
  );
}

describe('DescriptionList', () => {
  it('UIC-DESCRIPTION-LIST-1.1 groups each term and its definitions in a native list', () => {
    const { container } = render(<Sample />);
    const list = container.querySelector('dl') as HTMLElement;
    expect(list).toHaveClass('ui-description-list');
    expect(
      [...list.children].map((row) => [
        row.tagName,
        ...[...row.children].map((child) => child.tagName),
      ]),
    ).toEqual([
      ['DIV', 'DT', 'DD', 'DD'],
      ['DIV', 'DT', 'DD'],
      ['DIV', 'DT', 'DD'],
    ]);
    expect([...list.querySelectorAll('dt')].map((node) => node.textContent)).toEqual([
      '{{count}}',
      'Title',
      'Empty',
    ]);
    expect(list.querySelector('.ui-description-list__value')).toHaveTextContent('0');
    expect(screen.getByTestId('title-row').querySelector('dd')?.textContent).toBe(
      'Safe <title> & value',
    );
    expect(list.querySelectorAll('.ui-description-list__value')[2]?.textContent).toBe('');
    expectHooksMatchSpec(container, 'DESCRIPTION-LIST', {
      slots: 'all',
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-DESCRIPTION-LIST-1.2 adds a second definition only for real content', () => {
    const { container, rerender } = render(
      <DescriptionList>
        <DescriptionRow label="Name">Ada</DescriptionRow>
      </DescriptionList>,
    );
    for (const secondary of [undefined, null, false, true, '']) {
      rerender(
        <DescriptionList>
          <DescriptionRow label="Name" secondary={secondary}>
            Ada
          </DescriptionRow>
        </DescriptionList>,
      );
      expect(container.querySelectorAll('dd')).toHaveLength(1);
    }
    rerender(
      <DescriptionList>
        <DescriptionRow label="Name" secondary={0}>
          Ada
        </DescriptionRow>
      </DescriptionList>,
    );
    expect([...container.querySelectorAll('dd')].map((node) => node.textContent)).toEqual([
      'Ada',
      '0',
    ]);
    expect(container.querySelectorAll('dd')[1]).toHaveClass('ui-description-list__secondary');
  });

  it('UIC-DESCRIPTION-LIST-1.3 publishes layout and columns, inline and one column by default', () => {
    const { container, rerender } = render(<Sample />);
    const list = () => container.querySelector('dl');
    expect(list()).toHaveAttribute('data-layout', 'inline');
    expect(list()).toHaveAttribute('data-columns', '1');
    for (const layout of ['inline', 'stacked'] as const) {
      for (const columns of [1, 2] as const) {
        rerender(<Sample layout={layout} columns={columns} />);
        expect(list()).toHaveAttribute('data-layout', layout);
        expect(list()).toHaveAttribute('data-columns', String(columns));
        expectHooksMatchSpec(container, 'DESCRIPTION-LIST', { callerAttributes: ['data-testid'] });
      }
    }
  });

  it('UIC-DESCRIPTION-LIST-2.1 hides with the native attribute and forwards row focus handlers', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    const onContextMenu = vi.fn();
    const row = (value: string) => (
      <DescriptionList>
        <DescriptionRow
          label="Updated"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onContextMenu={onContextMenu}
          aria-label="Updated, has a note"
          data-testid="row"
        >
          {value}
        </DescriptionRow>
        <DescriptionRow label="Created">Monday</DescriptionRow>
      </DescriptionList>
    );
    const { container, rerender } = render(row('Tuesday'));
    const target = screen.getByTestId('row');
    expect(target).toHaveAttribute('aria-label', 'Updated, has a note');
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(1);
    await user.click(target);
    await user.keyboard('{Shift>}{F10}{/Shift}');
    await user.pointer({ keys: '[MouseRight]', target });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalled();
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    rerender(row('Wednesday'));
    expect(screen.getByTestId('row')).toBe(target);
    expect(target).toHaveFocus();

    rerender(
      <DescriptionList hidden>
        <DescriptionRow label="Name">Ada</DescriptionRow>
      </DescriptionList>,
    );
    expect((container.querySelector('dl') as HTMLElement).hidden).toBe(true);
  });

  it('UIC-DESCRIPTION-LIST-2.2 adds no roles, tab stops or live regions and takes a name', () => {
    const { container } = render(<Sample />);
    expect(container.querySelector('[role], [tabindex], [aria-live]')).toBeNull();
    expect(container.querySelector('dl')).toHaveAttribute('aria-label', 'Summary');
  });

  it('UIC-DESCRIPTION-LIST-2.3 appends caller classes and forwards ids and data attributes', () => {
    const { container } = render(
      <DescriptionList id="facts" className="caller" data-testid="list" data-layout="grid">
        <DescriptionRow label="Name" id="name-row" className="row-caller" data-testid="row">
          Ada
        </DescriptionRow>
      </DescriptionList>,
    );
    const list = container.querySelector('dl');
    expect(list).toHaveClass('ui-description-list', 'caller');
    expect(list).toHaveAttribute('id', 'facts');
    expect(list).toHaveAttribute('data-testid', 'list');
    expect(list).toHaveAttribute('data-layout', 'inline');
    const row = container.querySelector('#name-row');
    expect(row).toHaveClass('ui-description-list__row', 'row-caller');
    expect(row).toHaveAttribute('data-testid', 'row');
    expect(row?.className).not.toContain('ui-description-list ');
    expectHooksMatchSpec(container, 'DESCRIPTION-LIST', { slots: ['row', 'label', 'value'] });
  });
});
