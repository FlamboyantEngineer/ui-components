import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { ChangeList, type ChangeListChange } from './change-list.js';
import { compareLists, resolveChangeKind } from './list-changes.js';

const getNow = () => new Date(2026, 3, 20, 10, 30);

const changes: ChangeListChange[] = [
  { id: 'status', label: 'Status', before: 'Draft', after: 'In review' },
  {
    id: 'summary',
    label: 'Summary',
    type: 'text',
    before: 'Bake the bread for an hour.',
    after: 'Bake the loaf for forty minutes.',
  },
  {
    id: 'tags',
    label: 'Tags',
    type: 'list',
    before: ['citrus', 'sweet', 'winter'],
    after: ['citrus', 'summer', 'sweet'],
  },
  { id: 'owner', label: 'Owner', after: 'Maria Santos' },
  { id: 'due', label: 'Due', before: 'May 3', after: null },
];

const rows = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('.ui-change-list__change'),
];
const value = (row: HTMLElement | undefined) =>
  row?.querySelector('.ui-description-list__value') as HTMLElement;

describe('ChangeList', () => {
  it('UIC-CHANGE-LIST-1.1 keeps numeric and text IDs distinct when a change is removed', () => {
    const entries = [
      { id: 1, label: 'Numeric change', after: 'First' },
      { id: '1', label: 'Text change', after: 'Second' },
    ];
    const { rerender } = render(<ChangeList changes={entries} />);
    const textChange = screen.getByText('Text change');
    rerender(<ChangeList changes={entries.slice(1)} />);
    expect(screen.getByText('Text change')).toBe(textChange);
    expect(screen.queryByText('Numeric change')).not.toBeInTheDocument();
  });

  it('UIC-CHANGE-LIST-1.1 renders one description row per change', () => {
    const { container } = render(<ChangeList changes={changes} />);
    const list = container.querySelector('dl');
    expect(list).toHaveClass('ui-description-list', 'ui-change-list');
    const all = rows(container);
    expect(all).toHaveLength(5);
    expect(all[0]).toHaveClass('ui-description-list__row');
    expect(all.map((row) => row.querySelector('dt')?.textContent)).toEqual([
      'Status',
      'Summary',
      'Tags',
      'Owner',
      'Due',
    ]);
    expect(all.map((row) => row.getAttribute('data-type'))).toEqual([
      'value',
      'text',
      'list',
      'value',
      'value',
    ]);
    expect(all.map((row) => row.getAttribute('data-change'))).toEqual([
      'changed',
      'changed',
      'changed',
      'added',
      'removed',
    ]);
    expect(resolveChangeKind([], ['a'])).toBe('added');
    expect(resolveChangeKind('a', '')).toBe('removed');
    expect(resolveChangeKind(undefined, null)).toBe('changed');
    expectHooksMatchSpec(container, 'CHANGE-LIST', { slots: ['change'] });
  });

  it('UIC-CHANGE-LIST-1.2 stacks captioned sides in the detailed variant', () => {
    const { container, rerender } = render(<ChangeList changes={changes} />);
    const list = container.querySelector('dl');
    expect(list).toHaveAttribute('data-variant', 'compact');
    expect(list).toHaveAttribute('data-layout', 'inline');
    expect(container.querySelector('.ui-change-list__side')).toBeNull();
    rerender(
      <UiProvider strings={{ valueBefore: 'Was', valueAfter: 'Now', emptyValue: 'None' }}>
        <ChangeList changes={changes} variant="detailed" />
      </UiProvider>,
    );
    const detailed = container.querySelector('dl');
    expect(detailed).toHaveAttribute('data-variant', 'detailed');
    expect(detailed).toHaveAttribute('data-layout', 'stacked');
    const sides = value(rows(container)[0]).querySelectorAll('.ui-change-list__side');
    expect([...sides].map((side) => side.getAttribute('data-side'))).toEqual(['before', 'after']);
    expect(sides[0]).toHaveTextContent('Was Draft');
    expect(sides[1]).toHaveTextContent('Now In review');
    expect(sides[0]?.querySelector('.ui-change-list__caption')).toHaveTextContent('Was');
    const owner = value(rows(container)[3]).querySelectorAll('.ui-change-list__side');
    expect(owner[0]?.querySelector('.ui-change-list__empty')).toHaveTextContent('None');
    expect(owner[1]?.querySelector('.ui-change-list__empty')).toBeNull();
    expectHooksMatchSpec(container, 'CHANGE-LIST', { slots: ['side', 'caption', 'empty'] });
  });

  it('UIC-CHANGE-LIST-1.3 shows a word diff of text', () => {
    const { container, rerender } = render(<ChangeList changes={changes} />);
    const diff = value(rows(container)[1]).querySelector('.ui-change-list__text');
    expect(diff).toHaveClass('ui-inline-text-diff');
    expect(
      [...requireDefined(diff).querySelectorAll('del')].map((node) => node.textContent),
    ).toEqual(['bread', 'an hour']);
    expect(
      [...requireDefined(diff).querySelectorAll('ins')].map((node) => node.textContent),
    ).toEqual(['loaf', 'forty minutes']);
    rerender(<ChangeList changes={changes} variant="detailed" />);
    const [before, after] = value(rows(container)[1]).querySelectorAll('.ui-change-list__text');
    expect(before).toHaveTextContent('Bake the bread for an hour.');
    expect(before?.querySelectorAll('ins')).toHaveLength(0);
    expect(after).toHaveTextContent('Bake the loaf for forty minutes.');
    expect(after?.querySelectorAll('del')).toHaveLength(0);
    rerender(
      <ChangeList
        changes={[{ id: 'x', label: 'X', type: 'text', before: ['a', 'b'], after: 'a, c' }]}
      />,
    );
    expect(container.querySelector('.ui-change-list__text del')).toHaveTextContent('b');
    expectHooksMatchSpec(container, 'CHANGE-LIST', { slots: ['text'] });
  });

  it('UIC-CHANGE-LIST-1.4 shows old and new plain values', () => {
    const { container, rerender } = render(
      <ChangeList
        changes={changes}
        renderValue={(text) => <b data-rendered="">{text.toUpperCase()}</b>}
      />,
    );
    const status = value(rows(container)[0]);
    expect(status.querySelector('del.ui-change-list__old')).toHaveTextContent('DRAFT');
    expect(status.querySelector('ins.ui-change-list__new')).toHaveTextContent('IN REVIEW');
    expect(status.querySelector('.ui-change-list__arrow')).toHaveAttribute('aria-hidden', 'true');
    expect(within(status).getByText('changed to').style.position).toBe('absolute');
    expect(status).toHaveTextContent('DRAFT → changed to IN REVIEW');
    const owner = value(rows(container)[3]);
    expect(owner.querySelector('.ui-change-list__old')).toBeNull();
    expect(owner.querySelector('.ui-change-list__arrow')).toBeNull();
    expect(owner).toHaveTextContent(/^MARIA SANTOS$/);
    expect(value(rows(container)[4]).querySelector('.ui-change-list__new')).toBeNull();
    expectHooksMatchSpec(container, 'CHANGE-LIST', { slots: ['old', 'new', 'arrow'] });
    rerender(<ChangeList changes={changes} variant="detailed" />);
    expect(value(rows(container)[0]).querySelector('.ui-change-list__arrow')).toBeNull();
    expect(value(rows(container)[0]).querySelector('.ui-change-list__old')).toHaveTextContent(
      'Draft',
    );
  });

  it('UIC-CHANGE-LIST-1.5 shows the items added to and removed from a list', () => {
    const { container, rerender } = render(
      <ChangeList changes={changes} renderValue={(text) => `#${text}`} />,
    );
    const items = () => [...value(rows(container)[2]).querySelectorAll('.ui-change-list__item')];
    expect(value(rows(container)[2]).querySelector('ul')).toHaveClass('ui-change-list__items');
    expect(items().map((item) => [item.getAttribute('data-change'), item.textContent])).toEqual([
      ['removed', '#winter'],
      ['added', '#summer'],
    ]);
    expect(items()[0]?.querySelector('del')).toHaveTextContent('#winter');
    expect(items()[1]?.querySelector('ins')).toHaveTextContent('#summer');
    rerender(<ChangeList changes={changes} variant="detailed" />);
    const sides = value(rows(container)[2]).querySelectorAll('.ui-change-list__side');
    const read = (side: Element | undefined) =>
      [...requireDefined(side).querySelectorAll('.ui-change-list__item')].map((item) =>
        [item.getAttribute('data-change'), item.textContent].join(' '),
      );
    expect(read(sides[0])).toEqual(['unchanged citrus', 'unchanged sweet', 'removed winter']);
    expect(read(sides[1])).toEqual(['unchanged citrus', 'added summer', 'unchanged sweet']);
    expect(compareLists(['a', 'a', 'b'], ['a', 'c'])).toEqual({
      before: [
        { value: 'a', change: 'unchanged' },
        { value: 'a', change: 'removed' },
        { value: 'b', change: 'removed' },
      ],
      after: [
        { value: 'a', change: 'unchanged' },
        { value: 'c', change: 'added' },
      ],
    });
    expectHooksMatchSpec(container, 'CHANGE-LIST', { slots: ['items', 'item'] });
  });

  it('UIC-CHANGE-LIST-1.5 reads an empty old value of a list change as no items', () => {
    const { container } = render(
      <ChangeList
        changes={[{ id: 'tags', label: 'Tags', type: 'list', before: '', after: ['red'] }]}
      />,
    );
    const items = [...container.querySelectorAll('.ui-change-list__item')];
    expect(items.map((item) => `${item.getAttribute('data-change')}:${item.textContent}`)).toEqual([
      'added:red',
    ]);
  });

  it('UIC-CHANGE-LIST-1.6 says who made a change and when', () => {
    const { container } = render(
      <ChangeList
        changes={[
          {
            ...requireDefined(changes[0]),
            person: { name: 'Jon Berg' },
            time: '2026-04-20T10:00:00',
          },
          { ...requireDefined(changes[3]), time: '2026-04-19' },
          requireDefined(changes[4]),
        ]}
        getNow={getNow}
        showAvatar
        fallbackAfterDays={1}
      />,
    );
    const attribution = (index: number) =>
      rows(container)[index]?.querySelector(
        '.ui-description-list__secondary > .ui-change-list__attribution',
      );
    expect(attribution(0)).toHaveClass('ui-attribution');
    expect(attribution(0)).toHaveTextContent('30 minutes ago by JBJon Berg');
    expect(attribution(1)).toHaveTextContent(/^Apr 19, 2026$/);
    expect(attribution(2)).toBeNull();
    expectHooksMatchSpec(container, 'CHANGE-LIST', { slots: ['attribution'] });
  });

  it('UIC-CHANGE-LIST-1.7 shows an empty state without changes', () => {
    const { container, rerender } = render(<ChangeList changes={[]} />);
    expect(container.querySelector('dl')).toBeNull();
    expect(container.querySelector('.ui-empty-state')).toHaveTextContent('No changes.');
    rerender(<ChangeList changes={[]} renderEmptyState={() => 'Identical'} />);
    expect(container).toHaveTextContent(/^Identical$/);
  });

  it('UIC-CHANGE-LIST-1.7 renders nothing for an empty state that returns null', () => {
    const { container } = render(<ChangeList changes={[]} renderEmptyState={() => null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('UIC-CHANGE-LIST-1.8 forwards id, labels, class names and caller attributes', () => {
    const { container } = render(
      <ChangeList
        changes={changes}
        id="changes"
        aria-label="What changed"
        className="host"
        data-variant="caller"
        data-test="changes"
      />,
    );
    const list = container.querySelector('dl');
    expect(list).toHaveAttribute('id', 'changes');
    expect(list).toHaveAttribute('aria-label', 'What changed');
    expect(list).toHaveClass('ui-change-list', 'host');
    expect(list).toHaveAttribute('data-variant', 'compact');
    expect(list).toHaveAttribute('data-test', 'changes');
    expectHooksMatchSpec(container, 'CHANGE-LIST', { callerAttributes: ['data-test'] });
  });

  it('UIC-CHANGE-LIST-2.1 marks changes in the markup and adds no tab stop', async () => {
    render(<ChangeList changes={changes} variant="detailed" />);
    expect(document.querySelectorAll('del').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('ins').length).toBeGreaterThan(0);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });
});
