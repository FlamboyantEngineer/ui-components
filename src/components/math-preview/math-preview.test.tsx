import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { MathPreview } from './math-preview.js';
import type { MathRender, MathRenderer } from './math-render.js';

/** A renderer whose answers the test settles one by one, in any order. */
function createRenderer() {
  const calls: Array<{
    source: string;
    settle: (answer: MathRender) => void;
    fail: (error: Error) => void;
  }> = [];
  const renderer: MathRenderer = vi.fn(
    (source: string) =>
      new Promise<MathRender>((resolve, reject) => {
        calls.push({ source, settle: resolve, fail: reject });
      }),
  );
  return { renderer, calls };
}

const mathml = (text: string) => `<math><mi>${text}</mi></math>`;
const rootOf = (container: HTMLElement) => container.querySelector('.ui-math-preview');

describe('MathPreview', () => {
  it('UIC-MATH-PREVIEW-1.1 UIC-MATH-PREVIEW-1.5 typesets with KaTeX by default', async () => {
    const { container } = render(
      <MathPreview
        source="\frac{a}{b}"
        display="display"
        className="host"
        data-kind="sample"
        id="formula"
      />,
    );
    await waitFor(() => expect(rootOf(container)).toHaveAttribute('data-status', 'ready'));
    const root = rootOf(container);
    expect(root).toHaveAttribute('data-display', 'display');
    expect(root).toHaveClass('host');
    expect(root).toHaveAttribute('id', 'formula');
    expect(container.querySelector('math')?.getAttribute('display')).toBe('block');
    expect(container.querySelector('mfrac')).not.toBeNull();
    expectHooksMatchSpec(container, 'MATH-PREVIEW', {
      slots: ['math'],
      callerAttributes: ['data-kind'],
    });
  });

  it('UIC-MATH-PREVIEW-1.1 takes focus while its math is wider than its box', async () => {
    const { renderer, calls } = createRenderer();
    const width = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(400);
    const room = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
    try {
      const { container } = render(<MathPreview source="a" renderer={renderer} />);
      await waitFor(() => expect(calls).toHaveLength(1));
      await act(async () => calls[0]?.settle({ ok: true, mathml: mathml('a') }));
      const math = container.querySelector('.ui-math-preview__math');
      expect(math).toHaveAttribute('data-overflowing', 'true');
      expect(math).toHaveAttribute('tabindex', '0');
    } finally {
      width.mockRestore();
      room.mockRestore();
    }
  });

  it('UIC-MATH-PREVIEW-1.1 shows the pending note before anything has typeset', async () => {
    const { renderer, calls } = createRenderer();
    const { container } = render(<MathPreview source="x" renderer={renderer} />);
    expect(rootOf(container)).toHaveAttribute('data-display', 'inline');
    expect(await screen.findByText('Typesetting…')).toBeInTheDocument();
    await waitFor(() => expect(calls).toHaveLength(1));
    await act(async () => calls[0]?.settle({ ok: true, mathml: mathml('x') }));
    expect(rootOf(container)).toHaveAttribute('data-status', 'ready');
    expect(screen.queryByText('Typesetting…')).not.toBeInTheDocument();
  });

  it('UIC-MATH-PREVIEW-1.1 renders nothing for blank source', () => {
    const renderer = vi.fn();
    const { container } = render(<MathPreview source="  " renderer={renderer} />);
    expect(rootOf(container)).toHaveAttribute('data-status', 'empty');
    expect(rootOf(container)).toBeEmptyDOMElement();
    expect(renderer).not.toHaveBeenCalled();
  });

  it('UIC-MATH-PREVIEW-1.2 shows why source does not typeset, with the source', async () => {
    const { container } = render(<MathPreview source="\frac{1" />);
    await waitFor(() => expect(rootOf(container)).toHaveAttribute('data-status', 'invalid'));
    expect(container.querySelector('.ui-math-preview__error')).toHaveTextContent('Invalid math');
    expect(container.querySelector('.ui-math-preview__detail')).toHaveTextContent(/expected '}'/);
    expect(container.querySelector('.ui-math-preview__source')).toHaveTextContent('\\frac{1');
    expectHooksMatchSpec(container, 'MATH-PREVIEW', { slots: ['error', 'detail', 'source'] });
  });

  it('UIC-MATH-PREVIEW-1.2 lets the host replace the fixed message through the provider', async () => {
    const { container } = render(
      <UiProvider messages={{ mathInvalid: 'Not valid math code' }}>
        <MathPreview source="\frac{1" />
      </UiProvider>,
    );
    await waitFor(() => expect(rootOf(container)).toHaveAttribute('data-status', 'invalid'));
    expect(container.querySelector('.ui-math-preview__error')).toHaveTextContent(
      'Not valid math code',
    );
  });

  it('UIC-MATH-PREVIEW-1.2 refuses long source and reports renderer failures', async () => {
    const renderer = vi.fn<MathRenderer>(() => Promise.reject(new Error('Renderer offline.')));
    const { container, rerender } = render(
      <MathPreview source="x+y" renderer={renderer} maxLength={2} />,
    );
    expect(container.querySelector('.ui-math-preview__error')).toHaveTextContent(
      'Longer than 2 characters, so not previewed.',
    );
    expect(renderer).not.toHaveBeenCalled();
    expect(container.querySelector('.ui-math-preview__detail')).toBeNull();
    rerender(<MathPreview source="x+y" renderer={renderer} />);
    expect(await screen.findByText('Renderer offline.')).toBeInTheDocument();
  });

  it('UIC-MATH-PREVIEW-1.3 keeps the last math stale and drops out-of-order answers', async () => {
    const { renderer, calls } = createRenderer();
    const { container, rerender } = render(<MathPreview source="a" renderer={renderer} />);
    await waitFor(() => expect(calls).toHaveLength(1));
    await act(async () => calls[0]?.settle({ ok: true, mathml: mathml('a') }));
    rerender(<MathPreview source="ab" renderer={renderer} />);
    rerender(<MathPreview source="abc" renderer={renderer} />);
    await waitFor(() => expect(calls).toHaveLength(3));
    expect(rootOf(container)).toHaveAttribute('data-stale', 'true');
    expect(rootOf(container)).toHaveAttribute('data-status', 'pending');
    expect(container.querySelector('mi')).toHaveTextContent('a');
    await act(async () => calls[2]?.settle({ ok: true, mathml: mathml('abc') }));
    await act(async () => calls[1]?.settle({ ok: true, mathml: mathml('ab') }));
    expect(container.querySelector('mi')).toHaveTextContent('abc');
    expect(rootOf(container)).not.toHaveAttribute('data-stale');
  });

  it('UIC-MATH-PREVIEW-1.3 ignores answers after unmounting and keeps instances apart', async () => {
    const { renderer, calls } = createRenderer();
    const { container, unmount } = render(
      <>
        <MathPreview source="p" renderer={renderer} />
        <MathPreview source="q" renderer={renderer} />
      </>,
    );
    await waitFor(() => expect(calls).toHaveLength(2));
    await act(async () => calls[1]?.settle({ ok: true, mathml: mathml('q') }));
    const roots = container.querySelectorAll('.ui-math-preview');
    expect(roots[0]).toHaveAttribute('data-status', 'pending');
    expect(roots[1]).toHaveAttribute('data-status', 'ready');
    unmount();
    await act(async () => calls[0]?.settle({ ok: true, mathml: mathml('p') }));
    expect(container).toBeEmptyDOMElement();
  });
});
