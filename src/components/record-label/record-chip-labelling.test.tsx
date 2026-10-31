import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecordLabel, type RecordLabelProps } from './record-label.js';

// A chip's caller labelling reaches its label (UIC-RECORD-LABEL-11.7).

const labelling = {
  'aria-label': 'Open record',
  'aria-labelledby': undefined,
  'aria-describedby': 'details',
  'aria-details': 'notes',
} as const;

function renderChip(props: Partial<RecordLabelProps>) {
  return render(
    <>
      <p id="details">More information</p>
      <RecordLabel mode="chip" identifier="R-1" name="Limits" {...labelling} {...props} />
    </>,
  );
}

const chip = (container: HTMLElement) =>
  container.querySelector('.ui-record-label[data-mode="chip"]') as HTMLElement;

describe('RecordLabel chip labelling', () => {
  it.each([
    ['an inline', {}, 'More information'],
    ['a stacked', { layout: 'stacked' }, 'More information Limits'],
    ['a previewed', { preview: <p>Owner</p> }, /^More information Long press/],
    [
      'a stacked previewed',
      { layout: 'stacked', preview: <p>Owner</p> },
      /^More information Limits /,
    ],
  ] as const)(
    'UIC-RECORD-LABEL-11.7 names and describes the link of %s chip',
    (_, props: Partial<RecordLabelProps>, description) => {
      const { container } = renderChip({ href: '/record', ...props });
      const link = screen.getByRole('link', { name: 'Open record' });
      expect(link).toHaveAccessibleDescription(description);
      expect(link).toHaveAttribute('aria-details', 'notes');
      for (const name of ['aria-label', 'aria-describedby', 'aria-details']) {
        expect(chip(container)).not.toHaveAttribute(name);
      }
    },
  );

  it('UIC-RECORD-LABEL-11.7 names a chip without a link from hidden text, never a span', () => {
    const { container } = renderChip({ 'aria-labelledby': 'details', type: 'Requirement' });
    const label = container.querySelector('.ui-record-label__label') as HTMLElement;
    expect(label).not.toHaveAttribute('aria-label');
    expect(label).not.toHaveAttribute('aria-labelledby');
    expect(label).toHaveAttribute('aria-describedby', 'details');
    expect(chip(container)).not.toHaveAttribute('aria-label');
    expect(chip(container)).toHaveTextContent(/^R-1 LimitsOpen record Requirement$/);
    expect(screen.getByText('Open record')).toHaveClass('ui-record-label__accessible-label');
    expect(container.querySelector('.ui-record-label__identity')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('UIC-RECORD-LABEL-11.7 reads an unavailable chip by the caller name, with no link', () => {
    const { container } = renderChip({ href: '/record', unavailable: 'restricted' });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Open record')).toHaveClass('ui-record-label__accessible-label');
    expect(chip(container)).not.toHaveAttribute('aria-describedby');
  });
});
