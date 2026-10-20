import { render, screen } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TourSpotlight } from './tour-spotlight.js';

function Spotlight({ target }: { target: Element | null }) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  return <TourSpotlight target={target} element={element} spotlightRef={setElement} />;
}

function renderTargets() {
  render(
    <>
      <button type="button">First target</button>
      <button type="button">Second target</button>
    </>,
  );
  const first = screen.getByText('First target');
  const second = screen.getByText('Second target');
  vi.spyOn(first, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 150, 80, 40));
  vi.spyOn(second, 'getBoundingClientRect').mockReturnValue(new DOMRect(250, 200, 140, 70));
  return { first, second };
}

function mockTransitions() {
  const position = ['top', 'left', 'width', 'height'].map((transitionProperty) => ({
    transitionProperty,
    cancel: vi.fn(),
  }));
  const opacity = { transitionProperty: 'opacity', cancel: vi.fn() };
  const animation = { cancel: vi.fn() };
  vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([
    ...position,
    opacity,
    animation,
  ] as unknown as Animation[]);
  return { position, opacity, animation };
}

describe('Tour spotlight', () => {
  it('UIC-TOUR-1.3 places the first highlight immediately while retaining other animations', () => {
    const { first } = renderTargets();
    const { position, opacity, animation } = mockTransitions();
    render(
      <StrictMode>
        <Spotlight target={first} />
      </StrictMode>,
    );
    const spotlight = document.querySelector('.ui-tour__spotlight') as HTMLElement;
    expect(spotlight.style.top).toBe('150px');
    expect(spotlight.style.left).toBe('100px');
    expect(spotlight.style.width).toBe('80px');
    expect(spotlight.style.height).toBe('40px');
    for (const transition of position) expect(transition.cancel).toHaveBeenCalled();
    expect(opacity.cancel).not.toHaveBeenCalled();
    expect(animation.cancel).not.toHaveBeenCalled();
  });

  it('UIC-TOUR-1.3 allows position transitions between two highlights', () => {
    const { first, second } = renderTargets();
    const { position } = mockTransitions();
    const { rerender } = render(<Spotlight target={first} />);
    for (const transition of position) transition.cancel.mockClear();
    rerender(<Spotlight target={second} />);
    for (const transition of position) expect(transition.cancel).not.toHaveBeenCalled();
    expect((document.querySelector('.ui-tour__spotlight') as HTMLElement).style.left).toBe('250px');
  });

  it('UIC-TOUR-1.3 settles position transitions whenever either highlight is missing', () => {
    const { first } = renderTargets();
    const { position } = mockTransitions();
    const { rerender } = render(<Spotlight target={null} />);
    for (const transition of position) transition.cancel.mockClear();
    rerender(<Spotlight target={first} />);
    for (const transition of position) expect(transition.cancel).toHaveBeenCalled();
    for (const transition of position) transition.cancel.mockClear();
    rerender(<Spotlight target={null} />);
    for (const transition of position) expect(transition.cancel).toHaveBeenCalled();
    const spotlight = document.querySelector('.ui-tour__spotlight') as HTMLElement;
    expect(spotlight).toHaveAttribute('data-target-missing', 'true');
    expect(spotlight.style.width).toBe('0px');
    expect(spotlight.style.height).toBe('0px');
  });
});
