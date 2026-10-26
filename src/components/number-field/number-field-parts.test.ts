import { describe, expect, it } from 'vitest';
import { addStep, type NumberSteps } from './number-field-parts.js';

const steps: NumberSteps = {
  step: 1,
  smallStep: undefined,
  largeStep: undefined,
  minValue: undefined,
  maxValue: undefined,
};

describe('addStep', () => {
  it('UIC-NUMBER-FIELD-3.2 UIC-NUMBER-FIELD-3.3 retains scientific-notation precision', () => {
    expect(addStep(1e-7, 1e-7, steps)).toBe(2e-7);
    expect(addStep(-1.2e-7, -1e-8, steps)).toBe(-1.3e-7);
    expect(addStep(1e-100, 1e-100, steps)).toBe(2e-100);
    expect(addStep(Number.MIN_VALUE, Number.MIN_VALUE, steps)).toBe(2 * Number.MIN_VALUE);
    expect(addStep(0.1, 0.2, steps)).toBe(0.3);
    expect(addStep(2e-7, -1e-7, { ...steps, minValue: 1.5e-7 })).toBe(1.5e-7);
    expect(addStep(null, 1e-7, steps)).toBe(0);
  });

  it('UIC-NUMBER-FIELD-3.2 steps an empty value up to the minimum and down to the maximum', () => {
    const range = { step: 1, smallStep: 1, largeStep: 5, minValue: -10, maxValue: 10 };
    expect(addStep(null, 5, range)).toBe(-10);
    expect(addStep(null, -5, range)).toBe(10);
    const open = { step: 1, smallStep: 1, largeStep: 5, minValue: undefined, maxValue: undefined };
    expect(addStep(null, 5, open)).toBe(0);
    expect(addStep(null, -5, { ...open, minValue: 3 })).toBe(3);
  });
});
