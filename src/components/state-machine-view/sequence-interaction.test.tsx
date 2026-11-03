import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import {
  StateMachineView,
  type StateMachineContextMenuEvent,
  type StateMachineState,
  type StateMachineTransition,
  type StateMachineViewProps,
} from './state-machine-view.js';

const draft: StateMachineState = { id: 'draft', label: 'Draft' };
const approved: StateMachineState = { id: 'approved', label: 'Approved' };
const states: StateMachineState[] = [draft, { id: 'review', label: 'Review' }, approved];

const transitions: StateMachineTransition[] = [
  { id: 'submit', from: 'draft', to: 'review', label: 'Submit' },
  { id: 'approve', from: 'review', to: 'approved', label: 'Approve' },
];

function Sequence(props: Partial<StateMachineViewProps>) {
  return (
    <StateMachineView
      presentation="sequence"
      aria-label="Lifecycle"
      states={states}
      transitions={transitions}
      {...props}
    />
  );
}

describe('StateMachineView sequence activation and selection', () => {
  it('UIC-STATE-MACHINE-VIEW-5.1 activates on every press and Enter or Space, apart from selection', async () => {
    const user = userEvent.setup();
    const onStateAction = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <Sequence
        currentKey="review"
        selectedKey="review"
        onStateAction={onStateAction}
        onSelectionChange={onSelectionChange}
      />,
    );
    const review = screen.getByRole('button', { name: 'Review' });
    await user.click(review);
    await user.click(review);
    expect(onStateAction).toHaveBeenCalledTimes(2);
    expect(onStateAction).toHaveBeenLastCalledWith(
      'review',
      states[1],
      expect.objectContaining({ pointerType: 'mouse' }),
    );
    expect(onSelectionChange).not.toHaveBeenCalled();

    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onStateAction).toHaveBeenCalledTimes(4);
    expect(onStateAction).toHaveBeenLastCalledWith(
      'review',
      states[1],
      expect.objectContaining({ pointerType: 'keyboard' }),
    );

    await user.click(screen.getByRole('button', { name: 'Draft' }));
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('draft');
    expect(review).toHaveAttribute('aria-current', 'step');
  });

  it('UIC-STATE-MACHINE-VIEW-5.1 keeps highlights under the owner, which may decline a change', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const onTransitionSelectionChange = vi.fn();
    const { rerender } = render(
      <Sequence
        selectedKey="draft"
        selectedTransitionKey={null}
        onSelectionChange={onSelectionChange}
        onTransitionSelectionChange={onTransitionSelectionChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Approved' }));
    expect(onSelectionChange).toHaveBeenCalledWith('approved');
    expect(screen.getByRole('button', { name: 'Draft' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Approved' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onTransitionSelectionChange).toHaveBeenCalledWith('approve');
    expect(screen.getByRole('button', { name: 'Approve' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    rerender(<Sequence selectedKey={null} selectedTransitionKey="approve" />);
    expect(screen.getByRole('button', { name: 'Draft' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Approve' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('UIC-STATE-MACHINE-VIEW-5.1 keeps numeric and text keys and the two key spaces apart', async () => {
    const user = userEvent.setup();
    const onStateAction = vi.fn();
    const onTransitionAction = vi.fn();
    render(
      <Sequence
        states={[
          { id: 1, label: 'Number' },
          { id: '1', label: 'Text' },
        ]}
        transitions={[{ id: 1, from: 1, to: '1', label: 'Step' }]}
        selectedKey="1"
        selectedTransitionKey="1"
        onStateAction={onStateAction}
        onTransitionAction={onTransitionAction}
      />,
    );
    expect(screen.getByRole('button', { name: 'Number' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Text' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Step' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'Number' }));
    expect(onStateAction.mock.calls[0]?.[0]).toBe(1);
    await user.click(screen.getByRole('button', { name: 'Step' }));
    expect(onTransitionAction.mock.calls[0]?.[0]).toBe(1);
  });
});

describe('StateMachineView sequence keyboard navigation', () => {
  it('UIC-STATE-MACHINE-VIEW-5.2 gives the states one tab stop and moves with arrows, Home and End', async () => {
    const user = userEvent.setup();
    const onStateAction = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <Sequence
        states={[...states, { id: 'archived', label: 'Archived', isDisabled: true }]}
        currentKey="review"
        onStateAction={onStateAction}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Review' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Approved' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Approved' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Draft' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Approved' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Review' })).toHaveFocus();
    expect(onStateAction).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Review' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Archived' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Archived' })).toHaveAttribute(
      'data-disabled',
      'true',
    );
  });

  it('UIC-STATE-MACHINE-VIEW-5.2 recovers focus when the focused state is removed or disabled', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Sequence currentKey="review" />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Review' })).toHaveFocus();

    rerender(<Sequence states={[draft, approved]} currentKey="review" />);
    expect(screen.getByRole('button', { name: 'Approved' })).toHaveFocus();

    rerender(<Sequence states={[draft, { ...approved, isDisabled: true }]} />);
    expect(screen.getByRole('button', { name: 'Draft' })).toHaveFocus();

    const root = screen.getByRole('group', { name: 'Lifecycle' });
    rerender(<Sequence states={[]} />);
    expect(screen.getByRole('note', { name: 'No states' })).toHaveFocus();
    expect(screen.getByRole('group', { name: 'Lifecycle' })).toBe(root);
  });
});

describe('StateMachineView sequence selection reconciliation', () => {
  it('UIC-STATE-MACHINE-VIEW-5.3 releases a removed or disabled selection once', () => {
    const onSelectionChange = vi.fn();
    const onTransitionSelectionChange = vi.fn();
    const props = {
      selectedKey: 'review',
      selectedTransitionKey: 'approve',
      onSelectionChange,
      onTransitionSelectionChange,
    };
    const { rerender } = render(<Sequence {...props} />);
    expect(onSelectionChange).not.toHaveBeenCalled();

    const disabled = states.map((state) =>
      state.id === 'review' ? { ...state, isDisabled: true } : state,
    );
    rerender(<Sequence {...props} states={disabled} transitions={transitions.slice(0, 1)} />);
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(null);
    expect(onTransitionSelectionChange).toHaveBeenCalledExactlyOnceWith(null);
    expect(screen.getByRole('button', { name: 'Review' })).not.toHaveAttribute('data-selected');

    rerender(<Sequence {...props} states={disabled} transitions={[]} />);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-STATE-MACHINE-VIEW-5.3 leaves a selection made ahead of its data alone', () => {
    const onSelectionChange = vi.fn();
    function Host() {
      const [items, setItems] = useState<StateMachineState[]>([]);
      const [selectedKey, setSelectedKey] = useState<Key | null>('review');
      return (
        <>
          <button type="button" onClick={() => setItems(states)}>
            Load
          </button>
          <Sequence
            states={items}
            selectedKey={selectedKey}
            onSelectionChange={(key) => {
              onSelectionChange(key);
              setSelectedKey(key);
            }}
          />
        </>
      );
    }
    render(<Host />);
    act(() => screen.getByRole('button', { name: 'Load' }).click());
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Review' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('StateMachineView sequence context menus', () => {
  it('UIC-STATE-MACHINE-VIEW-5.4 sends typed pointer and keyboard requests with anchors', async () => {
    const user = userEvent.setup();
    const onStateContextMenu = vi.fn(
      (...[, , event]: [Key, StateMachineState, StateMachineContextMenuEvent]) => {
        event.preventDefault();
      },
    );
    const onTransitionContextMenu = vi.fn();
    const onBackgroundContextMenu = vi.fn();
    render(
      <Sequence
        onStateContextMenu={onStateContextMenu}
        onTransitionContextMenu={onTransitionContextMenu}
        onBackgroundContextMenu={onBackgroundContextMenu}
      />,
    );
    const draft = screen.getByRole('button', { name: 'Draft' });
    const pointer = fireEvent.contextMenu(draft, { clientX: 12, clientY: 34 });
    expect(pointer).toBe(false);
    expect(onStateContextMenu).toHaveBeenLastCalledWith(
      'draft',
      states[0],
      expect.objectContaining({ anchor: { x: 12, y: 34 }, target: draft, pointerType: 'mouse' }),
    );

    await user.tab();
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(onStateContextMenu).toHaveBeenLastCalledWith(
      'draft',
      states[0],
      expect.objectContaining({ anchor: draft, pointerType: 'keyboard' }),
    );
    // The browser's follow-up event for the key is kept away, not dispatched again.
    expect(fireEvent.contextMenu(draft)).toBe(false);
    expect(onStateContextMenu).toHaveBeenCalledTimes(2);

    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(fireEvent.contextMenu(submit)).toBe(true);
    expect(onTransitionContextMenu).toHaveBeenLastCalledWith(
      'submit',
      transitions[0],
      expect.objectContaining({ target: submit }),
    );
    expect(onBackgroundContextMenu).not.toHaveBeenCalled();
  });

  it('UIC-STATE-MACHINE-VIEW-5.4 sends background requests only from the background', () => {
    const onBackgroundContextMenu = vi.fn();
    const { container } = render(<Sequence onBackgroundContextMenu={onBackgroundContextMenu} />);
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Review' }));
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Submit' }));
    expect(onBackgroundContextMenu).not.toHaveBeenCalled();
    const content = container.querySelector('.ui-state-machine-view__content');
    expect(fireEvent.contextMenu(content ?? document.body, { clientX: 5, clientY: 6 })).toBe(true);
    expect(onBackgroundContextMenu).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ anchor: { x: 5, y: 6 } }),
    );
  });
});
