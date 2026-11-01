import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ShadowHost, deepActive, inShadow, shadowRootOf } from '../../../test/shadow-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Board } from '../board/board.js';
import { Card, CardAction, CardGrid, CardGridItem, CardTitle } from './index.js';

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
    expect(container.querySelector('.ui-card__summary')).toHaveAttribute('hidden');
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
    expect(container.querySelector('.ui-card__summary')).not.toHaveAttribute('hidden');
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

describe('Card header row', () => {
  it('UIC-CARD-6.3 keeps the leading content, title, toggle and More in the first row and the actions after them', () => {
    const { container } = render(
      <Card
        title="Orchard row 4"
        leading={<span>Active</span>}
        actions={<button type="button">Water</button>}
        isCollapsible
      >
        Body
      </Card>,
    );
    const header = requireDefined(container.querySelector('.ui-card__header'));
    expect(
      [...header.children].map((child) =>
        [...child.classList].find((name) => name.startsWith('ui-card__')),
      ),
    ).toEqual(['ui-card__leading', 'ui-card__heading', 'ui-card__toggle', 'ui-card__actions']);
    const toggle = screen.getByRole('button', { name: 'Details Orchard row 4' });
    const water = screen.getByRole('button', { name: 'Water' });
    expect(toggle.compareDocumentPosition(water) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

  it('UIC-CARD-3.2 UIC-CARD-7.2 still presses the card from its body after the cut title tooltip closes', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <Card title="A long orchard row title" onAction={onAction} presentationSteps={steps}>
        <p>Body notes</p>
      </Card>,
    );
    await resize(cardRoot(), 260);
    expect(cardRoot()).toHaveAttribute('data-presentation', 'compact');
    const text = requireDefined(cardRoot().querySelector<HTMLElement>('.ui-truncation-tooltip'));
    Object.defineProperty(text, 'clientWidth', { configurable: true, value: 100 });
    Object.defineProperty(text, 'scrollWidth', { configurable: true, value: 240 });
    await user.hover(text);
    const tooltip = await screen.findByRole('tooltip', {}, { timeout: 2000 });
    expect(tooltip).toHaveTextContent('A long orchard row title');
    expect(tooltip.querySelector('[id]')).toBeNull();
    expect(tooltip.querySelector('button')?.closest('[inert]')).not.toBeNull();
    await user.unhover(text);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await user.click(screen.getByText('Body notes'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('UIC-CARD-7.2 hides secondary regions and actions behind More when compact', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordCard presentationSteps={steps} />);
    await resize(cardRoot(), 400);
    expect(screen.queryByRole('button', { name: 'More Orchard row' })).not.toBeInTheDocument();
    const water = screen.getByRole('button', { name: 'Water' });
    act(() => water.focus());
    await resize(cardRoot(), 260);
    const more = screen.getByRole('button', { name: 'More Orchard row' });
    expect(more).toHaveFocus();
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Water' })).not.toBeInTheDocument();
    expect(container.querySelector('.ui-card__description')).toHaveAttribute('hidden');
    expect(container.querySelector('.ui-card__leading')).not.toHaveAttribute('hidden');
    expect(toggle()).toBeInTheDocument();
    const controls = requireDefined(more.getAttribute('aria-controls')).split(' ');
    expect(controls.map((id) => document.getElementById(id)?.className)).toEqual([
      'ui-card__description',
      'ui-card__meta',
      'ui-card__actions',
    ]);
    await user.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Twelve trees')).toBeVisible();
    expect(screen.getByText('Updated Monday')).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Water' })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Water' }));
    await user.keyboard('{Escape}');
    expect(more).toHaveFocus();
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Water' })).not.toBeInTheDocument();
  });

  it('UIC-CARD-7.2 returns focus to More inside a shadow root, not to a same-id element outside', async () => {
    render(
      <ShadowHost name="card">
        <RecordCard presentationSteps={steps} />
      </ShadowHost>,
    );
    const root = requireDefined(shadowRootOf('card').querySelector<HTMLElement>('.ui-card'));
    await resize(root, 260);
    const more = inShadow('card').getByRole('button', { name: 'More Orchard row' });
    const decoy = document.createElement('button');
    decoy.id = more.id;
    document.body.append(decoy);
    try {
      // React Aria presses need its shadow DOM flag, which stays off in unit tests (UIC-PORTAL-1.8).
      // eslint-disable-next-line testing-library/prefer-user-event
      fireEvent.click(more);
      const water = await inShadow('card').findByRole('button', { name: 'Water' });
      act(() => water.focus());
      // eslint-disable-next-line testing-library/prefer-user-event
      fireEvent.keyDown(water, { key: 'Escape' });
      expect(more).toHaveAttribute('aria-expanded', 'false');
      expect(deepActive()).toBe(more);
    } finally {
      decoy.remove();
    }
  });

  it('UIC-CARD-7.2 leaves a composing or handled Escape to the control in a revealed region', async () => {
    const user = userEvent.setup();
    let cancelsEscape = false;
    const onFieldKeyDown = vi.fn((event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && cancelsEscape) event.preventDefault();
    });
    render(
      <RecordCard
        presentationSteps={steps}
        meta={<input aria-label="Filter" onKeyDown={onFieldKeyDown} />}
      />,
    );
    await resize(cardRoot(), 260);
    const more = screen.getByRole('button', { name: 'More Orchard row' });
    await user.click(more);
    const field = screen.getByRole('textbox', { name: 'Filter' });
    act(() => field.focus());
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot mark a key as part of a composition
    expect(fireEvent.keyDown(field, { key: 'Escape', isComposing: true })).toBe(true);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(field).toHaveFocus();

    cancelsEscape = true;
    await user.keyboard('{Escape}');
    expect(onFieldKeyDown).toHaveBeenCalled();
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(field).toHaveFocus();

    cancelsEscape = false;
    await user.keyboard('{Escape}');
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveFocus();
  });

  it('UIC-CARD-7.2 closes only the More whose region holds the Escape in nested cards', async () => {
    const user = userEvent.setup();
    const inner = (
      <Card
        title="Inner row"
        description="Three trees"
        actions={<button type="button">Prune</button>}
        isCollapsible
        presentationSteps={steps}
      >
        Inner notes
      </Card>
    );
    render(<RecordCard presentationSteps={steps} meta={inner} />);
    const [outerRoot, innerRoot] = Array.from(document.querySelectorAll<HTMLElement>('.ui-card'));
    await resize(requireDefined(outerRoot), 260);
    const outerMore = screen.getByRole('button', { name: 'More Orchard row' });
    await user.click(outerMore);
    await resize(requireDefined(innerRoot), 260);
    const innerMore = screen.getByRole('button', { name: 'More Inner row' });
    await user.click(innerMore);
    // The inner card's toggle is not in a region its More revealed: the outer region holds it.
    act(() => screen.getByRole('button', { name: 'Details Inner row' }).focus());
    await user.keyboard('{Escape}');
    expect(outerMore).toHaveAttribute('aria-expanded', 'false');
    expect(outerMore).toHaveFocus();
    await user.click(outerMore);
    expect(innerMore).toHaveAttribute('aria-expanded', 'true');
    act(() => screen.getByRole('button', { name: 'Prune' }).focus());
    await user.keyboard('{Escape}');
    expect(innerMore).toHaveAttribute('aria-expanded', 'false');
    expect(innerMore).toHaveFocus();
    expect(outerMore).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-CARD-7.2 keeps moved header content mounted with its state across presentations', async () => {
    const user = userEvent.setup();
    const finish = vi.fn<(done: () => void) => void>();
    function Counter() {
      const [count, setCount] = useState(0);
      const [isSaving, setSaving] = useState(false);
      return (
        <button
          type="button"
          onClick={() => {
            setSaving(true);
            finish.mockImplementationOnce((done) => done());
            setTimeout(() =>
              finish(() => {
                setSaving(false);
                setCount((value) => value + 1);
              }),
            );
          }}
        >
          {isSaving ? 'Saving' : `Saved ${count}`}
        </button>
      );
    }
    render(
      <RecordCard
        presentationSteps={steps}
        abbreviation="OR"
        actions={
          <>
            <label>
              Draft <input />
            </label>
            <Counter />
          </>
        }
      />,
    );
    await resize(cardRoot(), 400);
    await user.type(screen.getByRole('textbox', { name: 'Draft' }), 'Unsaved');
    const draft = screen.getByRole('textbox', { name: 'Draft' });
    await user.click(screen.getByRole('button', { name: 'Saved 0' }));
    await resize(cardRoot(), 260);
    await user.click(screen.getByRole('button', { name: 'More Orchard row' }));
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(draft);
    expect(draft).toHaveValue('Unsaved');
    await user.click(screen.getByRole('button', { name: 'More Orchard row' }));
    await resize(cardRoot(), 90);
    await user.click(screen.getByRole('button', { name: 'More Orchard row' }));
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(draft);
    await resize(cardRoot(), 400);
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(draft);
    expect(draft).toHaveValue('Unsaved');
    expect(screen.getByRole('button', { name: 'Saved 1' })).toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: 'Draft' })).toHaveLength(1);
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
    expect(container.querySelector('.ui-card__leading')).toHaveAttribute('hidden');
    expect(container.querySelector('.ui-card__summary')).toHaveAttribute('hidden');
    expect(screen.queryByRole('button', { name: 'Details Orchard row' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More Orchard row' }));
    expect(screen.getByText('Harvest 40% done')).toBeVisible();
    expect(screen.getByText('Active')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Details Orchard row' })).toHaveAttribute(
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

  it.each([true, false])(
    'UIC-CARD-7.2 reveals a minimal custom header with its own actions (collapsible: %s)',
    async (isCollapsible) => {
      const user = userEvent.setup();
      const archive = vi.fn();
      const onAction = vi.fn();
      render(
        <Card
          presentationSteps={steps}
          isCollapsible={isCollapsible}
          abbreviation="RC"
          onAction={onAction}
          header={
            <>
              <CardTitle>
                <CardAction>Record</CardAction>
              </CardTitle>
              <label>
                Note <input />
              </label>
              <button type="button" onClick={archive}>
                Archive record
              </button>
            </>
          }
        >
          Body
        </Card>,
      );
      await resize(cardRoot(), 400);
      await user.type(screen.getByRole('textbox', { name: 'Note' }), 'Keep');
      const note = screen.getByRole('textbox', { name: 'Note' });
      await resize(cardRoot(), 90);
      expect(screen.queryByRole('button', { name: 'Archive record' })).not.toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Record' })).toBe(cardRoot());
      const more = screen.getByRole('button', { name: 'More Record' });
      await user.click(more);
      await user.click(screen.getByRole('button', { name: 'Archive record' }));
      expect(archive).toHaveBeenCalledOnce();
      expect(onAction).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox', { name: 'Note' })).toBe(note);
      expect(note).toHaveValue('Keep');
      expect(screen.getAllByRole('button', { name: 'Archive record' })).toHaveLength(1);
      expect(screen.queryAllByRole('button', { name: 'Details Record' }).length).toBe(
        isCollapsible ? 1 : 0,
      );
      await user.click(screen.getByRole('button', { name: 'Record' }));
      expect(onAction).toHaveBeenCalledOnce();
    },
  );
});
