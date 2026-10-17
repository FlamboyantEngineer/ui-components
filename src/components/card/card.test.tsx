import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  Button as AriaButton,
  GridListLoadMoreItem,
  Heading,
  HeadingContext,
  Link as AriaLink,
  useSlottedContext,
} from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider, type UiLinkProps } from '../../core/provider.js';
import { CardGrid, CardGridItem } from './card-grid.js';
import { Card } from './card.js';

const cities = [
  { id: 'lisbon', name: 'Lisbon' },
  { id: 'oslo', name: 'Oslo' },
  { id: 'nairobi', name: 'Nairobi' },
];

describe('Card', () => {
  it('UIC-CARD-1.1 renders a section with header, body and footer parts', () => {
    const { container } = render(
      <Card title="Profile" footer={<small>Updated today</small>}>
        <p>Body content</p>
      </Card>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SECTION');
    const [header, body, footer] = Array.from(root.children);
    expect(header?.tagName).toBe('HEADER');
    expect(header).toHaveClass('ui-card__header');
    expect(body).toHaveClass('ui-card__body');
    expect(body).toHaveTextContent('Body content');
    expect(footer?.tagName).toBe('FOOTER');
    expect(footer).toHaveClass('ui-card__footer');
    expectHooksMatchSpec(container, 'CARD', { slots: ['header', 'title', 'body', 'footer'] });
  });

  it('UIC-CARD-1.1 renders no header or footer without their content', () => {
    const { container } = render(<Card>Only body</Card>);
    expect(container.querySelector('header, footer')).toBeNull();
    expect(container.querySelector('.ui-card__body')).toHaveTextContent('Only body');
    expectHooksMatchSpec(container, 'CARD', { slots: ['body'] });
  });

  it('UIC-CARD-1.2 composes a title block with description and actions', () => {
    const { container } = render(
      <Card
        title="Notifications"
        description="Choose what reaches your inbox."
        actions={<button type="button">Reset</button>}
        footer="Saved automatically"
      >
        Body
      </Card>,
    );
    const header = container.querySelector('.ui-card__header') as HTMLElement;
    const [heading, actions] = Array.from(header.children);
    expect(heading).toHaveClass('ui-card__heading');
    const title = screen.getByRole('heading', { level: 3, name: 'Notifications' });
    expect(title).toHaveClass('ui-card__title');
    expect(title.parentElement).toBe(heading);
    expect(heading?.querySelector('.ui-card__description')).toHaveTextContent(
      'Choose what reaches your inbox.',
    );
    expect(actions).toHaveClass('ui-card__actions');
    expect(actions).toContainElement(screen.getByRole('button', { name: 'Reset' }));
    expectHooksMatchSpec(container, 'CARD', {
      slots: ['header', 'heading', 'title', 'description', 'actions', 'body', 'footer'],
    });
  });

  it('UIC-CARD-1.2 omits empty parts, honours the heading level and lets a custom header win', () => {
    const { container, rerender } = render(
      <Card title="Orders" description="" actions={null} headingLevel={2}>
        Body
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Orders' })).toBeInTheDocument();
    expect(container.querySelector('.ui-card__description, .ui-card__actions')).toBeNull();

    rerender(<Card actions={<button type="button">Add</button>}>Body</Card>);
    expect(container.querySelector('.ui-card__heading')).toBeNull();
    expect(container.querySelector('.ui-card__actions')).toContainElement(
      screen.getByRole('button', { name: 'Add' }),
    );

    rerender(
      <Card header={<h3>Custom</h3>} title="Ignored" actions={<button type="button">X</button>}>
        Body
      </Card>,
    );
    expect(container.querySelector('.ui-card__header')).toHaveTextContent('Custom');
    expect(container.textContent).not.toContain('Ignored');
    expect(container.querySelector('.ui-card__title, .ui-card__actions')).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute('aria-labelledby');
  });

  it('UIC-CARD-1.4 UIC-COMPOSITION-3.1 names a card by the slotted title of a custom header', () => {
    const { container } = render(
      <Card
        header={
          <>
            <Heading slot="title" level={2}>
              Garden plan
            </Heading>
            <Heading>Spring</Heading>
          </>
        }
      >
        Body
      </Card>,
    );
    const region = screen.getByRole('region', { name: 'Garden plan' });
    const title = screen.getByRole('heading', { level: 2, name: 'Garden plan' });
    expect(title).toHaveClass('ui-card__title');
    expect(region).toHaveAttribute('aria-labelledby', title.id);
    expect(screen.getByRole('heading', { name: 'Spring' })).not.toHaveAttribute('id');
    expectHooksMatchSpec(container, 'CARD', { slots: ['header', 'title', 'body'] });
  });

  it('UIC-CARD-1.4 UIC-COMPOSITION-3.1 hands the title props to a host component', () => {
    function HostTitle({ children }: { children: string }) {
      const slot = useSlottedContext(HeadingContext, 'title');
      return (
        <p id={slot?.id} className={slot?.className} ref={slot?.ref}>
          {children}
        </p>
      );
    }
    const { rerender } = render(<Card header={<HostTitle>Seed list</HostTitle>}>Body</Card>);
    expect(screen.getByRole('region', { name: 'Seed list' })).toBeInTheDocument();
    expect(screen.getByText('Seed list')).toHaveClass('ui-card__title');

    rerender(<Card header={<strong>Seed list</strong>}>Body</Card>);
    expect(screen.queryByRole('region')).toBeNull();
    expect(document.querySelector('section')).not.toHaveAttribute('aria-labelledby');

    rerender(
      <Card header={<HostTitle>Seed list</HostTitle>} aria-label="Seeds">
        Body
      </Card>,
    );
    expect(screen.getByRole('region', { name: 'Seeds' })).not.toHaveAttribute('aria-labelledby');
  });

  it('UIC-CARD-1.3 names a titled card by its heading with a unique, stable id', () => {
    const { container, rerender } = render(
      <>
        <Card title="Billing" description="Monthly plan">
          Body
        </Card>
        <Card title="Billing">Body</Card>
      </>,
    );
    const [first, second] = screen.getAllByRole('region', { name: 'Billing' });
    const firstId = first?.getAttribute('aria-labelledby');
    expect(firstId).toBe(first?.querySelector('.ui-card__title')?.id);
    expect(firstId).not.toBe(second?.getAttribute('aria-labelledby'));

    rerender(
      <>
        <Card title="Billing and plan" description="Monthly plan">
          Body
        </Card>
        <Card title="Billing">Body</Card>
      </>,
    );
    const renamed = screen.getByRole('region', { name: 'Billing and plan' });
    expect(renamed).toBe(first);
    expect(renamed.getAttribute('aria-labelledby')).toBe(firstId);
    expectHooksMatchSpec(container, 'CARD');
  });

  it('UIC-CARD-1.3 lets caller names and roles pass through and takes no focus', () => {
    const { container, rerender } = render(
      <Card title="Ignored name" aria-label="Region label" role="listitem">
        Body
      </Card>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('aria-label', 'Region label');
    expect(root).not.toHaveAttribute('aria-labelledby');
    expect(root).toHaveAttribute('role', 'listitem');
    expect(root).not.toHaveAttribute('tabindex');

    rerender(<Card aria-labelledby="external">Body</Card>);
    expect(container.firstElementChild).toHaveAttribute('aria-labelledby', 'external');
  });

  it('UIC-CARD-2.1 UIC-CARD-2.2 publishes variant and density with defaults', () => {
    const { container, rerender } = render(<Card>Body</Card>);
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'default');
    expect(container.firstElementChild).toHaveAttribute('data-density', 'default');
    for (const variant of ['default', 'panel'] as const) {
      for (const density of ['default', 'comfortable', 'compact', 'tight'] as const) {
        rerender(
          <Card variant={variant} density={density} title="Title" footer="Footer">
            Body
          </Card>,
        );
        expect(container.firstElementChild).toHaveAttribute('data-variant', variant);
        expect(container.firstElementChild).toHaveAttribute('data-density', density);
        expectHooksMatchSpec(container, 'CARD', { slots: ['header', 'body', 'footer'] });
      }
    }
  });

  it('UIC-CARD-2.3 publishes the selected state only while selected', () => {
    const { container, rerender } = render(<Card>Body</Card>);
    expect(container.firstElementChild).not.toHaveAttribute('data-selected');
    rerender(<Card isSelected>Body</Card>);
    expect(container.firstElementChild).toHaveAttribute('data-selected', 'true');
    for (const state of ['data-disabled', 'data-pending', 'data-invalid']) {
      expect(container.firstElementChild).not.toHaveAttribute(state);
    }
    expectHooksMatchSpec(container, 'CARD');
  });

  it('UIC-CARD-2.4 publishes the layout options', () => {
    const { container, rerender } = render(<Card>Body</Card>);
    for (const attribute of ['data-interactive', 'data-flush', 'data-fill', 'data-full-width']) {
      expect(container.firstElementChild).not.toHaveAttribute(attribute);
    }
    rerender(
      <Card interactive flush fill fullWidth>
        Body
      </Card>,
    );
    for (const attribute of ['data-interactive', 'data-flush', 'data-fill', 'data-full-width']) {
      expect(container.firstElementChild).toHaveAttribute(attribute, 'true');
    }
    expectHooksMatchSpec(container, 'CARD');
  });

  it('UIC-CARD-2.5 appends the caller class and forwards id, visibility and data attributes', () => {
    const { container } = render(
      <Card className="caller" id="card-1" hidden data-testid="probe" data-variant="caller">
        Body
      </Card>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-card', 'caller');
    expect(root).toHaveAttribute('id', 'card-1');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-variant', 'default');
    expect(root.hidden).toBe(true);
    expectHooksMatchSpec(container, 'CARD');
  });

  it('UIC-CARD-3.1 makes the title a link or a button that names the action', async () => {
    const onAction = vi.fn();
    const { container, rerender } = render(
      <Card title="Lisbon" description="Seven hills" href="#lisbon" target="_blank">
        Body
      </Card>,
    );
    const region = screen.getByRole('region', { name: 'Lisbon' });
    const link = within(region).getByRole('link', { name: 'Lisbon' });
    expect(link).toHaveClass('ui-card__action');
    expect(link.parentElement).toHaveClass('ui-card__title');
    expect(link).toHaveAttribute('href', '#lisbon');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(region).toHaveAttribute('data-interactive', 'true');
    expect(region).not.toHaveAttribute('tabindex');
    expectHooksMatchSpec(container, 'CARD', { slots: ['header', 'title', 'action', 'body'] });

    rerender(
      <Card title="Lisbon" onAction={onAction}>
        Body
      </Card>,
    );
    const button = screen.getByRole('button', { name: 'Lisbon' });
    expect(button).toHaveClass('ui-card__action');
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onAction).toHaveBeenCalledTimes(3);

    rerender(
      <Card title="Lisbon" href="#lisbon" rel="external" onAction={onAction}>
        Body
      </Card>,
    );
    const followed = screen.getByRole('link', { name: 'Lisbon' });
    expect(followed).toHaveAttribute('rel', 'external');
    await userEvent.click(followed);
    expect(onAction).toHaveBeenCalledTimes(4);
  });

  it('UIC-CARD-3.2 forwards clicks on the card to its action but not from inner controls or selections', async () => {
    const onAction = vi.fn();
    const onInner = vi.fn();
    render(
      <Card
        title="Oslo"
        onAction={onAction}
        footer={
          <button type="button" onClick={onInner}>
            Share
          </button>
        }
      >
        <p>Fjords and forests</p>
        <a href="#map">Map</a>
      </Card>,
    );
    await userEvent.click(screen.getByText('Fjords and forests'));
    expect(onAction).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(onInner).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('link', { name: 'Map' }));
    expect(onAction).toHaveBeenCalledTimes(1);

    const text = screen.getByText('Fjords and forests');
    const selection = document.getSelection();
    selection?.selectAllChildren(text);
    fireEvent.click(text);
    expect(onAction).toHaveBeenCalledTimes(1);
    selection?.removeAllRanges();
    text.addEventListener('click', (event) => event.preventDefault(), { once: true });
    fireEvent.click(text);
    expect(onAction).toHaveBeenCalledTimes(1);
    fireEvent.click(text);
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('UIC-CARD-3.2 repeats the modifier keys of a click on a link card', () => {
    const clicks: Array<{ ctrlKey: boolean; shiftKey: boolean }> = [];
    const renderLink = ({ onClick, ...props }: UiLinkProps) => (
      <a
        {...props}
        onClick={(event) => {
          event.preventDefault();
          clicks.push({ ctrlKey: event.ctrlKey, shiftKey: event.shiftKey });
          onClick?.(event);
        }}
      />
    );
    render(
      <UiProvider renderLink={renderLink}>
        <Card title="Nairobi" href="/cities/nairobi">
          <p>Savanna city</p>
        </Card>
      </UiProvider>,
    );
    fireEvent.click(screen.getByText('Savanna city'), { ctrlKey: true });
    fireEvent.click(screen.getByText('Savanna city'), { shiftKey: true });
    expect(clicks).toEqual([
      { ctrlKey: true, shiftKey: false },
      { ctrlKey: false, shiftKey: true },
    ]);
  });

  it('UIC-CARD-3.3 UIC-COMPOSITION-3.1 hands the action to a slotted link or button in a custom header', async () => {
    const onAction = vi.fn();
    const { container, rerender } = render(
      <Card
        href="#garden"
        header={
          <>
            <Heading slot="title">
              <AriaLink slot="action">Garden plan</AriaLink>
            </Heading>
            <AriaButton>Menu</AriaButton>
          </>
        }
      >
        Body
      </Card>,
    );
    const link = screen.getByRole('link', { name: 'Garden plan' });
    expect(link).toHaveClass('ui-card__action');
    expect(link).toHaveAttribute('href', '#garden');
    expect(screen.getByRole('button', { name: 'Menu' })).not.toHaveClass('ui-card__action');
    expect(screen.getByRole('region', { name: 'Garden plan' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'CARD', { slots: ['header', 'title', 'action', 'body'] });

    rerender(
      <Card
        onAction={onAction}
        header={
          <AriaButton slot="action" aria-label="Open the seed list">
            Seeds
          </AriaButton>
        }
      >
        <p>Twelve packets</p>
      </Card>,
    );
    await userEvent.click(screen.getByText('Twelve packets'));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Open the seed list' })).toHaveClass(
      'ui-card__action',
    );
  });

  it('UIC-CARD-4.1 renders media as the first part', () => {
    const { container, rerender } = render(
      <Card title="Harbour" media={<img src="harbour.jpg" alt="Boats at dawn" />}>
        Body
      </Card>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.firstElementChild).toHaveClass('ui-card__media');
    expect(root.firstElementChild?.nextElementSibling).toHaveClass('ui-card__header');
    expect(screen.getByRole('img', { name: 'Boats at dawn' }).parentElement).toBe(
      root.firstElementChild,
    );
    expectHooksMatchSpec(container, 'CARD', { slots: ['media', 'header', 'body'] });
    rerender(<Card media={null}>Body</Card>);
    expect(container.querySelector('.ui-card__media')).toBeNull();
  });

  it('UIC-CARD-4.2 replaces the body with a decorative skeleton while loading', () => {
    const { container, rerender } = render(
      <Card title="Weather" footer="Updated hourly" isLoading>
        <p>Sunny</p>
      </Card>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-loading', 'true');
    expect(root).toHaveAttribute('aria-busy', 'true');
    const skeleton = root.querySelector('.ui-card__body > .ui-card__skeleton');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(root).not.toHaveTextContent('Sunny');
    expect(root.querySelector('.ui-card__footer')).toHaveTextContent('Updated hourly');
    expectHooksMatchSpec(container, 'CARD', { slots: ['header', 'body', 'skeleton', 'footer'] });
    rerender(
      <Card title="Weather" footer="Updated hourly">
        <p>Sunny</p>
      </Card>,
    );
    expect(root).not.toHaveAttribute('data-loading');
    expect(root).not.toHaveAttribute('aria-busy');
    expect(root).toHaveTextContent('Sunny');
  });
});

describe('CardGrid', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-CARD-5.1 renders a labelled grid of card items', async () => {
    const { container } = render(
      <CardGrid aria-label="Cities" items={cities}>
        {(city) => (
          <CardGridItem textValue={city.name}>
            <Card title={city.name} role="group">
              Body
            </Card>
          </CardGridItem>
        )}
      </CardGrid>,
    );
    const grid = screen.getByRole('grid', { name: 'Cities' });
    expect(grid).toHaveClass('ui-card-grid');
    expect(grid).toHaveAttribute('data-layout', 'grid');
    const rows = within(grid).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveClass('ui-card-grid-item');
    expect(within(rows[0] as HTMLElement).getByRole('group', { name: 'Lisbon' })).toHaveClass(
      'ui-card',
    );
    await userEvent.tab();
    expect(rows[0]).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(rows[2]).toHaveFocus();
    await userEvent.keyboard('o');
    expect(rows[1]).toHaveFocus();
    expectHooksMatchSpec(container, 'CARD');
  });

  it('UIC-CARD-5.2 passes empty states and loading sentinels through', () => {
    const onLoadMore = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    const { rerender } = render(
      <CardGrid aria-label="Cities" renderEmptyState={() => 'No cities'}>
        {[]}
      </CardGrid>,
    );
    expect(screen.getByRole('grid')).toHaveAttribute('data-empty', 'true');
    expect(screen.getByRole('grid')).toHaveTextContent('No cities');
    rerender(
      <CardGrid aria-label="Cities">
        <CardGridItem id="lisbon" textValue="Lisbon">
          <Card title="Lisbon" role="group" />
        </CardGridItem>
        <GridListLoadMoreItem isLoading onLoadMore={onLoadMore}>
          Loading more cities
        </GridListLoadMoreItem>
      </CardGrid>,
    );
    expect(screen.getByRole('grid')).toHaveTextContent('Loading more cities');
  });

  it('UIC-CARD-5.3 selects cards with toggles and hands the state to each card', async () => {
    const onSelectionChange = vi.fn();
    const { container, rerender } = render(
      <CardGrid
        aria-label="Cities"
        items={cities}
        selectionMode="multiple"
        defaultSelectedKeys={['oslo']}
        onSelectionChange={onSelectionChange}
      >
        {(city) => (
          <CardGridItem textValue={city.name}>
            {({ isSelected }) => (
              <Card title={city.name} role="group" isSelected={isSelected}>
                Body
              </Card>
            )}
          </CardGridItem>
        )}
      </CardGrid>,
    );
    const rows = screen.getAllByRole('row');
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
    expect(checkboxes[0]?.closest('.ui-card-grid-item__checkbox')).not.toBeNull();
    expect(rows[1]).toHaveAttribute('data-selected', 'true');
    expect(rows[1]?.querySelector('.ui-card')).toHaveAttribute('data-selected', 'true');
    expectHooksMatchSpec(container, 'CARD', { slots: ['checkbox'] });

    const selected = () => [...(onSelectionChange.mock.lastCall?.[0] as Set<string>)].sort();
    await userEvent.click(checkboxes[0] as HTMLElement);
    expect(selected()).toEqual(['lisbon', 'oslo']);
    expect(rows[0]?.querySelector('.ui-card')).toHaveAttribute('data-selected', 'true');
    act(() => (rows[2] as HTMLElement).focus());
    await userEvent.keyboard(' ');
    expect(selected()).toEqual(['lisbon', 'nairobi', 'oslo']);

    rerender(
      <CardGrid
        aria-label="Cities"
        items={cities}
        selectionMode="single"
        selectionBehavior="replace"
      >
        {(city) => (
          <CardGridItem textValue={city.name}>
            <Card title={city.name} role="group" />
          </CardGridItem>
        )}
      </CardGrid>,
    );
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('UIC-CARD-5.4 acts on a card from the grid or the item', async () => {
    const onAction = vi.fn();
    const onOpen = vi.fn();
    render(
      <CardGrid aria-label="Cities" onAction={onAction}>
        <CardGridItem id="lisbon" textValue="Lisbon">
          <Card title="Lisbon" role="group" />
        </CardGridItem>
        <CardGridItem id="oslo" textValue="Oslo" onAction={onOpen}>
          <Card title="Oslo" role="group" />
        </CardGridItem>
      </CardGrid>,
    );
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledWith('lisbon');
    await userEvent.click(screen.getByRole('group', { name: 'Oslo' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
