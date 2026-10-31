import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '../../core/locales/index.js';
import type * as messageFormat from '../../core/message-format.js';
import { formatMessage } from '../../core/message-format.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { MergeView } from './merge-view.js';

vi.mock('../../core/message-format.js', async (importOriginal) => {
  const actual = await importOriginal<typeof messageFormat>();
  return { ...actual, formatMessage: vi.fn(actual.formatMessage) };
});

const base = ['flour', 'sugar', 'eggs', 'milk', 'salt', 'bake'].join('\n');
const ours = ['flour', 'brown sugar', 'eggs', 'oat milk', 'salt', 'bake'].join('\n');
const theirs = ['flour', 'sugar', 'eggs', 'cream', 'butter', 'salt', 'bake hot'].join('\n');

const side = (container: HTMLElement, name: string) =>
  requireDefined(container.querySelector<HTMLElement>(`.ui-merge-view__side[data-side="${name}"]`));
const viewport = (container: HTMLElement, name: string) =>
  requireDefined(side(container, name).querySelector<HTMLElement>('.ui-scroll-region__viewport'));
const lineTexts = (scope: Element) =>
  [...scope.querySelectorAll('.ui-merge-view__line .ui-merge-view__content')].map(
    (cell) => cell.textContent,
  );

afterEach(() => {
  vi.restoreAllMocks();
});

