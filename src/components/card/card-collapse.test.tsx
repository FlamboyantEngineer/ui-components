import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Board } from '../board/board.js';
import { Card, CardGrid, CardGridItem, CardTitle } from './index.js';

/** A fake `ResizeObserver` whose `resize` reports a new border box for an observed element. */
function installResizeObserver() {
  const observers = new Set<{ callback: ResizeObserverCallback; elements: Set<Element> }>();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private readonly entry: { callback: ResizeObserverCallback; elements: Set<Element> };
      constructor(callback: ResizeObserverCallback) {
        this.entry = { callback, elements: new Set() };
        observers.add(this.entry);
      }
      observe(element: Element) {
        this.entry.elements.add(element);
      }
      unobserve(element: Element) {
        this.entry.elements.delete(element);
      }
      disconnect() {
        observers.delete(this.entry);
      }
    },
  );
  vi.stubGlobal('requestAnimationFrame', (run: FrameRequestCallback) =>
    setTimeout(() => run(0), 0),
  );
  vi.stubGlobal('cancelAnimationFrame', (frame: number) => clearTimeout(frame));
  // Reports the size, then waits for the frame that commits it.
  return async (element: Element, width: number, height = 200) => {
    const entry = {
      target: element,
      borderBoxSize: [{ inlineSize: width, blockSize: height }],
      contentRect: { width, height },
    } as unknown as ResizeObserverEntry;
    await act(async () => {
      for (const observer of observers) {
        if (observer.elements.has(element)) {
          observer.callback([entry], observer as unknown as ResizeObserver);
        }
      }
      await new Promise((done) => setTimeout(done, 0));
    });
  };
}

let resize: ReturnType<typeof installResizeObserver>;
beforeEach(() => {
  resize = installResizeObserver();
});

const cardRoot = () => requireDefined(document.querySelector<HTMLElement>('.ui-card'));
const toggle = () => screen.getByRole('button', { name: 'Details Orchard row' });

function RecordCard(props: Partial<Parameters<typeof Card>[0]>) {
  return (
    <Card
      title="Orchard row"
      leading={<span>Active</span>}
      description="Twelve trees"
      meta="Updated Monday"
      summary="Harvest 40% done"
      actions={<button type="button">Water</button>}
      isCollapsible
      footer="Picked by the morning team"
      {...props}
    >
      <label>
        Notes <input />
      </label>
    </Card>
  );
}

describe('Card collapse', () => {
  it('UIC-CARD-6.1 UIC-CARD-6.2 shows and hides the media, body and footer, keeping them mounted', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container } = render(
      <RecordCard media={<img alt="" src="row.png" />} onExpandedChange={onExpandedChange} />,
    );
    expect(cardRoot()).toHaveAttribute('data-collapsible', 'true');
    expect(cardRoot()).toHaveAttribute('data-expanded', 'true');
    expect(container.querySelector('.ui-card__leading')).toHaveTextContent('Active');
    expect(container.querySelector('.ui-card__meta')).toHaveTextContent('Updated Monday');
    expect(container.querySelector('.ui-card__summary')).toBeNull();
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    const controlled = requireDefined(toggle().getAttribute('aria-controls')).split(' ');
    expect(controlled).toHaveLength(3);
    for (const id of controlled) expect(document.getElementById(id)).not.toBeNull();

    await user.type(screen.getByRole('textbox', { name: 'Notes' }), 'Prune');
    await user.click(toggle());
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(cardRoot()).not.toHaveAttribute('data-expanded');
    for (const id of controlled) expect(document.getElementById(id)).toHaveAttribute('hidden');
    expect(screen.queryByRole('textbox', { name: 'Notes' })).not.toBeInTheDocument();
    expect(container.querySelector('.ui-card__summary')).toHaveTextContent('Harvest 40% done');
    expectHooksMatchSpec(container, 'CARD');

    await user.click(toggle());
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('Prune');
  });

  it('UIC-CARD-6.2 follows a controlled state and leaves the card action alone', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <RecordCard isExpanded onExpandedChange={onExpandedChange} onAction={onAction} />,
    );
    await user.click(toggle());
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(onAction).not.toHaveBeenCalled();
    rerender(<RecordCard isExpanded={false} onAction={onAction} />);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    rerender(<RecordCard isExpanded={false} onAction={onAction} isToggleDisabled />);
    expect(toggle()).toBeDisabled();
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CARD-6.2 moves focus to the toggle when an outside change hides the focused element', async () => {
    const user = userEvent.setup();
    function Owner() {
      const [isExpanded, setExpanded] = useState(true);
      return (
        <>
          <RecordCard isExpanded={isExpanded} onExpandedChange={setExpanded} />
          <button type="button" onClick={() => setExpanded(false)}>
            Collapse all
          </button>
        </>
      );
    }
    render(<Owner />);
    await user.click(screen.getByRole('textbox', { name: 'Notes' }));
    const collapseAll = screen.getByRole('button', { name: 'Collapse all' });
    act(() => {
      collapseAll.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(toggle()).toHaveFocus();
    await user.click(toggle());
    await user.click(collapseAll);
    expect(collapseAll).toHaveFocus();
  });
});

