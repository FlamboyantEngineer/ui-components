import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Carousel } from './carousel.js';

const cities = ['Lisbon', 'Oslo', 'Kyoto', 'Quito'];

function slides() {
  return cities.map((city) => (
    <p key={city}>
      {city} <a href={`#${city}`}>Read about {city}</a>
    </p>
  ));
}

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

function shown(container: HTMLElement): string | undefined {
  return container.querySelector('.ui-carousel__slide:not([hidden])')?.textContent?.split(' ')[0];
}

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Carousel', () => {
  it('UIC-CAROUSEL-1.1 shows one slide at a time, naming each by its position', () => {
    const { container } = render(<Carousel aria-label="Cities">{slides()}</Carousel>);
    const carousel = screen.getByRole('region', { name: 'Cities' });
    expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    const groups = container.querySelectorAll('.ui-carousel__slide');
    expect(groups).toHaveLength(4);
    expect(groups[0]).toHaveAttribute('role', 'group');
    expect(groups[0]).toHaveAttribute('aria-roledescription', 'slide');
    expect(groups[0]).toHaveAttribute('aria-label', '1 of 4');
    expect(groups[0]).toHaveAttribute('data-current', 'true');
    expect(groups[1]).toHaveAttribute('hidden');
    expect(groups[1]).toHaveAttribute('inert');
    expect(groups[1]).not.toHaveAttribute('data-current');
    expect(shown(container)).toBe('Lisbon');
    expectHooksMatchSpec(container, 'CAROUSEL', {
      slots: ['controls', 'previous', 'next', 'viewport', 'slide', 'pagination', 'dot'],
    });
  });

  it('UIC-CAROUSEL-1.2 moves with the previous and next buttons, stopping at the ends', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    const { container } = render(
      <Carousel aria-label="Cities" onIndexChange={onIndexChange}>
        {slides()}
      </Carousel>,
    );
    const previous = screen.getByRole('button', { name: 'Previous slide' });
    const next = screen.getByRole('button', { name: 'Next slide' });
    const viewport = container.querySelector('.ui-carousel__viewport') as HTMLElement;
    expect(next).toHaveAttribute('aria-controls', viewport.id);
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    await user.click(next);
    expect(shown(container)).toBe('Oslo');
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    await user.click(next);
    await user.click(next);
    expect(shown(container)).toBe('Quito');
    expect(next).toHaveAttribute('aria-disabled', 'true');
    await user.click(next);
    expect(shown(container)).toBe('Quito');
    await user.click(previous);
    expect(shown(container)).toBe('Kyoto');
  });

  it('UIC-CAROUSEL-1.2 wraps around with loop and follows a controlled index', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    const { container, rerender } = render(
      <Carousel aria-label="Cities" loop index={0} onIndexChange={onIndexChange}>
        {slides()}
      </Carousel>,
    );
    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(3);
    expect(shown(container)).toBe('Lisbon');
    rerender(
      <Carousel aria-label="Cities" loop index={3} onIndexChange={onIndexChange}>
        {slides()}
      </Carousel>,
    );
    expect(shown(container)).toBe('Quito');
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    rerender(
      <Carousel aria-label="Cities" index={9}>
        {slides()}
      </Carousel>,
    );
    expect(shown(container)).toBe('Quito');
  });

  it('UIC-CAROUSEL-1.3 picks a slide from dots or thumbnails', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <Carousel aria-label="Cities" defaultIndex={1}>
        {slides()}
      </Carousel>,
    );
    expect(root(container)).toHaveAttribute('data-pagination', 'dots');
    const picker = screen.getByRole('group', { name: 'Choose a slide' });
    const dots = within(picker).getAllByRole('button');
    expect(dots.map((dot) => dot.getAttribute('aria-label'))).toEqual([
      'Slide 1',
      'Slide 2',
      'Slide 3',
      'Slide 4',
    ]);
    expect(dots[1]).toHaveAttribute('aria-current', 'true');
    expect(dots[1]).toHaveAttribute('data-current', 'true');
    expect(dots[0]).not.toHaveAttribute('aria-current');
    await user.click(dots[3] as HTMLElement);
    expect(shown(container)).toBe('Quito');

    rerender(
      <Carousel
        aria-label="Cities"
        pagination="thumbnails"
        renderThumbnail={(index) => <img src={`/${cities[index]}.png`} alt="" />}
      >
        {slides()}
      </Carousel>,
    );
    const thumbnails = container.querySelectorAll('.ui-carousel__thumbnail');
    expect(thumbnails).toHaveLength(4);
    expect(thumbnails[2]?.querySelector('img')).toHaveAttribute('src', '/Kyoto.png');
    expect(thumbnails[2]).toHaveAccessibleName('Slide 3');
    expectHooksMatchSpec(container, 'CAROUSEL', { slots: ['thumbnail'] });
    rerender(
      <Carousel aria-label="Cities" pagination="none">
        {slides()}
      </Carousel>,
    );
    expect(container.querySelector('.ui-carousel__pagination')).toBeNull();
  });

  it('UIC-CAROUSEL-1.4 hides the controls with a single slide', () => {
    const { container } = render(
      <Carousel aria-label="Cities" autoplay>
        <p>Lisbon</p>
      </Carousel>,
    );
    expect(container.querySelector('.ui-carousel__controls')).toBeNull();
    expect(container.querySelector('.ui-carousel__pagination')).toBeNull();
    expect(root(container)).not.toHaveAttribute('data-rotating');
    expect(shown(container)).toBe('Lisbon');
  });

  it('UIC-CAROUSEL-2.1 moves with the arrow keys, mirrored right to left', () => {
    const { container, rerender } = render(<Carousel aria-label="Cities">{slides()}</Carousel>);
    const next = screen.getByRole('button', { name: 'Next slide' });
    fireEvent.keyDown(next, { key: 'ArrowRight' });
    expect(shown(container)).toBe('Oslo');
    fireEvent.keyDown(next, { key: 'ArrowRight', ctrlKey: true });
    expect(shown(container)).toBe('Oslo');
    fireEvent.keyDown(next, { key: 'ArrowLeft' });
    expect(shown(container)).toBe('Lisbon');
    rerender(
      <UiProvider locale="ar-EG">
        <Carousel aria-label="Cities">
          {[...slides(), <input key="field" aria-label="Note" />]}
        </Carousel>
      </UiProvider>,
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'Next slide' }), { key: 'ArrowLeft' });
    expect(shown(container)).toBe('Oslo');
  });

  it('UIC-CAROUSEL-2.1 leaves keys alone inside a text field', () => {
    const { container } = render(
      <Carousel aria-label="Notes">
        <input aria-label="First note" />
        <p>Second</p>
      </Carousel>,
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowRight' });
    expect(container.querySelector('.ui-carousel__slide[data-current] input')).not.toBeNull();
  });

  it('UIC-CAROUSEL-2.2 moves focus to the new slide when the focused one hides', async () => {
    const user = userEvent.setup();
    const { container } = render(<Carousel aria-label="Cities">{slides()}</Carousel>);
    screen.getByRole('link', { name: 'Read about Lisbon' }).focus();
    await user.keyboard('{ArrowRight}');
    const current = container.querySelector('.ui-carousel__slide[data-current]');
    expect(current).toHaveAttribute('aria-label', '2 of 4');
    expect(current).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('button', { name: 'Next slide' })).toHaveFocus();
  });

  it('UIC-CAROUSEL-3.1 advances on its own, wrapping, with the live region off', () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    const { container } = render(
      <Carousel aria-label="Cities" autoplay interval={2000}>
        {slides()}
      </Carousel>,
    );
    const viewport = container.querySelector('.ui-carousel__viewport');
    expect(root(container)).toHaveAttribute('data-rotating', 'true');
    expect(viewport).toHaveAttribute('aria-live', 'off');
    act(() => vi.advanceTimersByTime(1999));
    expect(shown(container)).toBe('Lisbon');
    act(() => vi.advanceTimersByTime(1));
    expect(shown(container)).toBe('Oslo');
    for (const city of ['Kyoto', 'Quito', 'Lisbon']) {
      act(() => vi.advanceTimersByTime(2000));
      expect(shown(container)).toBe(city);
    }
    expectHooksMatchSpec(container, 'CAROUSEL', { slots: ['rotation'] });
  });

  it('UIC-CAROUSEL-3.2 pauses while hovered or focused, but not on its rotation button', () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    const { container } = render(
      <Carousel aria-label="Cities" autoplay interval={1000}>
        {slides()}
      </Carousel>,
    );
    const carousel = root(container);
    fireEvent.pointerEnter(carousel, { pointerType: 'mouse' });
    expect(carousel).not.toHaveAttribute('data-rotating');
    expect(container.querySelector('.ui-carousel__viewport')).toHaveAttribute(
      'aria-live',
      'polite',
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(shown(container)).toBe('Lisbon');
    fireEvent.pointerLeave(carousel);
    act(() => vi.advanceTimersByTime(1000));
    expect(shown(container)).toBe('Oslo');

    act(() => screen.getByRole('button', { name: 'Next slide' }).focus());
    act(() => vi.advanceTimersByTime(3000));
    expect(shown(container)).toBe('Oslo');
    act(() => screen.getByRole('button', { name: 'Stop automatic slide show' }).focus());
    expect(carousel).toHaveAttribute('data-rotating', 'true');
    act(() => (document.activeElement as HTMLElement).blur());
    act(() => vi.advanceTimersByTime(1000));
    expect(shown(container)).toBe('Kyoto');
  });

  it('UIC-CAROUSEL-3.3 stops and restarts with the rotation button', async () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    const { container } = render(
      <Carousel aria-label="Cities" autoplay interval={1000}>
        {slides()}
      </Carousel>,
    );
    const stop = screen.getByRole('button', { name: 'Stop automatic slide show' });
    expect(stop.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'pause');
    fireEvent.click(stop);
    const start = screen.getByRole('button', { name: 'Start automatic slide show' });
    expect(start.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'play');
    act(() => (document.activeElement as HTMLElement | null)?.blur());
    act(() => vi.advanceTimersByTime(5000));
    expect(shown(container)).toBe('Lisbon');
    fireEvent.click(start);
    act(() => (document.activeElement as HTMLElement | null)?.blur());
    act(() => vi.advanceTimersByTime(1000));
    expect(shown(container)).toBe('Oslo');
  });

  it('UIC-CAROUSEL-3.4 starts stopped when the reader prefers reduced motion', () => {
    mockReducedMotion(true);
    vi.useFakeTimers();
    const { container } = render(
      <Carousel aria-label="Cities" autoplay>
        {slides()}
      </Carousel>,
    );
    expect(screen.getByRole('button', { name: 'Start automatic slide show' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(20000));
    expect(shown(container)).toBe('Lisbon');
    expect(root(container)).not.toHaveAttribute('data-rotating');
  });

  it('UIC-CAROUSEL-4.2 forwards the class name, caller attributes and id', () => {
    const { container } = render(
      <Carousel aria-label="Cities" className="hero" id="cities" data-row="2">
        {slides()}
      </Carousel>,
    );
    expect(root(container)).toHaveClass('ui-carousel', 'hero');
    expect(root(container)).toHaveAttribute('id', 'cities');
    expect(root(container)).toHaveAttribute('data-row', '2');
    expectHooksMatchSpec(container, 'CAROUSEL', { callerAttributes: ['data-row'] });
  });
});
