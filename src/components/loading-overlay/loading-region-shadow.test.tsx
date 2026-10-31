import { render } from '@testing-library/react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { describe, expect, it } from 'vitest';
import { LoadingRegion } from './loading-overlay.js';

// Focus around a blocked region reaches into shadow roots (UIC-LOADING-OVERLAY-3.3).

/** Renders `children` into an open shadow root of a host element. */
function ShadowHost({ children, name }: { children: ReactNode; name: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (host) setRoot(host.shadowRoot ?? host.attachShadow({ mode: 'open' }));
  }, []);
  return (
    <div ref={hostRef} data-host={name}>
      {root ? createPortal(children, root) : null}
    </div>
  );
}

const host = (name: string) =>
  document.querySelector(`[data-host="${name}"]`)?.shadowRoot as ShadowRoot;

function region(isLoading: boolean, content: ReactNode) {
  return (
    <LoadingRegion label="Saving" isLoading={isLoading}>
      {content}
    </LoadingRegion>
  );
}

const deepActive = () => {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
};

/** Blocks and releases a tree, checking focus parks on the region and comes back to `input`. */
function expectFocusReturns(tree: (isLoading: boolean) => ReactNode, input: () => HTMLElement) {
  const { rerender } = render(<>{tree(false)}</>);
  const field = input();
  field.focus();
  rerender(<>{tree(true)}</>);
  const blocked = field.closest('.ui-loading-region') ?? findRegion(field);
  expect(blocked).toHaveAttribute('tabindex', '-1');
  expect(deepActive()).toBe(blocked);
  rerender(<>{tree(false)}</>);
  return field;
}

function findRegion(node: Node): Element | null {
  let current: Node | null = node;
  while (current) {
    if (current instanceof Element && current.classList.contains('ui-loading-region'))
      return current;
    current = current.parentNode ?? (current as Partial<ShadowRoot>).host ?? null;
  }
  return null;
}

describe('LoadingRegion focus in shadow roots', () => {
  it('UIC-LOADING-OVERLAY-3.3 returns focus to an input of a region inside a shadow root', () => {
    const tree = (isLoading: boolean) => (
      <ShadowHost name="outer">{region(isLoading, <input aria-label="City" />)}</ShadowHost>
    );
    const field = expectFocusReturns(
      tree,
      () => host('outer').querySelector('input') as HTMLElement,
    );
    expect(deepActive()).toBe(field);
  });

  it('UIC-LOADING-OVERLAY-3.3 returns focus through nested shadow roots', () => {
    const tree = (isLoading: boolean) => (
      <ShadowHost name="outer">
        {region(
          isLoading,
          <ShadowHost name="inner">
            <input aria-label="City" />
          </ShadowHost>,
        )}
      </ShadowHost>
    );
    const field = expectFocusReturns(tree, () => {
      const inner = host('outer').querySelector('[data-host="inner"]')?.shadowRoot;
      return inner?.querySelector('input') as HTMLElement;
    });
    expect(deepActive()).toBe(field);
  });

  it('UIC-LOADING-OVERLAY-3.3 returns focus into a shadow host inside ordinary content', () => {
    const tree = (isLoading: boolean) =>
      region(
        isLoading,
        <ShadowHost name="field">
          <input aria-label="City" />
        </ShadowHost>,
      );
    const field = expectFocusReturns(
      tree,
      () => host('field').querySelector('input') as HTMLElement,
    );
    expect(deepActive()).toBe(field);
  });

  it('UIC-LOADING-OVERLAY-3.3 leaves focus the reader moved elsewhere', () => {
    const tree = (isLoading: boolean) => (
      <>
        <ShadowHost name="outer">{region(isLoading, <input aria-label="City" />)}</ShadowHost>
        <button type="button">Elsewhere</button>
      </>
    );
    const { rerender } = render(tree(false));
    host('outer').querySelector('input')?.focus();
    rerender(tree(true));
    const elsewhere = document.querySelector('button') as HTMLElement;
    elsewhere.focus();
    rerender(tree(false));
    expect(elsewhere).toHaveFocus();
  });
});
