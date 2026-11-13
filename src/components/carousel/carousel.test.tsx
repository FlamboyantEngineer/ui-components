import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useEffect, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
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

/** Stubs the reduced-motion media query; the returned function changes the preference. */
function mockReducedMotion(matches: boolean) {
  const listeners = new Set<() => void>();
  const list = {
    matches,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => list),
  );
  return (next: boolean) => {
    list.matches = next;
    act(() => {
      for (const listener of listeners) listener();
    });
  };
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

  it('UIC-CAROUSEL-2.1 moves with the arrow keys, mirrored right to left', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Carousel aria-label="Cities">{slides()}</Carousel>);
    act(() => screen.getByRole('button', { name: 'Next slide' }).focus());
    await user.keyboard('{ArrowRight}');
    expect(shown(container)).toBe('Oslo');
    await user.keyboard('{Control>}{ArrowRight}{/Control}');
    expect(shown(container)).toBe('Oslo');
    await user.keyboard('{ArrowLeft}');
    expect(shown(container)).toBe('Lisbon');
    rerender(
      <UiProvider locale="ar-EG">
        <Carousel aria-label="Cities">
          {[...slides(), <input key="field" aria-label="Note" />]}
        </Carousel>
      </UiProvider>,
    );
    act(() => screen.getByRole('button', { name: 'Next slide' }).focus());
    await user.keyboard('{ArrowLeft}');
    expect(shown(container)).toBe('Oslo');
  });

  it('UIC-CAROUSEL-2.1 leaves keys alone inside a text field', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Carousel aria-label="Notes">
        <input aria-label="First note" />
        <p>Second</p>
      </Carousel>,
    );
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{ArrowRight}');
    expect(container.querySelector('.ui-carousel__slide[data-current] input')).not.toBeNull();
  });

  it('UIC-CAROUSEL-2.1 leaves keys to editable content and to widgets that handled them', async () => {
    const user = userEvent.setup();
    render(
      <Carousel aria-label="Notes">
        <div role="textbox" aria-label="First note" contentEditable="plaintext-only" tabIndex={0} />
        <div
          role="group"
          aria-label="Second note"
          tabIndex={0}
          onKeyDown={(event) => event.preventDefault()}
        />
      </Carousel>,
    );
    act(() => screen.getByRole('textbox', { name: 'First note' }).focus());
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('textbox', { name: 'First note' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    act(() => screen.getByRole('group', { name: 'Second note' }).focus());
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('group', { name: 'Second note' })).toBeVisible();
  });

  it('UIC-CAROUSEL-1.2 points the previous and next chevrons the other way right to left', () => {
    const { container } = render(
      <UiProvider locale="ar-EG">
        <Carousel aria-label="Cities">{slides()}</Carousel>
      </UiProvider>,
    );
    expect(
      container.querySelector('.ui-carousel__previous [data-glyph="chevron-right"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('.ui-carousel__next [data-glyph="chevron-left"]'),
    ).not.toBeNull();
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

  it('UIC-CAROUSEL-2.2 moves focus when the host shows another slide', () => {
    const { container, rerender } = render(
      <Carousel aria-label="Cities" index={0}>
        {slides()}
      </Carousel>,
    );
    act(() => screen.getByRole('link', { name: 'Read about Lisbon' }).focus());
    rerender(
      <Carousel aria-label="Cities" index={1}>
        {slides()}
      </Carousel>,
    );
    expect(container.querySelector('.ui-carousel__slide[data-current]')).toHaveFocus();
    expect(shown(container)).toBe('Oslo');
  });

  it.each([
    ['the first', 'Lisbon', 0, 'Oslo'],
    ['the last', 'Quito', 3, 'Kyoto'],
  ])(
    'UIC-CAROUSEL-2.2 moves focus to the next shown slide when %s focused slide is removed',
    (_, removed, index, next) => {
      const without = slides().filter((slide) => slide.key !== removed);
      const { container, rerender } = render(
        <Carousel aria-label="Cities" defaultIndex={index}>
          {slides()}
        </Carousel>,
      );
      act(() => screen.getByRole('link', { name: `Read about ${removed}` }).focus());
      rerender(
        <Carousel aria-label="Cities" defaultIndex={index}>
          {without}
        </Carousel>,
      );
      expect(shown(container)).toBe(next);
      expect(container.querySelector('.ui-carousel__slide[data-current]')).toHaveFocus();
    },
  );

  it('UIC-CAROUSEL-2.2 forgets a refused move once focus leaves the carousel', async () => {
    const user = userEvent.setup();
    const carousel = (index: number) => (
      <>
        <Carousel aria-label="Cities" index={index} onIndexChange={() => {}}>
          {slides()}
        </Carousel>
        <button type="button">After</button>
      </>
    );
    const { container, rerender } = render(carousel(0));
    screen.getByRole('link', { name: 'Read about Lisbon' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(shown(container)).toBe('Lisbon');
    await user.click(screen.getByRole('button', { name: 'After' }));
    rerender(carousel(1));
    expect(shown(container)).toBe('Oslo');
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('UIC-CAROUSEL-2.2 keeps focus in a carousel inside a shadow root', async () => {
    const user = userEvent.setup();
    const host = document.body.appendChild(document.createElement('div'));
    const shadow = host.attachShadow({ mode: 'open' });
    const container = shadow.appendChild(document.createElement('div'));
    try {
      render(<Carousel aria-label="Cities">{slides()}</Carousel>, { container });
      within(container).getByRole('link', { name: 'Read about Lisbon' }).focus();
      await user.keyboard('{ArrowRight}');
      const current = container.querySelector('.ui-carousel__slide[data-current]');
      expect(current).toHaveAttribute('aria-label', '2 of 4');
      expect(shadow.activeElement).toBe(current);
    } finally {
      host.remove();
    }
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
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(shown(container)).toBe('Lisbon');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(shown(container)).toBe('Oslo');
    for (const city of ['Kyoto', 'Quito', 'Lisbon']) {
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(shown(container)).toBe(city);
    }
    expectHooksMatchSpec(container, 'CAROUSEL', { slots: ['rotation'] });
  });

  it('UIC-CAROUSEL-3.2 pauses while hovered or focused, but not on its rotation button', async () => {
    mockReducedMotion(false);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(
      <Carousel aria-label="Cities" autoplay interval={1000}>
        {slides()}
      </Carousel>,
    );
    const carousel = root(container);
    await user.hover(carousel);
    expect(carousel).not.toHaveAttribute('data-rotating');
    expect(container.querySelector('.ui-carousel__viewport')).toHaveAttribute(
      'aria-live',
      'polite',
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(shown(container)).toBe('Lisbon');
    await user.unhover(carousel);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(shown(container)).toBe('Oslo');

    act(() => screen.getByRole('button', { name: 'Next slide' }).focus());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(shown(container)).toBe('Oslo');
    act(() => screen.getByRole('button', { name: 'Stop automatic slide show' }).focus());
    expect(carousel).toHaveAttribute('data-rotating', 'true');
    act(() => (document.activeElement as HTMLElement).blur());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(shown(container)).toBe('Kyoto');
  });

  it('UIC-CAROUSEL-3.3 stops and restarts with the rotation button', async () => {
    mockReducedMotion(false);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(
      <Carousel aria-label="Cities" autoplay interval={1000}>
        {slides()}
      </Carousel>,
    );
    const stop = screen.getByRole('button', { name: 'Stop automatic slide show' });
    expect(stop.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'pause');
    await user.click(stop);
    const start = screen.getByRole('button', { name: 'Start automatic slide show' });
    expect(start.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'play');
    await user.unhover(start);
    act(() => (document.activeElement as HTMLElement | null)?.blur());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(shown(container)).toBe('Lisbon');
    await user.click(start);
    await user.unhover(start);
    act(() => (document.activeElement as HTMLElement | null)?.blur());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
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
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(shown(container)).toBe('Lisbon');
    expect(root(container)).not.toHaveAttribute('data-rotating');
  });

  it('UIC-CAROUSEL-3.4 follows a reduced-motion preference that changes until the reader chooses', async () => {
    const setReducedMotion = mockReducedMotion(false);
    const user = userEvent.setup();
    const { container } = render(
      <Carousel aria-label="Cities" autoplay>
        {slides()}
      </Carousel>,
    );
    expect(screen.getByRole('button', { name: 'Stop automatic slide show' })).toBeInTheDocument();
    setReducedMotion(true);
    expect(screen.getByRole('button', { name: 'Start automatic slide show' })).toBeInTheDocument();
    expect(root(container)).not.toHaveAttribute('data-rotating');
    setReducedMotion(false);
    expect(screen.getByRole('button', { name: 'Stop automatic slide show' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stop automatic slide show' }));
    setReducedMotion(true);
    setReducedMotion(false);
    expect(screen.getByRole('button', { name: 'Start automatic slide show' })).toBeInTheDocument();
  });

  it('UIC-CAROUSEL-3.4 hydrates the server HTML without a mismatch, then stops for reduced motion', () => {
    mockReducedMotion(true);
    const carousel = (
      <Carousel aria-label="Cities" autoplay>
        {slides()}
      </Carousel>
    );
    const host = document.createElement('div');
    document.body.append(host);
    host.innerHTML = renderToString(carousel);
    expect(root(host)).toHaveAttribute('data-rotating');
    const errors: unknown[] = [];
    let hydrated: ReturnType<typeof hydrateRoot> | undefined;
    act(() => {
      hydrated = hydrateRoot(host, carousel, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
    expect(root(host)).not.toHaveAttribute('data-rotating');
    act(() => hydrated?.unmount());
    host.remove();
  });

  it('UIC-CAROUSEL-4.2 forwards ref to its root', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <Carousel aria-label="Cities" ref={ref}>
        {slides()}
      </Carousel>,
    );
    expect(ref.current).toBe(container.querySelector('.ui-carousel'));
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

  describe('pages, mounting and swiping', () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    function letterSlides() {
      return letters.map((letter) => <p key={letter}>Card {letter}</p>);
    }
    function shownCards(container: HTMLElement) {
      return [...container.querySelectorAll('.ui-carousel__slide:not([hidden])')].map(
        (slide) => slide.textContent,
      );
    }

    it('UIC-CAROUSEL-1.5 shows three slides a page and moves two, ending on a full page', async () => {
      const user = userEvent.setup();
      const onIndexChange = vi.fn();
      const { container } = render(
        <Carousel
          aria-label="Cards"
          slidesPerPage={3}
          slidesPerMove={2}
          onIndexChange={onIndexChange}
        >
          {letterSlides()}
        </Carousel>,
      );
      expect(root(container).style.getPropertyValue('--ui-carousel-per-page')).toBe('3');
      expect(shownCards(container)).toEqual(['Card A', 'Card B', 'Card C']);
      const slotsShown = [
        ...container.querySelectorAll<HTMLElement>('.ui-carousel__slide[data-current]'),
      ].map((slide) => slide.style.getPropertyValue('--ui-carousel-slot'));
      expect(slotsShown).toEqual(['1', '2', '3']);
      expectHooksMatchSpec(container, 'CAROUSEL', { slots: ['viewport', 'slide', 'dot'] });
      const dots = within(screen.getByRole('group', { name: 'Choose a slide' })).getAllByRole(
        'button',
      );
      expect(dots.map((dot) => dot.getAttribute('aria-label'))).toEqual([
        'Slide 1',
        'Slide 3',
        'Slide 5',
      ]);
      const next = screen.getByRole('button', { name: 'Next slide' });
      await user.click(next);
      expect(onIndexChange).toHaveBeenLastCalledWith(2);
      expect(shownCards(container)).toEqual(['Card C', 'Card D', 'Card E']);
      await user.click(next);
      expect(shownCards(container)).toEqual(['Card E', 'Card F', 'Card G']);
      expect(next).toHaveAttribute('aria-disabled', 'true');
      expect(dots[2]).toHaveAttribute('aria-current', 'true');
      await user.click(dots[0] as HTMLElement);
      expect(shownCards(container)).toEqual(['Card A', 'Card B', 'Card C']);
      expect(screen.getByRole('button', { name: 'Previous slide' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('UIC-CAROUSEL-1.5 loops between the first and the last page and clamps a late index', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Carousel aria-label="Cards" slidesPerPage={3} slidesPerMove={2} loop index={6}>
          {letterSlides()}
        </Carousel>,
      );
      expect(shownCards(container)).toEqual(['Card E', 'Card F', 'Card G']);
      const { container: looping } = render(
        <Carousel aria-label="Looping" slidesPerPage={3} slidesPerMove={2} loop defaultIndex={4}>
          {letterSlides()}
        </Carousel>,
      );
      const region = within(screen.getByRole('region', { name: 'Looping' }));
      await user.click(region.getByRole('button', { name: 'Next slide' }));
      expect(shownCards(looping)).toEqual(['Card A', 'Card B', 'Card C']);
      await user.click(region.getByRole('button', { name: 'Previous slide' }));
      expect(shownCards(looping)).toEqual(['Card E', 'Card F', 'Card G']);
    });

    it('UIC-CAROUSEL-1.4 UIC-CAROUSEL-1.5 draws no navigation when one page shows every slide', () => {
      render(
        <Carousel aria-label="Few" slidesPerPage={3}>
          {letterSlides().slice(0, 3)}
        </Carousel>,
      );
      expect(screen.queryByRole('button', { name: 'Next slide' })).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Choose a slide' })).not.toBeInTheDocument();
    });

    it('UIC-CAROUSEL-1.6 mounts slides once shown and keeps them, following slide keys', async () => {
      const user = userEvent.setup();
      const mounts: string[] = [];
      function Counted({ name }: { name: string }) {
        const [count, setCount] = useState(0);
        useEffect(() => {
          mounts.push(name);
        }, [name]);
        return (
          <button type="button" onClick={() => setCount(count + 1)}>
            {name} pressed {count}
          </button>
        );
      }
      const deck = (names: string[]) => (
        <Carousel aria-label="Deck" mountSlides="visited">
          {names.map((name) => (
            <Counted key={name} name={name} />
          ))}
        </Carousel>
      );
      const { container, rerender } = render(deck(['One', 'Two', 'Three']));
      expect(mounts).toEqual(['One']);
      const groups = container.querySelectorAll('.ui-carousel__slide');
      expect(groups[0]).toHaveAttribute('data-mounted', 'true');
      expect(groups[1]).not.toHaveAttribute('data-mounted');
      expect(groups[1]).toBeEmptyDOMElement();
      expectHooksMatchSpec(container, 'CAROUSEL', { slots: ['slide'] });
      await user.click(screen.getByRole('button', { name: 'One pressed 0' }));
      const next = screen.getByRole('button', { name: 'Next slide' });
      await user.click(next);
      expect(mounts).toEqual(['One', 'Two']);
      await user.click(screen.getByRole('button', { name: 'Previous slide' }));
      expect(screen.getByRole('button', { name: 'One pressed 1' })).toBeInTheDocument();
      expect(mounts).toEqual(['One', 'Two']);
      rerender(deck(['One', 'Three']));
      rerender(deck(['One', 'Two', 'Three']));
      await user.click(next);
      expect(mounts).toEqual(['One', 'Two', 'Two']);
      expect(container.querySelectorAll('.ui-carousel__slide')[2]).toBeEmptyDOMElement();
    });

    it('UIC-CAROUSEL-2.3 moves one page for a deliberate swipe in reading direction only', async () => {
      const user = userEvent.setup();
      const onIndexChange = vi.fn();
      const { container } = render(
        <Carousel aria-label="Cities" allowsSwiping onIndexChange={onIndexChange}>
          {slides()}
        </Carousel>,
      );
      expect(root(container)).toHaveAttribute('data-swipeable', 'true');
      const viewport = container.querySelector('.ui-carousel__viewport') as HTMLElement;
      expect(viewport.style.touchAction).toBe('pan-y pinch-zoom');
      const swipe = (from: number, to: number, dy = 0) =>
        user.pointer([
          { keys: '[TouchA>]', target: viewport, coords: { clientX: from, clientY: 100 } },
          {
            pointerName: 'TouchA',
            target: viewport,
            coords: { clientX: (from + to) / 2, clientY: 100 + dy / 2 },
          },
          { pointerName: 'TouchA', target: viewport, coords: { clientX: to, clientY: 100 + dy } },
          { keys: '[/TouchA]', target: viewport },
        ]);
      await swipe(200, 180);
      expect(onIndexChange).not.toHaveBeenCalled();
      await swipe(200, 120);
      expect(onIndexChange).toHaveBeenLastCalledWith(1);
      await swipe(200, 190, 120);
      expect(onIndexChange).toHaveBeenCalledTimes(1);
      await swipe(100, 180);
      expect(onIndexChange).toHaveBeenLastCalledWith(0);
    });

    it('UIC-CAROUSEL-2.3 mirrors swipes right to left and leaves links and cancelled drags alone', async () => {
      const user = userEvent.setup();
      const onIndexChange = vi.fn();
      const { container } = render(
        <UiProvider locale="ar-EG">
          <Carousel aria-label="Cities" allowsSwiping onIndexChange={onIndexChange}>
            {slides()}
          </Carousel>
        </UiProvider>,
      );
      const viewport = container.querySelector('.ui-carousel__viewport') as HTMLElement;
      await user.pointer([
        { keys: '[MouseLeft>]', target: viewport, coords: { clientX: 100, clientY: 50 } },
        { target: viewport, coords: { clientX: 140, clientY: 50 } },
        { target: viewport, coords: { clientX: 180, clientY: 50 } },
      ]);
      expect(viewport).toHaveAttribute('data-swiping', 'true');
      expect(viewport.style.getPropertyValue('--ui-carousel-swipe-offset')).toBe('80px');
      expectHooksMatchSpec(container, 'CAROUSEL', { slots: ['viewport'] });
      await user.pointer({ keys: '[/MouseLeft]', target: viewport });
      expect(onIndexChange).toHaveBeenLastCalledWith(1);
      expect(viewport).not.toHaveAttribute('data-swiping');
      const link = screen.getByRole('link', { name: 'Read about Oslo' });
      await user.pointer([
        { keys: '[MouseLeft>]', target: link, coords: { clientX: 100, clientY: 50 } },
        { target: link, coords: { clientX: 200, clientY: 50 } },
        { keys: '[/MouseLeft]', target: link },
      ]);
      expect(onIndexChange).toHaveBeenCalledTimes(1);
      await user.pointer([
        { keys: '[TouchA>]', target: viewport, coords: { clientX: 200, clientY: 50 } },
        { pointerName: 'TouchA', target: viewport, coords: { clientX: 100, clientY: 50 } },
      ]);

      fireEvent.pointerCancel(viewport, { pointerId: 2 });
      await user.pointer({ keys: '[/TouchA]', target: viewport });
      expect(onIndexChange).toHaveBeenCalledTimes(1);
      await user.pointer([
        { keys: '[MouseLeft>]', target: viewport, coords: { clientX: 100, clientY: 50 } },
        { target: viewport, coords: { clientX: 200, clientY: 50 } },
      ]);
      fireEvent.lostPointerCapture(viewport);
      expect(viewport).not.toHaveAttribute('data-swiping');
      await user.pointer({ keys: '[/MouseLeft]', target: viewport });
      expect(onIndexChange).toHaveBeenCalledTimes(1);
    });

    it('UIC-CAROUSEL-2.3 drops a press released outside before it became a swipe', async () => {
      const user = userEvent.setup();
      const onIndexChange = vi.fn();
      const { container } = render(
        <Carousel aria-label="Cities" allowsSwiping onIndexChange={onIndexChange}>
          {slides()}
        </Carousel>,
      );
      const viewport = container.querySelector('.ui-carousel__viewport') as HTMLElement;
      // Pressed, moved a few pixels and released outside: the viewport never sees the release.
      await user.pointer([
        { keys: '[MouseLeft>]', target: viewport, coords: { clientX: 200, clientY: 50 } },
        { target: viewport, coords: { clientX: 196, clientY: 50 } },
        { keys: '[/MouseLeft]', target: document.body },
      ]);
      // Back over the viewport with no button held, the pointer drags nothing.
      await user.pointer({ target: viewport, coords: { clientX: 120, clientY: 50 } });
      expect(viewport).not.toHaveAttribute('data-swiping');
      // The next press is a swipe of its own.
      await user.pointer([
        { keys: '[MouseLeft>]', target: viewport, coords: { clientX: 200, clientY: 50 } },
        { target: viewport, coords: { clientX: 160, clientY: 50 } },
        { target: viewport, coords: { clientX: 120, clientY: 50 } },
      ]);
      expect(viewport).toHaveAttribute('data-swiping', 'true');
      await user.pointer({ keys: '[/MouseLeft]', target: viewport });
      expect(onIndexChange).toHaveBeenLastCalledWith(1);
    });
  });
});
