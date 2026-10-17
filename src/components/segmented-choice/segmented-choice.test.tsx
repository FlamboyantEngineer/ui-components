import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SegmentedChoice, type SegmentedChoiceOption } from './segmented-choice.js';

const views: SegmentedChoiceOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

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
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('data-selected', 'true');
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'false');
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
    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'false');
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
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'false');
    rerender(<SegmentedChoice aria-label="View" options={views} value="day" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'true');
  });

  it('UIC-SEGMENTED-CHOICE-1.2 draws decorative icons and names segments by label alone', () => {
    const { container } = render(
      <SegmentedChoice
        aria-label="Order"
        value="up"
        options={[
          { value: 'up', label: 'Ascending', icon: 'sort-ascending' },
          { value: 'down', label: 'Descending', icon: <svg data-testid="custom" /> },
          { value: 'none', label: 'Unsorted' },
        ]}
      />,
    );
    const up = screen.getByRole('radio', { name: 'Ascending' });
    const icon = up.querySelector('.ui-segmented-choice__icon');
    expect(icon).toHaveClass('ui-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('data-size', 'md');
    expect(screen.getByTestId('custom').parentElement).toHaveClass('ui-segmented-choice__icon');
    expect(
      screen.getByRole('radio', { name: 'Unsorted' }).querySelector('.ui-segmented-choice__icon'),
    ).toBeNull();
    expect(container.querySelector('[role="img"]')).toBeNull();
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE', { slots: 'all' });
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
          data-testid="probe"
          data-size="caller"
        />
      </>,
    );
    const group = screen.getByTestId('probe');
    expect(group).toHaveClass('ui-segmented-choice', 'caller');
    expect(group).toHaveAttribute('id', 'view');
    expect(group).toHaveAttribute('data-size', 'md');
    expect(group).toHaveAccessibleDescription('Applies to every page');
    expect(ref.current).toBe(group);
    expectHooksMatchSpec(document.body, 'SEGMENTED-CHOICE');
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
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true');

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
    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByRole('radio', { name: 'Month' }));
    expect(group).toHaveAttribute('data-inherited', 'true');
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByRole('radio', { name: 'Day' }));
    expect(group).not.toHaveAttribute('data-inherited');
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'true');
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
        options={[views[0]!, { ...views[1]!, isDisabled: true }, views[2]!]}
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
    expect(day).not.toBeDisabled();
    await userEvent.click(day);
    expect(day).toHaveFocus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true');
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');
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
    fireEvent.pointerDown(day, { pointerType: 'mouse', button: 0 });
    expect(day).toHaveAttribute('data-pressed', 'true');
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');
    fireEvent.pointerUp(day, { pointerType: 'mouse', button: 0 });
    await userEvent.unhover(day);
    day.blur();
    await userEvent.tab();
    expect(day).toHaveAttribute('data-focus-visible', 'true');
    expect(day).toHaveAttribute('data-focused', 'true');
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');
  });
});
