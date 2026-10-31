import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { LoadingRegion } from './loading-overlay.js';

// Focus returns through nested regions whatever order their loads end in (UIC-LOADING-OVERLAY-3.4).

/** Regions nested outermost first, `loading[i]` driving the i-th, around an editor. */
function Nested({ loading }: { loading: readonly boolean[] }) {
  const content = loading.reduceRight<ReactNode>(
    (inner, isLoading, index) => (
      <LoadingRegion label={`Level ${index}`} isLoading={isLoading} data-level={index}>
        {inner}
      </LoadingRegion>
    ),
    <input aria-label="Editor" />,
  );
  return (
    <>
      {content}
      <button type="button">Elsewhere</button>
    </>
  );
}

const level = (index: number) =>
  document.querySelector<HTMLElement>(`.ui-loading-region[data-level="${index}"]`);

/** Renders the regions, focuses the editor and returns a function that sets the loading flags. */
function setup(depth: number) {
  const { rerender } = render(<Nested loading={Array<boolean>(depth).fill(false)} />);
  const editor = screen.getByRole('textbox', { name: 'Editor' });
  act(() => editor.focus());
  return { editor, step: (...loading: boolean[]) => rerender(<Nested loading={loading} />) };
}

describe('LoadingRegion nesting', () => {
  it('UIC-LOADING-OVERLAY-3.4 returns focus when the inner load ends before the outer one', () => {
    const { editor, step } = setup(2);
    step(false, true);
    expect(level(1)).toHaveFocus();
    step(true, true);
    expect(level(0)).toHaveFocus();
    step(true, false);
    expect(level(0)).toHaveFocus();
    step(false, false);
    expect(editor).toHaveFocus();
  });

  it('UIC-LOADING-OVERLAY-3.4 returns focus when the outer load ends before the inner one', () => {
    const { editor, step } = setup(2);
    step(false, true);
    step(true, true);
    step(false, true);
    expect(level(1)).toHaveFocus();
    step(false, false);
    expect(editor).toHaveFocus();
  });

  it('UIC-LOADING-OVERLAY-3.4 holds focus in the inner region when the outer load started first and ends first', () => {
    const { editor, step } = setup(2);
    step(true, false);
    expect(level(0)).toHaveFocus();
    step(true, true);
    step(false, true);
    expect(level(1)).toHaveFocus();
    step(false, false);
    expect(editor).toHaveFocus();
  });

  it('UIC-LOADING-OVERLAY-3.4 returns focus after simultaneous starts and ends', () => {
    const { editor, step } = setup(2);
    step(true, true);
    expect(level(0)).toHaveFocus();
    step(false, false);
    expect(editor).toHaveFocus();
  });

  it('UIC-LOADING-OVERLAY-3.4 returns focus through three levels ending inside out', () => {
    const { editor, step } = setup(3);
    step(false, false, true);
    step(false, true, true);
    step(true, true, true);
    expect(level(0)).toHaveFocus();
    step(true, true, false);
    step(true, false, false);
    expect(level(0)).toHaveFocus();
    step(false, false, false);
    expect(editor).toHaveFocus();
  });

  it('UIC-LOADING-OVERLAY-3.4 survives a load that interrupts the chain', () => {
    const { editor, step } = setup(2);
    step(false, true);
    step(true, true);
    step(true, false);
    // The inner region loads again while the outer one still blocks.
    step(true, true);
    step(true, false);
    step(false, false);
    expect(editor).toHaveFocus();
  });

  it('UIC-LOADING-OVERLAY-3.4 leaves focus the reader moved elsewhere during a nested load', () => {
    const { step } = setup(2);
    step(false, true);
    step(true, true);
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    act(() => elsewhere.focus());
    step(true, false);
    step(false, false);
    expect(elsewhere).toHaveFocus();
  });
});
