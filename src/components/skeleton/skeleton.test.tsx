import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Skeleton, SkeletonText } from './skeleton.js';

describe('Skeleton', () => {
  it('UIC-SKELETON-1.1 UIC-SKELETON-4.1 is a decorative block without children', () => {
    const { container, rerender } = render(<Skeleton />);
    const block = container.firstElementChild as HTMLElement;
    expect(block.tagName).toBe('DIV');
    expect(block).toHaveClass('ui-skeleton');
    expect(block).toBeEmptyDOMElement();
    expect(block).toHaveAttribute('aria-hidden', 'true');
    expect(block).toHaveAttribute('data-loading', 'true');
    expect(block).not.toHaveAttribute('aria-busy');
    expect(block).not.toHaveAttribute('role');
    expectHooksMatchSpec(container, 'SKELETON');
    rerender(<Skeleton>{null}</Skeleton>);
    expect(container.firstElementChild).toBeEmptyDOMElement();
  });

  it('UIC-SKELETON-1.2 publishes the shape, a rectangle by default', () => {
    const { container, rerender } = render(<Skeleton />);
    const block = container.firstElementChild as HTMLElement;
    expect(block).toHaveAttribute('data-shape', 'rectangle');
    for (const shape of ['text', 'rectangle', 'circle'] as const) {
      rerender(<Skeleton shape={shape} />);
      expect(block).toHaveAttribute('data-shape', shape);
      expectHooksMatchSpec(container, 'SKELETON');
    }
  });

  it('UIC-SKELETON-1.3 lets the stylesheet animate only while loading and allowed', () => {
    const { container, rerender } = render(<Skeleton />);
    const block = container.firstElementChild as HTMLElement;
    expect(block).toHaveAttribute('data-animated', 'true');
    rerender(<Skeleton animated={false} />);
    expect(block).not.toHaveAttribute('data-animated');
    expect(block).toHaveAttribute('data-loading', 'true');
    rerender(<Skeleton isLoading={false} />);
    expect(block).not.toHaveAttribute('data-animated');
    expect(block).not.toHaveAttribute('data-loading');
  });

  it('UIC-SKELETON-1.4 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <>
        <Skeleton className="caller" id="block" data-sample="block" data-shape="caller" />
        <SkeletonText className="lines" id="text" data-sample="text" />
      </>,
    );
    const [block, text] = container.children;
    expect(block).toHaveClass('ui-skeleton', 'caller');
    expect(block).toHaveAttribute('id', 'block');
    expect(block).toHaveAttribute('data-shape', 'rectangle');
    expect(block).toHaveAttribute('data-sample', 'block');
    expect(text).toHaveClass('ui-skeleton-text', 'lines');
    expect(text).toHaveAttribute('id', 'text');
    expect(text).toHaveAttribute('data-sample', 'text');
    expectHooksMatchSpec(document.body, 'SKELETON', { callerAttributes: ['data-sample'] });
  });
});

describe('Loading content', () => {
  // jsdom ignores `inert` for focus; e2e/skeleton.spec.ts checks the tab order in a browser.
  it('UIC-SKELETON-2.1 UIC-SKELETON-4.1 keeps wrapped content inert and hidden while loading', () => {
    const { container } = render(
      <>
        <Skeleton shape="circle">
          <button type="button">Profile</button>
        </Skeleton>
        <button type="button">After</button>
      </>,
    );
    const root = container.firstElementChild as HTMLElement;
    const content = root.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-skeleton');
    expect(root).toHaveAttribute('data-loading', 'true');
    expect(root).toHaveAttribute('data-shape', 'circle');
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(root).not.toHaveAttribute('aria-hidden');
    expect(content).toHaveClass('ui-skeleton__content');
    expect(content).toHaveAttribute('inert');
    expect(content).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button', { name: 'Profile' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'After' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'SKELETON', { slots: ['content'] });
  });

  it('UIC-SKELETON-2.2 reveals the same content once loaded', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <Skeleton shape="text">
        <input aria-label="City" defaultValue="Lisbon" />
      </Skeleton>,
    );
    const root = container.firstElementChild as HTMLElement;
    const input = root.querySelector('input') as HTMLInputElement;
    rerender(
      <Skeleton shape="text" isLoading={false}>
        <input aria-label="City" defaultValue="Lisbon" />
      </Skeleton>,
    );
    const content = root.querySelector('.ui-skeleton__content') as HTMLElement;
    for (const attribute of ['data-loading', 'data-animated', 'aria-busy']) {
      expect(root).not.toHaveAttribute(attribute);
    }
    expect(content).not.toHaveAttribute('inert');
    expect(content).not.toHaveAttribute('aria-hidden');
    expect(screen.getByRole('textbox', { name: 'City' })).toBe(input);
    await user.type(input, ' and Porto');
    rerender(
      <Skeleton shape="text">
        <input aria-label="City" defaultValue="Lisbon" />
      </Skeleton>,
    );
    rerender(
      <Skeleton shape="text" isLoading={false}>
        <input aria-label="City" defaultValue="Lisbon" />
      </Skeleton>,
    );
    expect(screen.getByRole('textbox', { name: 'City' })).toHaveValue('Lisbon and Porto');
    expectHooksMatchSpec(container, 'SKELETON', { slots: ['content'] });
  });
});

describe('SkeletonText', () => {
  it('UIC-SKELETON-3.1 draws decorative text lines', () => {
    const { container, rerender } = render(<SkeletonText />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-skeleton-text');
    expect(root).toHaveAttribute('aria-hidden', 'true');
    const lines = () => root.querySelectorAll('.ui-skeleton-text__line');
    expect(lines()).toHaveLength(3);
    for (const line of lines()) {
      expect(line).toHaveClass('ui-skeleton');
      expect(line).toHaveAttribute('data-shape', 'text');
      expect(line).toHaveAttribute('data-animated', 'true');
    }
    expectHooksMatchSpec(container, 'SKELETON', { slots: ['line'] });
    const counts = [5, 2.7, 0, -4, Number.NaN].map((count) => {
      rerender(<SkeletonText lines={count} />);
      return lines().length;
    });
    expect(counts).toEqual([5, 2, 1, 1, 3]);
    rerender(<SkeletonText animated={false} />);
    expect(root.querySelector('[data-animated]')).toBeNull();
  });
});

describe('Skeleton root ref', () => {
  it('UIC-SKELETON-1.4 forwards ref to its root', () => {
    const ref = { current: null as HTMLDivElement | null };
    const text = { current: null as HTMLDivElement | null };
    const { container } = render(
      <>
        <Skeleton ref={ref} />
        <SkeletonText ref={text} />
      </>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.querySelector('.ui-skeleton'));
    expect(text.current).toBe(container.querySelector('.ui-skeleton-text'));
  });
});