describe('Card collapse in collections', () => {
  it('UIC-CARD-6.2 toggles a card in a board or a selectable grid without moving or selecting it', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const onSelectionChange = vi.fn();
    const items = [{ id: 'soup', title: 'Make soup', column: 'todo' }];
    render(
      <>
        <Board
          aria-label="Kitchen"
          columns={[{ id: 'todo', title: 'To do' }]}
          items={items}
          getColumn={(item) => item.column}
          getTextValue={(item) => item.title}
          onMove={onMove}
          renderCard={(item) => (
            <Card title={item.title} isCollapsible defaultExpanded={false}>
              Two pots
            </Card>
          )}
        />
        <CardGrid
          aria-label="Recipes"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
        >
          <CardGridItem id="tea" textValue="Brew tea">
            <Card title="Brew tea" role="group" isCollapsible defaultExpanded={false}>
              Green leaves
            </Card>
          </CardGridItem>
        </CardGrid>
      </>,
    );
    for (const name of ['Details Make soup', 'Details Brew tea']) {
      const button = screen.getByRole('button', { name });
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    }
    expect(screen.getByText('Two pots')).toBeVisible();
    expect(screen.getByText('Green leaves')).toBeVisible();
    expect(onMove).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});

const steps = { compact: { width: 320 }, minimal: { width: 120 } };

describe('Card adaptive presentation', () => {
  it('UIC-CARD-7.1 picks the presentation from the host breakpoints, with a band before it grows back', async () => {
    const onExpandedChange = vi.fn();
    render(<RecordCard presentationSteps={steps} onExpandedChange={onExpandedChange} />);
    const root = cardRoot();
    await resize(root, 400);
    expect(root).toHaveAttribute('data-presentation', 'full');
    await resize(root, 300);
    expect(root).toHaveAttribute('data-presentation', 'compact');
    await resize(root, 325);
    expect(root).toHaveAttribute('data-presentation', 'compact');
    await resize(root, 330);
    expect(root).toHaveAttribute('data-presentation', 'full');
    await resize(root, 100);
    expect(root).toHaveAttribute('data-presentation', 'minimal');
    await resize(root, 600);
    expect(root).toHaveAttribute('data-presentation', 'full');
    expect(root).toHaveAttribute('data-expanded', 'true');
    expect(onExpandedChange).not.toHaveBeenCalled();
  });

  it('UIC-CARD-7.1 follows height breakpoints, skips missing steps and stays full without any', async () => {
    const { rerender } = render(
      <RecordCard
        fill
        presentationSteps={{ compact: { width: 200, height: 96 }, minimal: { height: 48 } }}
      />,
    );
    await resize(cardRoot(), 260, 80);
    expect(cardRoot()).toHaveAttribute('data-presentation', 'compact');
    await resize(cardRoot(), 260, 40);
    expect(cardRoot()).toHaveAttribute('data-presentation', 'minimal');
    rerender(<RecordCard presentationSteps={{ compact: { width: 200 } }} />);
    await resize(cardRoot(), 40, 30);
    expect(cardRoot()).toHaveAttribute('data-presentation', 'compact');
    rerender(<RecordCard />);
    await resize(cardRoot(), 40, 40);
    expect(cardRoot()).not.toHaveAttribute('data-presentation');
    expect(screen.getByRole('button', { name: 'Water' })).toBeInTheDocument();
  });

  it('UIC-CARD-7.2 moves secondary regions and actions into the More panel when compact', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordCard presentationSteps={steps} />);
    await resize(cardRoot(), 400);
    const water = screen.getByRole('button', { name: 'Water' });
    act(() => water.focus());
    await resize(cardRoot(), 260);
    const more = screen.getByRole('button', { name: 'More Orchard row' });
    expect(more).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Water' })).not.toBeInTheDocument();
    expect(container.querySelector('.ui-card__description')).toBeNull();
    expect(container.querySelector('.ui-card__leading')).toHaveTextContent('Active');
    expect(toggle()).toBeInTheDocument();
    await user.click(more);
    const panel = screen.getByRole('dialog', { name: 'Orchard row' });
    expect(within(panel).getByText('Twelve trees')).toBeInTheDocument();
    expect(within(panel).getByText('Updated Monday')).toBeInTheDocument();
    expect(within(panel).getAllByRole('button', { name: 'Water' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Water' })).toHaveLength(1);
  });

  it('UIC-CARD-7.2 shows the abbreviation and moves the rest, the toggle too, when minimal', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RecordCard presentationSteps={steps} abbreviation="OR" isExpanded={false} />,
    );
    await resize(cardRoot(), 90);
    expect(container.querySelector('.ui-card__abbreviation')).toHaveTextContent('OR');
    expect(container.querySelector('.ui-card__abbreviation')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Orchard row' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Orchard row' })).toBe(cardRoot());
    expect(container.querySelector('.ui-card__leading')).toBeNull();
    expect(container.querySelector(':scope .ui-card > .ui-card__summary')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Details Orchard row' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More Orchard row' }));
    const panel = screen.getByRole('dialog', { name: 'Orchard row' });
    expect(within(panel).getByText('Harvest 40% done')).toBeInTheDocument();
    expect(within(panel).getByText('Active')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Details Orchard row' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('UIC-CARD-6.2 UIC-CARD-7.2 gives a custom header the toggle and keeps its title naming the card', async () => {
    const { container } = render(
      <Card
        presentationSteps={steps}
        isCollapsible
        abbreviation="Q3"
        header={<CardTitle>Quarterly report</CardTitle>}
      >
        Body
      </Card>,
    );
    await resize(cardRoot(), 400);
    expect(screen.getByRole('button', { name: 'Details Quarterly report' })).toBeInTheDocument();
    await resize(cardRoot(), 90);
    expect(container.querySelector('.ui-card__abbreviation')).toHaveTextContent('Q3');
    expect(container.querySelector('.ui-card__heading')).toHaveAttribute('hidden');
    expect(screen.getByRole('region', { name: 'Quarterly report' })).toBe(cardRoot());
    expect(screen.getByRole('button', { name: 'More Quarterly report' })).toBeInTheDocument();
  });
});
