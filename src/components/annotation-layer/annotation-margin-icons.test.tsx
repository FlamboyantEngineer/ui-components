import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  type Annotation,
  AnnotationLayer,
  AnnotationMargin,
  type AnnotationMarginProps,
} from './annotation-layer.js';

/** Markers are 20 pixels tall, and an open card adds 50. */
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (!this.classList.contains('ui-annotation-layer__entry')) return 0;
    return this.querySelector('.ui-annotation-layer__card') ? 70 : 20;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const line = (top: number, left = 0) => [{ top, left, width: 40, height: 18 }];

const annotations: Annotation[] = [
  { id: 'first', rects: line(10) },
  { id: 'second', rects: line(10, 60) },
  { id: 'third', rects: line(200) },
];

function Notes({
  items = annotations,
  ...props
}: Partial<AnnotationMarginProps> & { items?: Annotation[] }) {
  return (
    <AnnotationLayer annotations={items}>
      <p>Whisk the eggs with the sugar until pale.</p>
      <AnnotationMargin
        presentation="icons"
        renderMarker={(annotation, { isOpen }) => `${String(annotation.id)}${isOpen ? '*' : ''}`}
        renderCard={(annotation) => <button type="button">Reply to {String(annotation.id)}</button>}
        {...props}
      />
    </AnnotationLayer>
  );
}

const entries = () => [...document.querySelectorAll<HTMLElement>('.ui-annotation-layer__entry')];

describe('AnnotationMargin icons', () => {
  it('UIC-ANNOTATION-LAYER-2.5 draws a named marker per annotation, stacking those on one line', () => {
    const { container } = render(<Notes />);
    const list = screen.getByRole('list', { name: 'Annotations' });
    expect(list).toHaveAttribute('data-presentation', 'icons');
    expect(list).not.toHaveAttribute('data-empty');
    const markers = within(list).getAllByRole('button');
    expect(markers.map((marker) => marker.getAttribute('aria-label'))).toEqual([
      'Annotation 1 of 3',
      'Annotation 2 of 3',
      'Annotation 3 of 3',
    ]);
    expect(markers[0]).toHaveAttribute('aria-expanded', 'false');
    expect(markers[0]).toHaveTextContent('first');
    expect(entries().map((entry) => entry.style.top)).toEqual(['10px', '38px', '200px']);
    expect(screen.queryByRole('button', { name: /Reply/ })).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'ANNOTATION-LAYER', {
      slots: ['margin', 'entry', 'marker'],
    });
  });

  it('UIC-ANNOTATION-LAYER-2.5 opens several cards at once and lays the markers out again', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Notes onOpenChange={onOpenChange} />);
    const first = screen.getByRole('button', { name: 'Annotation 1 of 3' });
    const second = screen.getByRole('button', { name: 'Annotation 2 of 3' });
    const third = screen.getByRole('button', { name: 'Annotation 3 of 3' });
    await user.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    const card = document.getElementById(first.getAttribute('aria-controls') ?? '');
    expect(card).toHaveClass('ui-annotation-layer__card');
    expect(card).toHaveTextContent('Reply to first');
    expect(entries()[0]).toHaveAttribute('data-open', 'true');
    expect(entries()[0]).toHaveAttribute('data-active', 'true');
    await user.click(third);
    expect(onOpenChange).toHaveBeenLastCalledWith(new Set(['first', 'third']));
    expect(screen.getAllByRole('button', { name: /Reply/ })).toHaveLength(2);
    expect(entries().map((entry) => entry.style.top)).toEqual(['0px', '78px', '200px']);
    await user.click(second);
    await user.click(second);
    expect(second).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange).toHaveBeenLastCalledWith(new Set(['first', 'third']));
  });

  it('UIC-ANNOTATION-LAYER-2.5 moves between markers from one tab stop and closes a card on Escape', async () => {
    const user = userEvent.setup();
    const onCurrentKeyChange = vi.fn();
    render(
      <AnnotationLayer annotations={annotations} onCurrentKeyChange={onCurrentKeyChange}>
        <p>Whisk the eggs.</p>
        <AnnotationMargin
          presentation="icons"
          defaultOpenKeys={['second']}
          renderCard={(annotation) => <input aria-label={`Reply to ${String(annotation.id)}`} />}
        />
      </AnnotationLayer>,
    );
    await user.tab();
    const first = screen.getByRole('button', { name: 'Annotation 1 of 3' });
    expect(first).toHaveFocus();
    expect(first).toHaveTextContent('1');
    expect(onCurrentKeyChange).toHaveBeenLastCalledWith('first');
    await user.keyboard('{ArrowDown}');
    const second = screen.getByRole('button', { name: 'Annotation 2 of 3' });
    expect(second).toHaveFocus();
    expect(onCurrentKeyChange).toHaveBeenLastCalledWith('second');
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Annotation 3 of 3' })).toHaveFocus();
    await user.click(screen.getByRole('textbox', { name: 'Reply to second' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute('tabindex', '0');
  });

  it('UIC-ANNOTATION-LAYER-2.5 follows controlled open cards and the active annotation', () => {
    const { rerender } = render(<Notes openKeys={['third']} />);
    expect(screen.getByRole('button', { name: 'Reply to third' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annotation 3 of 3' })).toHaveTextContent('third*');
    rerender(<Notes openKeys={[]} />);
    expect(screen.queryByRole('button', { name: /Reply/ })).not.toBeInTheDocument();
  });

  it('UIC-ANNOTATION-LAYER-2.6 marks an empty margin in both presentations', () => {
    const { rerender } = render(<Notes items={[]} />);
    expect(screen.getByRole('list')).toHaveAttribute('data-empty', 'true');
    rerender(<Notes items={[]} presentation="cards" />);
    expect(screen.getByRole('list')).toHaveAttribute('data-presentation', 'cards');
    expect(screen.getByRole('list')).toHaveAttribute('data-empty', 'true');
    rerender(<Notes presentation="cards" />);
    expect(screen.getByRole('list')).not.toHaveAttribute('data-empty');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
