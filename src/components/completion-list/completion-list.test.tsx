import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  CompletionList,
  type CompletionListItem,
  type CompletionListProps,
  getCompletionOptionId,
} from './completion-list.js';

const people: CompletionListItem[] = [
  { id: 'maria', label: 'Maria Santos', description: 'Design', kind: 'person' },
  { id: 'jon', label: 'Jon Berg', documentation: 'Field research, Oslo office.' },
  { id: 'team a', label: 'Team A', kind: 'group' },
];

type HarnessProps = Partial<Omit<CompletionListProps, 'anchorRef'>>;

/** An editor stand-in that keeps focus while the list shows. */
function Harness(props: HarnessProps) {
  const anchorRef = useRef<HTMLInputElement>(null);
  const [activeKey, setActiveKey] = useState<Key | null>('maria');
  return (
    <>
      <input ref={anchorRef} aria-label="Message" />
      <CompletionList
        id="people"
        isOpen
        anchorRef={anchorRef}
        items={people}
        activeKey={activeKey}
        onActiveKeyChange={setActiveKey}
        onAction={() => undefined}
        {...props}
      />
    </>
  );
}

/** An editor stand-in that draws its caret marker in a mirror layer beside the focused control. */
function MirrorHarness({ onOpenChange }: Pick<CompletionListProps, 'onOpenChange'>) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  return (
    <section aria-label="Editor">
      <section aria-label="Mirror">
        <span ref={anchorRef} />
      </section>
      <textarea aria-label="Source" />
      <CompletionList
        id="people"
        isOpen
        onOpenChange={onOpenChange}
        anchorRef={anchorRef}
        items={people}
        activeKey="maria"
        onAction={() => undefined}
      />
    </section>
  );
}

