import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DateTimeField } from './date-time-field.js';

function entries(form: HTMLFormElement) {
  return [...new FormData(form).entries()].map(([name, value]) => `${name}=${String(value)}`);
}

describe('DateTimeField forms', () => {
  it('UIC-DATE-TIME-FIELD-4.4 submits single values and range ends as canonical text', () => {
    const { container } = render(
      <form>
        <DateTimeField label="Due" name="due" defaultValue="2026-04-13" />
        <DateTimeField label="At" mode="time" name="at" />
        <DateTimeField
          label="Stay"
          mode="date-range"
          startName="from"
          endName="to"
          defaultValue={{ start: '2026-04-06', end: '2026-04-10' }}
        />
        <DateTimeField label="Off" name="off" defaultValue="2026-01-01" isDisabled />
      </form>,
    );
    expect(entries(container.querySelector('form') as HTMLFormElement)).toEqual([
      'due=2026-04-13',
      'at=',
      'from=2026-04-06',
      'to=2026-04-10',
    ]);
  });
});