// Full field and button trees driven by userEvent are slow in jsdom on a busy machine.
describe('MergeView', { timeout: 15_000 }, () => {
  it('UIC-MERGE-VIEW-1.1 draws our side, the base, their side and the result as named panes', () => {
    const { container, rerender } = render(
      <MergeView aria-label="Recipe merge" base={base} ours={ours} theirs={theirs} />,
    );
    const root = screen.getByRole('group', { name: 'Recipe merge' });
    expect(root).toHaveClass('ui-merge-view');
    expect(root).toHaveAttribute('data-show-base', 'true');
    const sides = requireDefined(container.querySelector('.ui-merge-view__sides'));
    expect(
      [...sides.querySelectorAll('.ui-merge-view__side')].map((pane) =>
        pane.getAttribute('data-side'),
      ),
    ).toEqual(['ours', 'base', 'theirs']);
    expect(side(container, 'result').parentElement).toBe(root);
    for (const name of ['Ours', 'Base', 'Theirs', 'Result']) {
      const pane = screen.getByRole('group', { name });
      expect(pane).toHaveAttribute('tabindex', '0');
      expect(pane).toHaveClass('ui-scroll-region__viewport');
    }
    rerender(
      <MergeView
        base={base}
        ours={ours}
        theirs={theirs}
        oursLabel="Mine"
        theirsLabel="Shared"
        showBase={false}
      />,
    );
    expect(root).not.toHaveAttribute('data-show-base');
    expect(container.querySelector('.ui-merge-view__side[data-side="base"]')).toBeNull();
    expect(screen.getByRole('group', { name: 'Mine' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Take Shared' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'MERGE-VIEW', {
      slots: ['header', 'sides', 'side', 'title', 'pane'],
    });
  });

  it('UIC-MERGE-VIEW-1.2 UIC-MERGE-VIEW-4.1 draws each side by chunk, padded to level rows', () => {
    const { container } = render(<MergeView base={base} ours={ours} theirs={theirs} />);
    const oursPane = side(container, 'ours');
    const chunks = [...oursPane.querySelectorAll('.ui-merge-view__chunk')];
    expect(chunks.map((chunk) => chunk.getAttribute('data-kind'))).toEqual([
      'unchanged',
      'ours',
      'unchanged',
      'conflict',
      'unchanged',
      'theirs',
    ]);
    expect(requireDefined(chunks[3]).tagName).toBe('TBODY');
    expect(lineTexts(oursPane)).toEqual([
      'flour',
      'brown sugar',
      'eggs',
      'oat milk',
      'salt',
      'bake',
    ]);
    expect(lineTexts(side(container, 'theirs'))).toEqual([
      'flour',
      'sugar',
      'eggs',
      'cream',
      'butter',
      'salt',
      'bake hot',
    ]);
    const conflictRows = [...requireDefined(chunks[3]).querySelectorAll('tr')];
    expect(conflictRows.map((row) => row.className)).toEqual([
      'ui-merge-view__line',
      'ui-merge-view__filler',
    ]);
    expect(conflictRows[1]).toHaveAttribute('aria-hidden', 'true');
    const oatMilk = requireDefined(conflictRows[0]);
    expect(oatMilk).toHaveAttribute('data-change', 'conflict');
    expect(oatMilk.querySelector('.ui-merge-view__number')).toHaveTextContent('4');
    expect(oatMilk.querySelector('.ui-merge-view__number span')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(oatMilk.querySelector('.ui-merge-view__marker')).toHaveTextContent('!Conflict, line 4');
    const changes = (name: string) =>
      [...side(container, name).querySelectorAll('.ui-merge-view__line')].map((row) =>
        row.getAttribute('data-change'),
      );
    expect(changes('ours').slice(0, 2)).toEqual(['unchanged', 'changed']);
    expect(changes('base').slice(0, 2)).toEqual(['unchanged', 'changed']);
    expect(changes('theirs').slice(0, 2)).toEqual(['unchanged', 'unchanged']);
    expect(side(container, 'base').querySelector('.ui-merge-view__marker')).toHaveTextContent(
      'Line 1',
    );
    expectHooksMatchSpec(container, 'MERGE-VIEW', {
      slots: ['table', 'chunk', 'line', 'filler', 'number', 'marker', 'content'],
    });
  });

  it('UIC-MERGE-VIEW-1.3 keeps the panes level at each chunk', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const scroller = this.closest<HTMLElement>('.ui-scroll-region__viewport');
      if (!scroller || this === scroller) return { top: 0 } as DOMRect;
      const items = [...scroller.querySelectorAll('.ui-merge-view__chunk, .ui-merge-view__block')];
      const isResult = scroller.querySelector('.ui-merge-view__block') !== null;
      return { top: items.indexOf(this) * (isResult ? 40 : 20) - scroller.scrollTop } as DOMRect;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(1000);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
    const { container } = render(<MergeView base={base} ours={ours} theirs={theirs} />);
    const oursViewport = viewport(container, 'ours');
    oursViewport.scrollTop = 50;
    fireEvent.scroll(oursViewport);
    expect(viewport(container, 'theirs').scrollTop).toBe(50);
    expect(viewport(container, 'result').scrollTop).toBe(100);
  });

  it('UIC-MERGE-VIEW-2.1 UIC-MERGE-VIEW-2.2 shows clean chunks merged and conflicts with markers', () => {
    const { container } = render(<MergeView base={base} ours={ours} theirs={theirs} />);
    const blocks = [...container.querySelectorAll<HTMLElement>('.ui-merge-view__block')];
    expect(blocks.map((block) => block.getAttribute('data-kind'))).toEqual([
      'unchanged',
      'ours',
      'unchanged',
      'conflict',
      'unchanged',
      'theirs',
    ]);
    expect(requireDefined(blocks[1]).querySelector('pre.ui-merge-view__text')).toHaveTextContent(
      'brown sugar',
    );
    expect(blocks[5]).toHaveTextContent('bake hot');
    const conflict = screen.getByRole('group', { name: 'Conflict 1 of 1' });
    expect(conflict).toBe(blocks[3]);
    expect(conflict).toHaveAttribute('data-resolution', 'unresolved');
    expect(conflict.querySelector('.ui-merge-view__resolution')).toHaveTextContent('Unresolved');
    const takes = within(conflict).getAllByRole('button');
    expect(takes.map((button) => [button.textContent, button.getAttribute('data-take')])).toEqual([
      ['Take Ours', 'ours'],
      ['Take Theirs', 'theirs'],
      ['Take both', 'both'],
      ['Take Base', 'base'],
    ]);
    expect(takes[0]).toHaveClass('ui-button', 'ui-merge-view__take');
    const editor = within(conflict).getByRole('textbox', { name: 'Result of conflict 1' });
    expect(editor).toHaveValue(
      ['<<<<<<< Ours', 'oat milk', '=======', 'cream', 'butter', '>>>>>>> Theirs'].join('\n'),
    );
    expect(editor.closest('.ui-merge-view__editor')).toHaveClass('ui-text-field');
    expectHooksMatchSpec(container, 'MERGE-VIEW', {
      slots: [
        'blocks',
        'block',
        'text',
        'conflict-header',
        'conflict-title',
        'resolution',
        'actions',
        'take',
        'editor',
      ],
    });
  });

  it('UIC-MERGE-VIEW-2.3 UIC-MERGE-VIEW-2.5 takes a side and reports the result', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MergeView base={`${base}\n`} ours={`${ours}\n`} theirs={theirs} onChange={onChange} />);
    const conflict = screen.getByRole('group', { name: 'Conflict 1 of 1' });
    const editor = within(conflict).getByRole('textbox');
    await user.click(within(conflict).getByRole('button', { name: 'Take Theirs' }));
    expect(editor).toHaveValue('cream\nbutter');
    expect(conflict).toHaveAttribute('data-resolution', 'theirs');
    expect(conflict.querySelector('.ui-merge-view__resolution')).toHaveTextContent('Resolved');
    expect(onChange).toHaveBeenLastCalledWith({
      text: 'flour\nbrown sugar\neggs\ncream\nbutter\nsalt\nbake hot\n',
      resolutions: ['theirs'],
      unresolved: 0,
    });
    await user.click(within(conflict).getByRole('button', { name: 'Take both' }));
    expect(editor).toHaveValue('oat milk\ncream\nbutter');
    await user.click(within(conflict).getByRole('button', { name: 'Take Base' }));
    expect(editor).toHaveValue('milk');
    await user.click(within(conflict).getByRole('button', { name: 'Take Ours' }));
    expect(editor).toHaveValue('oat milk');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ resolutions: ['ours'] }));
  });

  it('UIC-MERGE-VIEW-2.4 UIC-MERGE-VIEW-2.5 resolves a conflict by editing its result', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <MergeView base={base} ours={ours} theirs={theirs} onChange={onChange} />,
    );
    const conflict = screen.getByRole('group', { name: 'Conflict 1 of 1' });
    const editor = within(conflict).getByRole('textbox');
    await user.clear(editor);
    await user.type(editor, 'whole milk');
    expect(conflict).toHaveAttribute('data-resolution', 'edited');
    expect(onChange).toHaveBeenLastCalledWith({
      text: 'flour\nbrown sugar\neggs\nwhole milk\nsalt\nbake hot',
      resolutions: ['edited'],
      unresolved: 0,
    });
    rerender(<MergeView base={base} ours={ours} theirs={`${theirs}\nserve`} onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Conflict 1 of 1' })).toHaveAttribute(
      'data-resolution',
      'unresolved',
    );
  });

  it('UIC-MERGE-VIEW-2.5 starts conflict editors over, undo history included, when a text changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const merges = {
      base: { base: 'Base B', ours: 'Ours A', theirs: 'Theirs A' },
      ours: { base: 'Base A', ours: 'Ours B', theirs: 'Theirs A' },
      theirs: { base: 'Base A', ours: 'Ours A', theirs: 'Theirs B' },
      all: { base: 'Base B', ours: 'Ours B', theirs: 'Theirs B' },
    };
    for (const next of Object.values(merges)) {
      const { rerender, unmount } = render(
        <MergeView base="Base A" ours="Ours A" theirs="Theirs A" onChange={onChange} />,
      );
      await user.click(screen.getByRole('button', { name: 'Take Ours' }));
      expect(screen.getByRole('textbox')).toHaveValue('Ours A');
      rerender(<MergeView {...next} onChange={onChange} />);
      onChange.mockClear();
      const conflict = screen.getByRole('group', { name: 'Conflict 1 of 1' });
      const editor = within(conflict).getByRole('textbox');
      const fresh = (editor as HTMLTextAreaElement).value;
      await user.click(editor);
      await user.keyboard('{Control>}z{/Control}');
      expect(editor).toHaveValue(fresh);
      expect(conflict).toHaveAttribute('data-resolution', 'unresolved');
      expect(onChange).not.toHaveBeenCalled();
      unmount();
    }
  });

  it('UIC-MERGE-VIEW-2.5 starts over when the number or order of conflicts changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <MergeView base="Base A" ours="Ours A" theirs="Theirs A" onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: 'Take Theirs' }));
    const two = ['a', 'b', 'c'].join('\n');
    rerender(
      <MergeView
        base={two}
        ours={['x', 'b', 'y'].join('\n')}
        theirs={['z', 'b', 'w'].join('\n')}
        onChange={onChange}
      />,
    );
    onChange.mockClear();
    for (const name of ['Conflict 1 of 2', 'Conflict 2 of 2']) {
      const conflict = screen.getByRole('group', { name });
      expect(conflict).toHaveAttribute('data-resolution', 'unresolved');
      await user.click(within(conflict).getByRole('textbox'));
      await user.keyboard('{Control>}z{/Control}');
      expect(conflict).toHaveAttribute('data-resolution', 'unresolved');
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-MERGE-VIEW-2.4 undoes takes and edits within one merge, and keeps them on other rerenders', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <MergeView base={base} ours={ours} theirs={theirs} onChange={onChange} />,
    );
    const conflict = screen.getByRole('group', { name: 'Conflict 1 of 1' });
    const editor = within(conflict).getByRole('textbox');
    await user.click(within(conflict).getByRole('button', { name: 'Take Ours' }));
    await user.type(editor, '!');
    expect(editor).toHaveValue('oat milk!');
    await user.keyboard('{Control>}z{/Control}');
    expect(editor).toHaveValue('oat milk');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ unresolved: 0 }));
    rerender(
      <MergeView base={base} ours={ours} theirs={theirs} oursLabel="Mine" onChange={() => {}} />,
    );
    const kept = screen.getByRole('group', { name: 'Conflict 1 of 1' });
    expect(within(kept).getByRole('textbox')).toBe(editor);
    expect(editor).toHaveValue('oat milk');
    expect(kept).not.toHaveAttribute('data-resolution', 'unresolved');
  });

  it('UIC-MERGE-VIEW-2.4 does not redraw the input sides while a result is typed', async () => {
    const user = userEvent.setup();
    const drawsLine = () =>
      vi.mocked(formatMessage).mock.calls.some(([message]) => message === en.mergeViewLine);
    render(<MergeView base={base} ours={ours} theirs={theirs} />);
    const editor = within(
      screen.getByRole('group', { name: 'Conflict 1 of 1' }),
    ).getByRole<HTMLTextAreaElement>('textbox');
    await user.type(editor, 'x');
    vi.mocked(formatMessage).mockClear();
    await user.type(editor, 'yz');
    expect(editor.value).toMatch(/xyz$/);
    expect(drawsLine()).toBe(false);
  });

  it('UIC-MERGE-VIEW-3.1 counts the unresolved conflicts', async () => {
    const user = userEvent.setup();
    const twice = ['flour', 'sugar', 'milk'].join('\n');
    const { container, rerender } = render(
      <MergeView
        base={twice}
        ours={'flour\nSUGAR\nmilk\nsalt'}
        theirs={'flour\nsyrup\nmilk\nhoney'}
      />,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveClass('ui-merge-view__status');
    expect(status).toHaveTextContent('2 of 2 conflicts unresolved');
    await user.click(requireDefined(screen.getAllByRole('button', { name: 'Take Ours' })[0]));
    expect(status).toHaveTextContent('1 of 2 conflicts unresolved');
    await user.click(requireDefined(screen.getAllByRole('button', { name: 'Take Theirs' })[1]));
    expect(status).toHaveTextContent('All 2 conflicts resolved');
    rerender(<MergeView base={base} ours={ours} theirs={base} />);
    expect(status).toHaveTextContent('No conflicts');
    expectHooksMatchSpec(container, 'MERGE-VIEW', { slots: ['status'] });
  });

  it('UIC-MERGE-VIEW-3.2 moves between conflicts and marks the current one', async () => {
    const user = userEvent.setup();
    const twice = ['flour', 'sugar', 'milk'].join('\n');
    const { container, rerender } = render(
      <MergeView
        base={twice}
        ours={'flour\nSUGAR\nmilk\nsalt'}
        theirs={'flour\nsyrup\nmilk\nhoney'}
      />,
    );
    const previous = screen.getByRole('button', { name: 'Previous conflict' });
    const next = screen.getByRole('button', { name: 'Next conflict' });
    expect(previous).toHaveClass('ui-button', 'ui-merge-view__previous');
    expect(next).toHaveClass('ui-merge-view__next');
    expect(previous).toBeDisabled();
    await user.click(next);
    expect(screen.getByRole('textbox', { name: 'Result of conflict 1' })).toHaveFocus();
    const current = () =>
      [...container.querySelectorAll('[data-current]')].map(
        (element) => `${element.className}:${element.getAttribute('data-kind')}`,
      );
    expect(current()).toEqual([
      'ui-merge-view__chunk:conflict',
      'ui-merge-view__chunk:conflict',
      'ui-merge-view__chunk:conflict',
      'ui-merge-view__block:conflict',
    ]);
    await user.click(next);
    expect(screen.getByRole('textbox', { name: 'Result of conflict 2' })).toHaveFocus();
    expect(next).toBeDisabled();
    await user.click(previous);
    expect(screen.getByRole('textbox', { name: 'Result of conflict 1' })).toHaveFocus();
    await user.click(requireDefined(screen.getAllByRole('button', { name: 'Take Theirs' })[1]));
    expect(screen.getByRole('group', { name: 'Conflict 2 of 2' })).toHaveAttribute(
      'data-current',
      'true',
    );
    rerender(<MergeView base={base} ours={ours} theirs={base} />);
    expect(container.querySelector('[data-current]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Next conflict' })).toBeDisabled();
    expectHooksMatchSpec(container, 'MERGE-VIEW', { slots: ['navigation', 'previous', 'next'] });
  });

  it('UIC-MERGE-VIEW-4.2 forwards ref to its root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<MergeView base={base} ours={ours} theirs={theirs} ref={ref} />);
    expect(ref.current).toBe(container.querySelector('.ui-merge-view'));
  });

  it('UIC-MERGE-VIEW-4.2 forwards the class name, id and caller data attributes', () => {
    const { container } = render(
      <MergeView
        base={base}
        ours={ours}
        theirs={theirs}
        className="recipe"
        id="merge"
        data-testid="merge-view"
        aria-describedby="hint"
      />,
    );
    const root = requireDefined(container.firstElementChild);
    expect(root).toHaveClass('ui-merge-view', 'recipe');
    expect(root).toHaveAttribute('id', 'merge');
    expect(root).toHaveAttribute('data-testid', 'merge-view');
    expect(root).toHaveAttribute('aria-describedby', 'hint');
    expectHooksMatchSpec(container, 'MERGE-VIEW', { callerAttributes: ['data-testid'] });
  });
});