describe('CompletionList', () => {
  it('UIC-COMPLETION-LIST-1.2 keeps numeric and text keys distinct through reordering', async () => {
    const items = [
      { id: 1, label: 'Numeric' },
      { id: '1', label: 'Textual' },
    ];
    const { rerender } = render(<Harness items={items} activeKey="1" />);
    const numeric = await screen.findByRole('option', { name: 'Numeric' });
    const textual = screen.getByRole('option', { name: 'Textual' });
    expect(numeric.id).not.toBe(textual.id);
    expect(getCompletionOptionId('people', 'with space')).not.toMatch(/\s/);
    expect(getCompletionOptionId('people', 'with space')).not.toBe(
      getCompletionOptionId('people', 'withspace'),
    );
    expect(document.getElementById(getCompletionOptionId('people', '1'))).toBe(textual);
    expect(textual).toHaveAttribute('aria-selected', 'true');
    rerender(
      <Harness items={[requireDefined(items[1]), requireDefined(items[0])]} activeKey={1} />,
    );
    expect(screen.getAllByRole('option')).toEqual([textual, numeric]);
    expect(numeric).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-COMPLETION-LIST-1.1 UIC-COMPLETION-LIST-1.2 shows the options in a non-modal popover', async () => {
    render(<Harness />);
    await screen.findByRole('listbox');
    const popover = document.querySelector<HTMLElement>('.ui-completion-list');
    expect(popover).not.toHaveAttribute('role', 'dialog');
    expect(popover?.style.zIndex).toBe('130');
    const list = screen.getByRole('listbox', { name: 'Suggestions' });
    expect(list).toHaveAttribute('id', 'people');
    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Maria Santos Design',
      'Jon Berg',
      'Team A',
    ]);
    expect(options[0]).toHaveAccessibleName('Maria Santos Design');
    expect(options[0]).toHaveAttribute('id', getCompletionOptionId('people', 'maria'));
    expect(options[2]).toHaveAttribute('id', getCompletionOptionId('people', 'team a'));
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[0]).toHaveAttribute('data-focused', 'true');
    expect(options[0]).toHaveAttribute('data-kind', 'person');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).not.toHaveAttribute('data-kind');
    expectHooksMatchSpec(document.body, 'COMPLETION-LIST', {
      slots: ['listbox', 'option', 'label', 'description'],
    });
  });

  it('UIC-COMPLETION-LIST-1.1 stays closed while closed or with nothing to show', () => {
    const { rerender } = render(<Harness isOpen={false} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    rerender(<Harness items={[]} />);
    expect(document.querySelector('.ui-completion-list')).toBeNull();
  });

  it('UIC-COMPLETION-LIST-1.2 draws items with renderItem and takes a caller name', async () => {
    render(
      <Harness
        aria-label="People"
        renderItem={(item, { isActive }) => `${item.label}${isActive ? ' (active)' : ''}`}
      />,
    );
    expect(await screen.findByRole('listbox', { name: 'People' })).toBeInTheDocument();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Maria Santos (active)',
      'Jon Berg',
      'Team A',
    ]);
  });

  it('UIC-COMPLETION-LIST-1.3 activates under the pointer and acts on press without taking focus', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Harness onAction={onAction} />);
    const input = screen.getByRole('textbox');
    input.focus();
    const jon = await screen.findByRole('option', { name: 'Jon Berg' });
    await user.hover(jon);
    expect(jon).toHaveAttribute('aria-selected', 'true');
    await user.click(jon);
    expect(onAction).toHaveBeenCalledWith('jon');
    expect(input).toHaveFocus();
  });

  it('UIC-COMPLETION-LIST-1.3 keeps the active option on layout entry until the mouse moves', async () => {
    const user = userEvent.setup();
    const onActiveKeyChange = vi.fn();
    render(<Harness onActiveKeyChange={onActiveKeyChange} />);
    const jon = await screen.findByRole('option', { name: 'Jon Berg' });
    if (typeof globalThis.PointerEvent !== 'undefined') {
      // eslint-disable-next-line testing-library/prefer-user-event -- Layout emits entry beneath a stationary mouse without the move that user.hover includes.
      fireEvent.pointerOver(jon, { pointerType: 'mouse' });
    } else {
      // eslint-disable-next-line testing-library/prefer-user-event -- Simulate the same layout-only entry in the mouse fallback.
      fireEvent.mouseOver(jon);
    }
    expect(onActiveKeyChange).not.toHaveBeenCalled();
    expect(screen.getByRole('option', { name: 'Maria Santos Design' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.hover(jon);
    expect(onActiveKeyChange).toHaveBeenCalledExactlyOnceWith('jon');
  });

  it('UIC-COMPLETION-LIST-1.3 acts only on a press released over the option, and a touch does not hover', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Harness onAction={onAction} />);
    const input = screen.getByRole('textbox');
    input.focus();
    const jon = await screen.findByRole('option', { name: 'Jon Berg' });
    await user.pointer([
      { keys: '[MouseLeft>]', target: jon },
      { target: document.body },
      { keys: '[/MouseLeft]' },
    ]);
    expect(onAction).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    const team = screen.getByRole('option', { name: 'Team A' });
    await user.pointer({ keys: '[TouchA]', target: team });
    expect(onAction).toHaveBeenCalledWith('team a');
    expect(team).toHaveAttribute('aria-selected', 'false');
    expect(input).toHaveFocus();
  });

  it('UIC-COMPLETION-LIST-1.4 shows the active documentation, an empty state and a footer', async () => {
    const { rerender } = render(<Harness activeKey="jon" footer="3 matches" />);
    const jon = await screen.findByRole('option', { name: 'Jon Berg' });
    const documentation = document.querySelector('.ui-completion-list__documentation');
    expect(documentation).toHaveTextContent('Field research, Oslo office.');
    expect(jon).toHaveAccessibleDescription('Field research, Oslo office.');
    expect(document.querySelector('.ui-completion-list__footer')).toHaveTextContent('3 matches');
    expectHooksMatchSpec(document.body, 'COMPLETION-LIST', { slots: ['documentation', 'footer'] });
    rerender(<Harness items={[]} renderEmptyState={() => 'No people found'} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    const empty = screen.getByRole('status');
    expect(empty).toHaveTextContent('No people found');
    expect(empty).toHaveAttribute('id', 'people');
    expectHooksMatchSpec(document.body, 'COMPLETION-LIST', { slots: ['empty'] });
  });

  it('UIC-COMPLETION-LIST-1.5 puts the class and data attributes on the popover and the id on the list', async () => {
    render(<Harness className="caller" data-testid="probe" />);
    await screen.findByRole('listbox');
    const popover = document.querySelector('.ui-completion-list');
    expect(popover).toHaveClass('caller');
    expect(popover).toHaveAttribute('data-testid', 'probe');
    expect(popover).not.toHaveAttribute('id', 'people');
    expect(screen.getByRole('listbox')).toHaveAttribute('id', 'people');
    expectHooksMatchSpec(document.body, 'COMPLETION-LIST', { callerAttributes: ['data-testid'] });
  });

  it('UIC-COMPLETION-LIST-1.1 stays open while a mirror layer scrolls and closes when the editor scrolls', async () => {
    const onOpenChange = vi.fn();
    render(<MirrorHarness onOpenChange={onOpenChange} />);
    await screen.findByRole('listbox');
    screen.getByRole('textbox', { name: 'Source' }).focus();
    fireEvent.scroll(screen.getByRole('region', { name: 'Mirror' }));
    expect(onOpenChange).not.toHaveBeenCalled();
    // The hold ends with the mirror's scroll.
    await new Promise((resolve) => setTimeout(resolve));
    fireEvent.scroll(screen.getByRole('region', { name: 'Editor' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
