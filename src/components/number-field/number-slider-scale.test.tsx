import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NumberField, type NumberRange } from './number-field.js';

function thumbs() {
  return screen.getAllByRole<HTMLInputElement>('slider');
}

function thumbOf(input: HTMLElement) {
  return input.closest<HTMLElement>('.ui-number-field__thumb');
}

function percentOf(text: string | undefined): number {
  return Number.parseFloat(text ?? '');
}

const frequency = { minValue: 1, maxValue: 1000, scale: 'logarithmic' } as const;

describe('NumberField slider scale', () => {
  it('UIC-NUMBER-FIELD-5.8 places the thumb, fill and marks by ratio and keeps values in ARIA', () => {
    const marks = [{ value: 1 }, { value: 10 }, { value: 100 }, { value: 1000 }];
    const { container } = render(
      <NumberField
        {...frequency}
        display="slider"
        label="Distance"
        defaultValue={10}
        marks={marks}
        formatOptions={{ style: 'unit', unit: 'meter' }}
      />,
    );
    const [thumb] = thumbs();
    expect(thumb).toHaveValue('10');
    expect(thumb).toHaveAttribute('min', '1');
    expect(thumb).toHaveAttribute('max', '1000');
    expect(thumb).toHaveAttribute('aria-valuetext', '10 m');
    expect(container.querySelector('output')).toHaveTextContent('10 m');
    expect(percentOf(thumbOf(thumb as HTMLElement)?.style.left)).toBeCloseTo(100 / 3, 4);
    const fill = container.querySelector<HTMLElement>('.ui-number-field__fill');
    expect(percentOf(fill?.style.width)).toBeCloseTo(100 / 3, 4);
    const drawn = [...container.querySelectorAll<HTMLElement>('.ui-number-field__mark')];
    expect(drawn.map((mark) => Math.round(percentOf(mark.style.insetInlineStart)))).toEqual([
      0, 33, 67, 100,
    ]);
    expect(container.querySelector('.ui-number-field__slider')).toHaveAttribute('role', 'group');
  });

  it('UIC-NUMBER-FIELD-5.8 steps by value with the arrows and by a tenth of the track with Page', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <NumberField
        {...frequency}
        display="slider"
        label="Distance"
        defaultValue={1}
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    const [thumb] = thumbs();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(thumb).toHaveValue('2');
    expect(onCommit).toHaveBeenLastCalledWith(2);
    await user.keyboard('{PageUp}');
    // A tenth of three decades from 2 is 2 × 10^0.3 ≈ 3.99, snapped to the step.
    expect(thumb).toHaveValue('4');
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(thumb).toHaveValue('8');
    await user.keyboard('{PageDown}');
    expect(thumb).toHaveValue('4');
    await user.keyboard('{End}');
    expect(thumb).toHaveValue('1000');
    await user.keyboard('{PageUp}{Home}');
    expect(thumb).toHaveValue('1');
    expect(onChange.mock.calls.every(([value]) => Number.isInteger(value))).toBe(true);
  });

  it('UIC-NUMBER-FIELD-5.8 moves at least one step when a tenth of the track rounds to the same value', async () => {
    const user = userEvent.setup();
    render(
      <NumberField
        display="slider"
        label="Gain"
        scale="logarithmic"
        minValue={1}
        maxValue={2}
        step={0.5}
        defaultValue={1}
      />,
    );
    const [thumb] = thumbs();
    await user.tab();
    await user.keyboard('{PageUp}');
    expect(thumb).toHaveValue('1.5');
    await user.keyboard('{PageDown}');
    expect(thumb).toHaveValue('1');
  });

  it('UIC-NUMBER-FIELD-5.8 takes controlled values, submits values and keeps a range apart in values', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [band, setBand] = useState<NumberRange>([10, 100]);
      return (
        <form aria-label="Band">
          <NumberField
            {...frequency}
            range
            display="slider"
            label="Band"
            startName="low"
            endName="high"
            minStepsBetweenThumbs={5}
            value={band}
            onChange={setBand}
          />
          <button type="button" onClick={() => setBand([20, 200])}>
            Preset
          </button>
        </form>
      );
    }
    render(<Controlled />);
    const [low, high] = thumbs();
    expect(percentOf(thumbOf(high as HTMLElement)?.style.left)).toBeCloseTo(200 / 3, 4);
    await user.click(screen.getByRole('button', { name: 'Preset' }));
    expect(low).toHaveValue('20');
    expect(high).toHaveValue('200');
    const data = new FormData(screen.getByRole('form', { name: 'Band' }) as HTMLFormElement);
    expect([data.get('low'), data.get('high')]).toEqual(['20', '200']);
    low?.focus();
    await user.keyboard('{End}');
    expect(low).toHaveValue('195');
  });

  it('UIC-NUMBER-FIELD-5.8 resets, and stays locked while disabled or read-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = render(
      <form aria-label="Tone">
        <NumberField
          {...frequency}
          display="slider"
          label="Tone"
          defaultValue={50}
          isReadOnly
          onChange={onChange}
        />
        <button type="reset">Reset</button>
      </form>,
    );
    const [thumb] = thumbs();
    await user.tab();
    await user.keyboard('{ArrowRight}{PageUp}');
    expect(thumb).toHaveValue('50');
    expect(onChange).not.toHaveBeenCalled();
    rerender(
      <form aria-label="Tone">
        <NumberField {...frequency} display="slider" label="Tone" defaultValue={50} isDisabled />
        <button type="reset">Reset</button>
      </form>,
    );
    expect(thumbs()[0]).toBeDisabled();
    expect(container.querySelector('.ui-number-field__slider')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    rerender(
      <form aria-label="Tone">
        <NumberField {...frequency} display="slider" label="Tone" defaultValue={50} />
        <button type="reset">Reset</button>
      </form>,
    );
    thumbs()[0]?.focus();
    await user.keyboard('{End}');
    expect(thumbs()[0]).toHaveValue('1000');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(thumbs()[0]).toHaveValue('50');
  });

  it('UIC-NUMBER-FIELD-5.8 lays a vertical scaled track from the bottom', () => {
    render(
      <NumberField
        {...frequency}
        display="slider"
        label="Distance"
        orientation="vertical"
        defaultValue={100}
      />,
    );
    const thumb = thumbOf(thumbs()[0] as HTMLElement);
    expect(percentOf(thumb?.style.top)).toBeCloseTo(100 / 3, 4);
  });
});
