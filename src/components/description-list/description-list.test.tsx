import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { DescriptionList, DescriptionRow, type DescriptionRowSpan } from './description-list.js';
import { formatDescriptionValue, type DescriptionValue } from './format-description-value.js';

function Sample(props: { layout?: 'inline' | 'stacked'; columns?: 1 | 2 }) {
  return (
    <DescriptionList {...props} aria-label="Summary">
      <DescriptionRow label={<code>{'{{count}}'}</code>} secondary={<span>Per crate</span>}>
        {0}
      </DescriptionRow>
      <DescriptionRow label="Title">Safe {'<title>'} &amp; value</DescriptionRow>
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
    const titleRow = screen.getByText('Title').closest('.ui-description-list__row');
    expect(titleRow?.querySelector('dd')?.textContent).toBe('Safe <title> & value');
    expect(list.querySelectorAll('.ui-description-list__value')[2]?.textContent).toBe('');
    expectHooksMatchSpec(container, 'DESCRIPTION-LIST', {
      slots: 'all',
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
        expectHooksMatchSpec(container, 'DESCRIPTION-LIST');
      }
    }
  });

  it('UIC-DESCRIPTION-LIST-1.3 publishes three and four columns', () => {
    for (const columns of [3, 4] as const) {
      const { container, unmount } = render(
        <DescriptionList columns={columns}>
          <DescriptionRow label="City">Lisbon</DescriptionRow>
        </DescriptionList>,
      );
      expect(container.firstElementChild).toHaveAttribute('data-columns', String(columns));
      expectHooksMatchSpec(container, 'DESCRIPTION-LIST');
      unmount();
    }
  });

  it('UIC-DESCRIPTION-LIST-1.4 publishes the columns a row spans, one by default', () => {
    const spans: DescriptionRowSpan[] = [2, 3, 4, 'full'];
    const { container } = render(
      <DescriptionList columns={4}>
        <DescriptionRow label="City">Lisbon</DescriptionRow>
        {spans.map((span) => (
          <DescriptionRow key={span} label={`Span ${span}`} span={span}>
            Wide
          </DescriptionRow>
        ))}
      </DescriptionList>,
    );
    const rows = [...container.querySelectorAll('.ui-description-list__row')];
    expect(rows.map((row) => row.getAttribute('data-span'))).toEqual(['1', '2', '3', '4', 'full']);
    expectHooksMatchSpec(container, 'DESCRIPTION-LIST');
  });

  it('UIC-DESCRIPTION-LIST-1.5 formats ISO 8601 dates as calendar dates in any time zone', () => {
    expectTypeOf<Date>().not.toMatchTypeOf<DescriptionValue>();
    expectTypeOf<{ start: Date; end: Date }>().not.toMatchTypeOf<DescriptionValue>();
    const medium = (options: Intl.DateTimeFormatOptions = {}) =>
      new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', ...options });
    expect(formatDescriptionValue('2026-05-14', { locale: 'en-US' })).toBe('May 14, 2026');
    for (const timeZone of ['America/New_York', 'Pacific/Kiritimati', 'UTC']) {
      expect(
        formatDescriptionValue('2026-05-14', {
          locale: 'en-US',
          formatOptions: { dateStyle: 'medium', timeZone },
        }),
      ).toBe('May 14, 2026');
      expect(
        formatDescriptionValue(
          { start: '2026-05-14', end: '2026-05-21' },
          {
            locale: 'en-US',
            formatOptions: { dateStyle: 'medium', timeZone },
          },
        ),
      ).toBe(medium().formatRange(new Date(2026, 4, 14), new Date(2026, 4, 21)));
    }
    expect(
      formatDescriptionValue('2026-05-14T23:30:00Z', {
        locale: 'en-US',
        formatOptions: { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' },
      }),
    ).toBe(medium({ timeStyle: 'short', timeZone: 'UTC' }).format(Date.UTC(2026, 4, 14, 23, 30)));
    expect(
      formatDescriptionValue({ start: '2026-05-14', end: '2026-05-21' }, { locale: 'en-US' }),
    ).toBe(medium().formatRange(new Date(2026, 4, 14), new Date(2026, 4, 21)));
    expect(formatDescriptionValue('Pending', { locale: 'en-US' })).toBe('Pending');
    expect(
      formatDescriptionValue({ start: 'Spring', end: '2026-05-21' }, { locale: 'en-US' }),
    ).toBe('Spring – 2026-05-21');
  });

  it('UIC-DESCRIPTION-LIST-1.5 formats numbers, dates, lists and ranges for the provider locale', () => {
    const day = '2024-03-05';
    const later = '2024-03-09';
    render(
      <UiProvider locale="de-DE">
        <DescriptionList>
          <DescriptionRow label="Weight" value={1234.5} />
          <DescriptionRow
            label="Price"
            value={9.5}
            formatOptions={{ style: 'currency', currency: 'EUR' }}
          />
          <DescriptionRow label="Picked" value={day} />
          <DescriptionRow label="Fruit" value={['Apfel', 'Birne', 'Pflaume']} />
          <DescriptionRow label="Crates" value={{ start: 3, end: 7 }} />
          <DescriptionRow label="Season" value={{ start: day, end: later }} />
          <DescriptionRow label="Note" value={42}>
            Shown instead
          </DescriptionRow>
        </DescriptionList>
      </UiProvider>,
    );
    const values = [...document.querySelectorAll('.ui-description-list__value')].map(
      (value) => value.textContent,
    );
    expect(values).toEqual([
      '1.234,5',
      new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(9.5),
      new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(2024, 2, 5)),
      'Apfel, Birne und Pflaume',
      new Intl.NumberFormat('de-DE').formatRange(3, 7),
      new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).formatRange(
        new Date(2024, 2, 5),
        new Date(2024, 2, 9),
      ),
      'Shown instead',
    ]);
    expect(
      formatDescriptionValue(['a', 'b'], {
        locale: 'en-US',
        formatOptions: { type: 'disjunction' },
      }),
    ).toBe('a or b');
    expect(
      formatDescriptionValue(day, { locale: 'en-US', formatOptions: { year: 'numeric' } }),
    ).toBe('2024');
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
        >
          {value}
        </DescriptionRow>
        <DescriptionRow label="Created">Monday</DescriptionRow>
      </DescriptionList>
    );
    const { container, rerender } = render(row('Tuesday'));
    const target = screen.getByLabelText('Updated, has a note');
    expect(target).toHaveAttribute('aria-label', 'Updated, has a note');
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(1);
    await user.click(target);
    await user.keyboard('{Shift>}{F10}{/Shift}');
    await user.pointer({ keys: '[MouseRight]', target });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalled();
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    rerender(row('Wednesday'));
    expect(screen.getByLabelText('Updated, has a note')).toBe(target);
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
