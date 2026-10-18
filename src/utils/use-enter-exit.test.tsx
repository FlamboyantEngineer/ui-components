import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEnterExit } from './use-enter-exit.js';

function Notice({ isOpen }: { isOpen: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { isMounted, isEntering, isExiting } = useEnterExit(ref, isOpen);
  if (!isMounted) return null;
  return (
    <div
      ref={ref}
      data-testid="notice"
      data-entering={isEntering || undefined}
      data-exiting={isExiting || undefined}
    >
      Saved
    </div>
  );
}

interface FakeAnimation {
  finished: Promise<void>;
  finish: () => void;
  cancel: () => void;
}

function createAnimation(): FakeAnimation {
  let finish = () => {};
  let cancel = () => {};
  const finished = new Promise<void>((resolve, reject) => {
    finish = resolve;
    cancel = () => reject(new DOMException('Cancelled', 'AbortError'));
  });
  return { finished, finish, cancel };
}

/** Gives every element the animations returned by `next`, as `Element.getAnimations` would. */
function stubAnimations(next: () => FakeAnimation[]) {
  const getAnimations = vi.fn(() => next() as unknown as Animation[]);
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: getAnimations,
  });
  return getAnimations;
}

afterEach(() => {
  delete (Element.prototype as Partial<Element>).getAnimations;
});

describe('useEnterExit', () => {
  it('UIC-ENTER-EXIT-1.1 mounts while open and unmounts at once without animations', () => {
    const { rerender } = render(<Notice isOpen={false} />);
    expect(screen.queryByTestId('notice')).not.toBeInTheDocument();
    rerender(<Notice isOpen />);
    const notice = screen.getByTestId('notice');
    expect(notice).not.toHaveAttribute('data-entering');
    expect(notice).not.toHaveAttribute('data-exiting');
    rerender(<Notice isOpen={false} />);
    expect(screen.queryByTestId('notice')).not.toBeInTheDocument();
  });

  it('UIC-ENTER-EXIT-1.2 stays entering until the enter animations finish', async () => {
    const animation = createAnimation();
    stubAnimations(() => [animation]);
    render(<Notice isOpen />);
    expect(screen.getByTestId('notice')).toHaveAttribute('data-entering', 'true');
    await act(async () => animation.finish());
    expect(screen.getByTestId('notice')).not.toHaveAttribute('data-entering');
  });

  it('UIC-ENTER-EXIT-1.3 stays mounted and exiting until the exit animations finish', async () => {
    let animations: FakeAnimation[] = [];
    stubAnimations(() => animations);
    const { rerender } = render(<Notice isOpen />);
    expect(screen.getByTestId('notice')).not.toHaveAttribute('data-entering');

    const fade = createAnimation();
    const slide = createAnimation();
    animations = [fade, slide];
    rerender(<Notice isOpen={false} />);
    expect(screen.getByTestId('notice')).toHaveAttribute('data-exiting', 'true');
    await act(async () => fade.finish());
    expect(screen.getByTestId('notice')).toHaveAttribute('data-exiting', 'true');
    await act(async () => slide.finish());
    expect(screen.queryByTestId('notice')).not.toBeInTheDocument();
  });

  it('UIC-ENTER-EXIT-1.3 finishes the exit when its animation is cancelled', async () => {
    let animations: FakeAnimation[] = [];
    stubAnimations(() => animations);
    const { rerender } = render(<Notice isOpen />);
    const fade = createAnimation();
    animations = [fade];
    rerender(<Notice isOpen={false} />);
    await act(async () => fade.cancel());
    expect(screen.queryByTestId('notice')).not.toBeInTheDocument();
  });

  it('UIC-ENTER-EXIT-1.4 keeps the element when it reopens during its exit', async () => {
    let animations: FakeAnimation[] = [];
    stubAnimations(() => animations);
    const { rerender } = render(<Notice isOpen />);
    const notice = screen.getByTestId('notice');
    const fade = createAnimation();
    animations = [fade];
    rerender(<Notice isOpen={false} />);
    animations = [];
    rerender(<Notice isOpen />);
    expect(screen.getByTestId('notice')).toBe(notice);
    expect(notice).not.toHaveAttribute('data-exiting');
    expect(notice).not.toHaveAttribute('data-entering');
    await act(async () => fade.finish());
    expect(screen.getByTestId('notice')).toBe(notice);
  });
});
