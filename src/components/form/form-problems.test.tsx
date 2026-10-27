import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FieldIssue, FieldRegistration } from '../field/field.js';
import { createFormProblemStore } from './form-problems.js';

function registration(label: string, issues: FieldIssue[], element: HTMLElement | null) {
  return {
    getElement: () => element,
    isBlocking: () => issues.some(({ severity }) => severity === 'error'),
    revealValidation: () => {},
    focus: vi.fn(),
    getLabel: () => label,
    getIssues: () => issues,
    getRealtimeValidation: () => ({ status: 'valid' as const }),
  } satisfies FieldRegistration;
}

describe('createFormProblemStore', () => {
  it('UIC-FORM-1.7 lists the fields issues in document order with stable keys', () => {
    const { container } = render(
      <>
        <div data-field="first" />
        <div data-field="second" />
      </>,
    );
    const [firstElement, secondElement] = Array.from(
      container.querySelectorAll<HTMLElement>('[data-field]'),
    );
    const fields = new Set<FieldRegistration>();
    const store = createFormProblemStore(fields);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const issues: FieldIssue[] = [{ severity: 'error', message: 'A value is required.' }];
    const second = registration('Email', issues, secondElement ?? null);
    const first = registration(
      'Name',
      [
        { severity: 'error', message: 'Too short.' },
        { severity: 'warning', message: 'Looks unusual.' },
      ],
      firstElement ?? null,
    );
    fields.add(second);
    fields.add(first);
    expect(store.getProblems()).toEqual([]);
    store.notify();
    expect(listener).toHaveBeenCalledTimes(1);
    const problems = store.getProblems();
    expect(problems.map(({ key, label, issue }) => [key, label, issue.message])).toEqual([
      ['1-0', 'Name', 'Too short.'],
      ['1-1', 'Name', 'Looks unusual.'],
      ['2-0', 'Email', 'A value is required.'],
    ]);
    expect(store.getProblems()).toBe(problems);
    problems[2]?.focus();
    expect(second.focus).toHaveBeenCalled();
    unsubscribe();
    store.notify();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
