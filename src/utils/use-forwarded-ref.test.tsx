import { render } from '@testing-library/react';
import { createRef, type Ref } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useForwardedRef } from './use-forwarded-ref.js';

function Probe({
  forwarded,
  onOwn,
}: {
  forwarded?: Ref<HTMLDivElement>;
  onOwn: (node: unknown) => void;
}) {
  const [own, setRef] = useForwardedRef(forwarded);
  return (
    <div
      ref={(node) => {
        setRef(node);
        onOwn(own.current);
      }}
    />
  );
}

describe('useForwardedRef', () => {
  it('fills its own ref and the caller ref object or callback', () => {
    const onOwn = vi.fn();
    const object = createRef<HTMLDivElement>();
    const { container, rerender } = render(<Probe forwarded={object} onOwn={onOwn} />);
    expect(object.current).toBe(container.firstElementChild);
    expect(onOwn).toHaveBeenLastCalledWith(container.firstElementChild);

    const callback = vi.fn();
    rerender(<Probe forwarded={callback} onOwn={onOwn} />);
    expect(callback).toHaveBeenLastCalledWith(container.firstElementChild);

    rerender(<Probe onOwn={onOwn} />);
    expect(onOwn).toHaveBeenLastCalledWith(container.firstElementChild);
  });
});
