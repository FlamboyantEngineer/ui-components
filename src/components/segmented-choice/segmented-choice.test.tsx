import { DragHandleGlyph, FitPageGlyph, SortAscendingGlyph } from '../../core/glyphs.js';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { I18nProvider } from '../../primitives/index.js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { SegmentedChoice, type SegmentedChoiceOption } from './segmented-choice.js';

const views: SegmentedChoiceOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

beforeAll(() => {
  // React Aria's selection indicator waits for animations, which jsdom does not implement.
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('SegmentedChoice', () => {
  it('UIC-SEGMENTED-CHOICE-1.1 renders one named segment per option and marks the value', () => {
    const { container } = render(
      <SegmentedChoice aria-label="View" options={views} value="week" />,
    );
    const group = screen.getByRole('radiogroup', { name: 'View' });
    const segments = screen.getAllByRole('radio');
    expect(segments.map((segment) => segment.textContent)).toEqual(['Day', 'Week', 'Month']);
    for (const segment of segments) {
      expect(segment.tagName).toBe('BUTTON');
      expect(segment).toHaveClass('ui-segmented-choice__segment');
    }
    expect(screen.getByRole('radio', { name: 'Week' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('data-selected', 'true');
    expect(screen.getByRole('radio', { name: 'Day' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('data-value', 'month');
    expect(group).not.toHaveAttribute('data-inherited');
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE', { slots: ['segment', 'label'] });
  });

  it('UIC-SEGMENTED-CHOICE-1.1 reports picks and selects them when uncontrolled', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedChoice aria-label="View" options={views} defaultValue="day" onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Month' }));
    expect(onChange).toHaveBeenLastCalledWith('month');
    expect(screen.getByRole('radio', { name: 'Month' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Day' })).not.toBeChecked();
  });

  it('UIC-SEGMENTED-CHOICE-1.1 follows the controlled value and selects nothing for null', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SegmentedChoice aria-label="View" options={views} value={null} onChange={onChange} />,
    );
    for (const segment of screen.getAllByRole('radio')) {
      expect(segment).toHaveAttribute('aria-checked', 'false');
    }
    await userEvent.click(screen.getByRole('radio', { name: 'Day' }));
    expect(onChange).toHaveBeenCalledWith('day');
    expect(screen.getByRole('radio', { name: 'Day' })).not.toBeChecked();
    rerender(<SegmentedChoice aria-label="View" options={views} value="day" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Day' })).toBeChecked();
  });

  it('UIC-SEGMENTED-CHOICE-1.2 draws decorative icons and names segments by label alone', () => {
    const { container } = render(
      <SegmentedChoice
        aria-label="Order"
        value="up"
        options={[
          { value: 'up', label: 'Ascending', icon: SortAscendingGlyph },
          { value: 'down', label: 'Descending', icon: <svg className="custom-glyph" /> },
          { value: 'none', label: 'Unsorted' },
        ]}
      />,
    );
    const up = screen.getByRole('radio', { name: 'Ascending' });
    const icon = up.querySelector('.ui-segmented-choice__icon');
    expect(icon).toHaveClass('ui-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('data-size', 'md');
    expect(container.querySelector('.custom-glyph')?.parentElement).toHaveClass(
      'ui-segmented-choice__icon',
    );
    const unsorted = screen.getByRole('radio', { name: 'Unsorted' });
    expect(unsorted.querySelector('.ui-segmented-choice__icon')).toBeNull();
    expect(container.querySelector('[role="img"]')).toBeNull();
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE', {
      slots: ['segment', 'indicator', 'icon', 'label'],
    });
  });

  it('UIC-SEGMENTED-CHOICE-1.3 publishes size, sizing and label text with defaults', () => {
    const { container, rerender } = render(<SegmentedChoice aria-label="View" options={views} />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-size', 'md');
    expect(group).toHaveAttribute('data-sizing', 'equal');
    expect(container.querySelector('.ui-segmented-choice__label')).toHaveAttribute(
      'data-label',
      'Day',
    );
    for (const size of ['sm', 'md', 'lg'] as const) {
      for (const sizing of ['equal', 'content'] as const) {
        rerender(<SegmentedChoice aria-label="View" options={views} size={size} sizing={sizing} />);
        expect(group).toHaveAttribute('data-size', size);
        expect(group).toHaveAttribute('data-sizing', sizing);
        expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');
      }
    }
  });

  it('UIC-SEGMENTED-CHOICE-1.4 lays out vertically and moves focus with the vertical arrows', async () => {
    const { container } = render(
      <SegmentedChoice aria-label="View" options={views} orientation="vertical" />,
    );
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    expect(group).toHaveAttribute('aria-orientation', 'vertical');
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveFocus();
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');
  });

  it('UIC-SEGMENTED-CHOICE-1.5 appends the caller class and forwards id, ref, aria and data attributes', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <>
        <p id="hint">Applies to every page</p>
        <SegmentedChoice
          aria-label="View"
          aria-describedby="hint"
          options={views}
          className="caller"
          id="view"
          ref={ref}
          data-sample="probe"
          data-size="caller"
        />
      </>,
    );
    const group = screen.getByRole('radiogroup', { name: 'View' });
    expect(group).toHaveClass('ui-segmented-choice', 'caller');
    expect(group).toHaveAttribute('id', 'view');
    expect(group).toHaveAttribute('data-size', 'md');
    expect(group).toHaveAttribute('data-sample', 'probe');
    expect(group).toHaveAccessibleDescription('Applies to every page');
    expect(ref.current).toBe(group);
    expectHooksMatchSpec(document.body, 'SEGMENTED-CHOICE', { callerAttributes: ['data-sample'] });
  });

  it('UIC-SEGMENTED-CHOICE-2.1 is one tab stop with arrow-key focus and Space or Enter to pick', async () => {
    const onChange = vi.fn();
    render(
      <>
        <button type="button">Before</button>
        <SegmentedChoice aria-label="View" options={views} defaultValue="day" onChange={onChange} />
        <button type="button">After</button>
      </>,
    );
    screen.getByRole('button', { name: 'Before' }).focus();
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith('week');
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('month');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('UIC-SEGMENTED-CHOICE-2.1 mirrors the arrow keys in right-to-left locales', async () => {
    render(
      <I18nProvider locale="ar-EG">
        <SegmentedChoice aria-label="View" options={views} />
      </I18nProvider>,
    );
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveFocus();
  });

  it('UIC-SEGMENTED-CHOICE-2.2 keeps, clears or confirms the value when the selected segment is picked again', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SegmentedChoice aria-label="View" options={views} value="week" onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Week' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Week' })).toBeChecked();

    rerender(
      <SegmentedChoice
        aria-label="View"
        options={views}
        value="week"
        isClearable
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Week' }));
    expect(onChange).toHaveBeenLastCalledWith(null);

    rerender(
      <SegmentedChoice
        aria-label="View"
        options={views}
        value="week"
        isClearable
        isInherited
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Week' }));
    expect(onChange).toHaveBeenLastCalledWith('week');
  });

  it('UIC-SEGMENTED-CHOICE-2.2 UIC-SEGMENTED-CHOICE-2.3 overrides an inherited value and clears back to it', async () => {
    function Setting() {
      const inherited = 'day';
      const [explicit, setExplicit] = useState<string | null>(null);
      return (
        <SegmentedChoice
          aria-label="View"
          options={views}
          value={explicit ?? inherited}
          isInherited={explicit === null}
          isClearable
          onChange={setExplicit}
        />
      );
    }
    const { container } = render(<Setting />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-inherited', 'true');
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('data-selected', 'true');
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');

    await userEvent.click(screen.getByRole('radio', { name: 'Month' }));
    expect(group).not.toHaveAttribute('data-inherited');
    expect(screen.getByRole('radio', { name: 'Month' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Month' }));
    expect(group).toHaveAttribute('data-inherited', 'true');
    expect(screen.getByRole('radio', { name: 'Day' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Day' }));
    expect(group).not.toHaveAttribute('data-inherited');
    expect(screen.getByRole('radio', { name: 'Day' })).toBeChecked();
  });

  it('UIC-SEGMENTED-CHOICE-3.1 disables the whole group or single segments that arrows skip', async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <SegmentedChoice
        aria-label="View"
        options={views}
        value="day"
        isDisabled
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-disabled', 'true');
    for (const segment of screen.getAllByRole('radio')) {
      expect(segment).toBeDisabled();
      expect(segment).toHaveAttribute('data-disabled', 'true');
    }
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');

    rerender(
      <SegmentedChoice
        aria-label="View"
        options={[
          requireDefined(views[0]),
          { ...requireDefined(views[1]), isDisabled: true },
          requireDefined(views[2]),
        ]}
        value="day"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Week' })).toBeDisabled();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Month' })).toHaveFocus();
    await userEvent.click(screen.getByRole('radio', { name: 'Week' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-SEGMENTED-CHOICE-3.2 keeps read-only segments focusable and ignores picks', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <SegmentedChoice
        aria-label="View"
        options={views}
        defaultValue="week"
        isReadOnly
        onChange={onChange}
      />,
    );
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-readonly', 'true');
    expect(group).toHaveAttribute('data-readonly', 'true');
    const day = screen.getByRole('radio', { name: 'Day' });
    expect(day).toBeEnabled();
    await userEvent.click(day);
    expect(day).toHaveFocus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Week' })).toBeChecked();
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');
  });

  it('UIC-SEGMENTED-CHOICE-3.2 leaves aria-readonly off a read-only multiple selection', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedChoice
        aria-label="Text style"
        selectionMode="multiple"
        options={[
          { value: 'bold', label: 'Bold' },
          { value: 'italic', label: 'Italic' },
        ]}
        defaultValue={['bold']}
        isReadOnly
        isInvalid
        onChange={onChange}
      />,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Text style' });
    expect(toolbar).not.toHaveAttribute('aria-readonly');
    expect(toolbar).toHaveAttribute('data-readonly', 'true');
    expect(toolbar).toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Italic' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('UIC-SEGMENTED-CHOICE-3.3 marks an invalid group', () => {
    const { container } = render(<SegmentedChoice aria-label="View" options={views} isInvalid />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('data-invalid', 'true');
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');
  });

  it('UIC-SEGMENTED-CHOICE-3.4 publishes hover, press and keyboard focus states', async () => {
    const { container } = render(<SegmentedChoice aria-label="View" options={views} />);
    const day = screen.getByRole('radio', { name: 'Day' });
    await userEvent.hover(day);
    expect(day).toHaveAttribute('data-hovered', 'true');
    await userEvent.pointer({ keys: '[MouseLeft>]', target: day });
    expect(day).toHaveAttribute('data-pressed', 'true');
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');
    await userEvent.pointer({ keys: '[/MouseLeft]', target: day });
    await userEvent.unhover(day);
    day.blur();
    await userEvent.tab();
    expect(day).toHaveAttribute('data-focus-visible', 'true');
    expect(day).toHaveAttribute('data-focused', 'true');
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');
  });

  it('UIC-SEGMENTED-CHOICE-1.6 draws the selection indicator in the selected segment', async () => {
    render(<SegmentedChoice aria-label="View" options={views} defaultValue="day" />);
    const day = screen.getByRole('radio', { name: 'Day' });
    expect(day.querySelector('.ui-segmented-choice__indicator')).not.toBeNull();
    expect(document.querySelectorAll('.ui-segmented-choice__indicator')).toHaveLength(1);
    await userEvent.click(screen.getByRole('radio', { name: 'Month' }));
    await act(async () => {
      await Promise.resolve();
    });
    const month = screen.getByRole('radio', { name: 'Month' });
    expect(month.querySelector('.ui-segmented-choice__indicator')).not.toBeNull();
    expectHooksMatchSpec(document.body, 'SEGMENTED-CHOICE', {
      slots: ['segment', 'indicator', 'label'],
    });
  });

  it('UIC-SEGMENTED-CHOICE-1.7 keeps the label of an icon-only segment whose icon is null or false', () => {
    render(
      <SegmentedChoice
        aria-label="Layout"
        iconOnly
        options={[
          { value: 'list', label: 'List view', icon: null },
          { value: 'grid', label: 'Grid view', icon: false },
        ]}
        defaultValue="list"
      />,
    );
    for (const name of ['List view', 'Grid view']) {
      const segment = screen.getByRole('radio', { name });
      expect(segment).not.toHaveAttribute('aria-label');
      expect(segment.querySelector('.ui-segmented-choice__label')).toHaveTextContent(name);
    }
  });

  it('UIC-SEGMENTED-CHOICE-1.7 names icon-only segments by label and shows it in a tooltip', async () => {
    const user = userEvent.setup();
    render(
      <SegmentedChoice
        aria-label="Alignment"
        iconOnly
        options={[
          { value: 'list', label: 'List view', icon: DragHandleGlyph },
          { value: 'grid', label: 'Grid view', icon: FitPageGlyph },
        ]}
        defaultValue="list"
      />,
    );
    const group = screen.getByRole('radiogroup', { name: 'Alignment' });
    expect(group).toHaveAttribute('data-icon-only', 'true');
    const list = screen.getByRole('radio', { name: 'List view' });
    expect(list).toHaveAttribute('aria-label', 'List view');
    expect(list.querySelector('.ui-segmented-choice__label')).toBeNull();
    expect(list.querySelector('.ui-segmented-choice__icon')).not.toBeNull();
    await user.tab();
    expect(list).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('List view');
    expect(list).toHaveAccessibleDescription('');
    expectHooksMatchSpec(group, 'SEGMENTED-CHOICE', { slots: ['segment', 'indicator', 'icon'] });
  });

  it('UIC-SEGMENTED-CHOICE-1.8 renders the group through the caller element', () => {
    render(
      <SegmentedChoice
        aria-label="View"
        options={views}
        isReadOnly
        orientation="vertical"
        render={(props, state) => (
          <div {...props} data-swapped="yes" data-laid-out={state.orientation} />
        )}
      />,
    );
    const group = screen.getByRole('radiogroup', { name: 'View' });
    expect(group).toHaveAttribute('data-swapped', 'yes');
    expect(group).toHaveAttribute('data-laid-out', 'vertical');
    expect(group).toHaveAttribute('aria-readonly', 'true');
    expect(group).toHaveClass('ui-segmented-choice');
  });

  it('UIC-SEGMENTED-CHOICE-2.4 presses several segments and reports them in option order', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedChoice
        aria-label="Text style"
        selectionMode="multiple"
        options={[
          { value: 'bold', label: 'Bold' },
          { value: 'italic', label: 'Italic' },
          { value: 'underline', label: 'Underline' },
        ]}
        defaultValue={['underline']}
        onChange={onChange}
      />,
    );
    const group = screen.getByRole('toolbar', { name: 'Text style' });
    expect(group).toHaveAttribute('data-selection-mode', 'multiple');
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Underline' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(bold);
    expect(onChange).toHaveBeenLastCalledWith(['bold', 'underline']);
    expect(bold).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Underline' }));
    expect(onChange).toHaveBeenLastCalledWith(['bold']);
    expectHooksMatchSpec(document.body, 'SEGMENTED-CHOICE', { slots: ['segment', 'label'] });
  });

  it('UIC-SEGMENTED-CHOICE-2.5 submits the selected values with a form', async () => {
    const { container, rerender } = render(
      <form>
        <SegmentedChoice aria-label="View" name="view" options={views} defaultValue="week" />
        <SegmentedChoice
          aria-label="Days"
          name="days"
          selectionMode="multiple"
          options={views}
          defaultValue={['day', 'month']}
        />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).getAll('view')).toEqual(['week']);
    expect(new FormData(form).getAll('days')).toEqual(['day', 'month']);
    await userEvent.click(screen.getByRole('radio', { name: 'Month' }));
    expect(new FormData(form).getAll('view')).toEqual(['month']);
    rerender(
      <form>
        <SegmentedChoice aria-label="View" name="view" options={views} value="day" isDisabled />
      </form>,
    );
    expect(new FormData(form).getAll('view')).toEqual([]);
  });

  it('UIC-SEGMENTED-CHOICE-2.7 puts back the defaults on a native reset, unless it is cancelled', async () => {
    const user = userEvent.setup();
    let isCancelling = false;
    const { container } = render(
      <form onReset={(event) => isCancelling && event.preventDefault()}>
        <SegmentedChoice aria-label="View" name="view" options={views} defaultValue="day" />
        <SegmentedChoice aria-label="Filter" name="filter" options={views} isClearable />
        <SegmentedChoice
          aria-label="Days"
          name="days"
          selectionMode="multiple"
          options={views}
          defaultValue={[]}
        />
        <button type="reset">Reset</button>
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const data = () =>
      [...new FormData(form).entries()].map(([key, value]) => `${key}=${String(value)}`);
    const view = screen.getByRole('radiogroup', { name: 'View' });
    const filter = screen.getByRole('radiogroup', { name: 'Filter' });
    await user.click(within(view).getByRole('radio', { name: 'Week' }));
    await user.click(within(filter).getByRole('radio', { name: 'Month' }));
    await user.click(screen.getByRole('button', { name: 'Day' }));
    expect(data()).toEqual(['view=week', 'filter=month', 'days=day']);

    isCancelling = true;
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(data()).toEqual(['view=week', 'filter=month', 'days=day']);

    isCancelling = false;
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(data()).toEqual(['view=day']));
    expect(within(view).getByRole('radio', { name: 'Day' })).toBeChecked();
    expect(within(filter).getByRole('radio', { name: 'Month' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(within(view).getByRole('radio', { name: 'Month' }));
    act(() => form.reset());
    await waitFor(() => expect(data()).toEqual(['view=day']));
  });

  it('UIC-SEGMENTED-CHOICE-2.6 UIC-SEGMENTED-CHOICE-2.7 drops a pending change on a reset and reports a controlled reset', async () => {
    const user = userEvent.setup();
    let settle: () => void = () => {};
    const onChange = vi.fn((next: string | null) =>
      next === 'week'
        ? new Promise<void>((resolve) => {
            settle = resolve;
          })
        : undefined,
    );
    function Controlled() {
      const [view, setView] = useState<string | null>('day');
      return (
        <SegmentedChoice
          aria-label="Shown"
          name="shown"
          options={views}
          value={view}
          onChange={(next) => setView(next)}
        />
      );
    }
    const { container } = render(
      <form>
        <SegmentedChoice
          aria-label="View"
          name="view"
          options={views}
          defaultValue="day"
          onChange={onChange}
        />
        <Controlled />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const view = screen.getByRole('radiogroup', { name: 'View' });
    const shown = screen.getByRole('radiogroup', { name: 'Shown' });
    await user.click(within(view).getByRole('radio', { name: 'Week' }));
    expect(view).toHaveAttribute('data-pending', 'true');
    await user.click(within(shown).getByRole('radio', { name: 'Month' }));
    act(() => form.reset());
    await waitFor(() => expect(view).not.toHaveAttribute('data-pending'));
    // The pending change never took effect, so the reset has nothing to report.
    expect(onChange).toHaveBeenCalledExactlyOnceWith('week');
    await act(async () => settle());
    expect(within(view).getByRole('radio', { name: 'Day' })).toBeChecked();
    expect(within(shown).getByRole('radio', { name: 'Day' })).toBeChecked();
    expect(new FormData(form).getAll('view')).toEqual(['day']);
    expect(new FormData(form).getAll('shown')).toEqual(['day']);
  });
});
