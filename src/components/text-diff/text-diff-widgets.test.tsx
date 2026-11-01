import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { TextDiff, type TextDiffLayout, type TextDiffLine } from './text-diff.js';

const shaped = (first: string, last: string) => [`old ${first}`, 'keep', `old ${last}`].join('\n');
const revised = (first: string, last: string) => [`new ${first}`, 'keep', `new ${last}`].join('\n');

const noteFor = (line: TextDiffLine) =>
  line.change === 'added' && line.newNumber === 1 ? (
    <input aria-label={`Note on ${line.text}`} defaultValue="" />
  ) : null;

function Review(props: {
  words: [string, string];
  layout?: TextDiffLayout;
  context?: number;
  render?: (line: TextDiffLine) => ReactNode;
}) {
  const [first, last] = props.words;
  return (
    <TextDiff
      oldText={shaped(first, last)}
      newText={revised(first, last)}
      layout={props.layout}
      context={props.context}
      renderLineWidget={props.render ?? noteFor}
    />
  );
}

describe('TextDiff line widgets', () => {
  it('UIC-TEXT-DIFF-1.7 keeps a widget draft across rerenders of the same texts', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Review words={['alpha', 'blue']} />);
    await user.type(screen.getByRole('textbox', { name: 'Note on new alpha' }), 'draft');
    rerender(<Review words={['alpha', 'blue']} render={(line) => noteFor(line)} />);
    expect(screen.getByRole('textbox', { name: 'Note on new alpha' })).toHaveValue('draft');
  });

  it('UIC-TEXT-DIFF-1.7 draws new widgets for new texts, even of the same shape', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Review words={['alpha', 'blue']} />);
    const alpha = screen.getByRole('textbox', { name: 'Note on new alpha' });
    await user.type(alpha, 'review note');
    rerender(<Review words={['gamma', 'delta']} />);
    const gamma = screen.getByRole('textbox', { name: 'Note on new gamma' });
    expect(gamma).toHaveValue('');
    expect(gamma).not.toBe(alpha);
  });

  it('UIC-TEXT-DIFF-1.7 keeps widgets while a fold opens', async () => {
    const user = userEvent.setup();
    const oldText = ['Top', ...Array.from({ length: 8 }, (_, i) => `Row ${i}`), 'End'].join('\n');
    const newText = ['Top!', ...Array.from({ length: 8 }, (_, i) => `Row ${i}`), 'End!'].join('\n');
    render(
      <TextDiff
        oldText={oldText}
        newText={newText}
        context={1}
        renderLineWidget={(line) =>
          line.change === 'added' && line.newNumber === 1 ? (
            <input aria-label="Note" defaultValue="" />
          ) : null
        }
      />,
    );
    await user.type(screen.getByRole('textbox', { name: 'Note' }), 'kept');
    await user.click(screen.getByRole('button', { name: /6/ }));
    expect(screen.getByText('Row 3')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('kept');
  });

  it('UIC-TEXT-DIFF-1.7 names each line by an id shared by both layouts', () => {
    const seen = { unified: new Set<string>(), split: new Set<string>() };
    const record = (layout: TextDiffLayout) => (line: TextDiffLine) => {
      seen[layout].add(`${line.id}:${line.text}`);
      return null;
    };
    const { rerender } = render(<Review words={['alpha', 'blue']} render={record('unified')} />);
    rerender(<Review words={['alpha', 'blue']} layout="split" render={record('split')} />);
    expect([...seen.unified]).toEqual([
      'r1:old alpha',
      'a1:new alpha',
      'u2:keep',
      'r3:old blue',
      'a3:new blue',
    ]);
    expect([...seen.split].sort()).toEqual([...seen.unified].sort());
  });
});
