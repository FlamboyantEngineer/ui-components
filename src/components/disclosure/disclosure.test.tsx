import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { I18nProvider } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { HeadingLevelContext } from '../section-header/section-header.js';
import {
  Disclosure,
  DisclosureGroup,
  DisclosureHeader,
  DisclosurePanel,
  DisclosureTitle,
} from './disclosure.js';

const glyphOf = (trigger: HTMLElement) =>
  trigger.querySelector('.ui-disclosure__indicator')?.getAttribute('data-glyph');

const fruits = ['Apples', 'Pears', 'Plums'] as const;

function FruitGroup(props: Omit<Parameters<typeof DisclosureGroup>[0], 'children'>) {
  return (
    <DisclosureGroup {...props}>
      {fruits.map((fruit) => (
        <Disclosure key={fruit} id={fruit.toLowerCase()} title={fruit}>
          <p>{fruit} in rows</p>
        </Disclosure>
      ))}
    </DisclosureGroup>
  );
}

describe('Disclosure', () => {
  it('UIC-DISCLOSURE-1.1 UIC-DISCLOSURE-4.1 draws a titled trigger in a heading and its panel', () => {
    const { container } = render(
      <Disclosure title="Shipping">
        <p>Ships in two days</p>
      </Disclosure>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-disclosure');
    const heading = screen.getByRole('heading', { level: 3, name: 'Shipping' });
    expect(heading).toHaveClass('ui-disclosure__heading');
    const trigger = within(heading).getByRole('button', { name: 'Shipping' });
    expect(trigger).toHaveClass('ui-disclosure__trigger');
    expect(trigger.querySelector('.ui-disclosure__title')).toHaveTextContent('Shipping');
    expect(trigger.querySelector('.ui-disclosure__indicator')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    const panel = container.querySelector('.ui-disclosure__panel') as HTMLElement;
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('role', 'group');
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel).toHaveTextContent('Ships in two days');
    expectHooksMatchSpec(container, 'DISCLOSURE', {
      slots: ['heading', 'trigger', 'indicator', 'title', 'panel'],
    });
  });

  it('UIC-DISCLOSURE-1.2 toggles its panel and keeps it mounted while collapsed', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Disclosure title="Shipping">
        <input aria-label="Note" defaultValue="Leave at the door" />
      </Disclosure>,
    );
    const root = container.firstElementChild as HTMLElement;
    const trigger = screen.getByRole('button', { name: 'Shipping' });
    const panel = container.querySelector('.ui-disclosure__panel') as HTMLElement;
    expect(panel).toHaveAttribute('hidden', 'until-found');
    expect(panel.style.getPropertyValue('--disclosure-panel-height')).toBe('0px');
    await user.click(trigger);
    expect(root).toHaveAttribute('data-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveAttribute('hidden');
    expect(panel).not.toHaveAttribute('aria-hidden', 'true');
    await user.clear(screen.getByRole('textbox', { name: 'Note' }));
    await user.type(screen.getByRole('textbox', { name: 'Note' }), 'Ring twice');
    await user.click(trigger);
    expect(root).not.toHaveAttribute('data-expanded');
    expect(panel).toHaveAttribute('hidden', 'until-found');
    await user.click(trigger);
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('Ring twice');
    expectHooksMatchSpec(container, 'DISCLOSURE', { slots: ['panel'] });
  });

  it('UIC-DISCLOSURE-1.3 starts expanded or follows a controlled state', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <Disclosure title="Returns" defaultExpanded onExpandedChange={onExpandedChange}>
        Within thirty days
      </Disclosure>,
    );
    const trigger = screen.getByRole('button', { name: 'Returns' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    rerender(
      <Disclosure title="Returns" isExpanded onExpandedChange={onExpandedChange}>
        Within thirty days
      </Disclosure>,
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-DISCLOSURE-1.4 places the indicator at either end and turns it with the state', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Disclosure title="Sizes">S, M and L</Disclosure>);
    const root = container.firstElementChild as HTMLElement;
    const trigger = screen.getByRole('button', { name: 'Sizes' });
    expect(root).toHaveAttribute('data-indicator-position', 'start');
    expect(trigger).toHaveAttribute('data-indicator-position', 'start');
    expect(trigger.firstElementChild).toHaveClass('ui-disclosure__indicator');
    expect(glyphOf(trigger)).toBe('chevron-right');
    await user.click(trigger);
    expect(glyphOf(trigger)).toBe('chevron-down');

    rerender(
      <Disclosure title="Sizes" indicatorPosition="end">
        S, M and L
      </Disclosure>,
    );
    expect(root).toHaveAttribute('data-indicator-position', 'end');
    expect(trigger).toHaveAttribute('data-indicator-position', 'end');
    expect(trigger.lastElementChild).toHaveClass('ui-disclosure__indicator');
    expect(glyphOf(trigger)).toBe('chevron-up');
    await user.click(trigger);
    expect(glyphOf(trigger)).toBe('chevron-down');
    expectHooksMatchSpec(container, 'DISCLOSURE');

    rerender(
      <I18nProvider locale="ar-EG">
        <Disclosure title="Sizes">S, M and L</Disclosure>
      </I18nProvider>,
    );
    expect(glyphOf(screen.getByRole('button', { name: 'Sizes' }))).toBe('chevron-left');
  });

  it('UIC-DISCLOSURE-1.5 takes the automatic heading level and hands the next one to its panel', () => {
    render(
      <HeadingLevelContext value={1}>
        <Disclosure title="Garden" defaultExpanded>
          <Disclosure title="Orchard" defaultExpanded>
            <Disclosure title="Apples">Twelve trees</Disclosure>
          </Disclosure>
        </Disclosure>
        <Disclosure title="Shed" headingLevel={5}>
          <Disclosure title="Tools">Rake</Disclosure>
        </Disclosure>
      </HeadingLevelContext>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Garden' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Orchard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Apples' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 5, name: 'Shed' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 6, name: 'Tools', hidden: true }),
    ).toBeInTheDocument();
  });

  it('UIC-DISCLOSURE-1.6 refuses presses and focus while disabled', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container } = render(
      <Disclosure title="Gift wrap" isDisabled defaultExpanded onExpandedChange={onExpandedChange}>
        Paper and ribbon
      </Disclosure>,
    );
    const root = container.firstElementChild as HTMLElement;
    const trigger = screen.getByRole('button', { name: 'Gift wrap' });
    expect(root).toHaveAttribute('data-disabled', 'true');
    expect(trigger).toHaveAttribute('data-disabled', 'true');
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    await user.tab();
    expect(trigger).not.toHaveFocus();
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expectHooksMatchSpec(container, 'DISCLOSURE');
  });

  it('UIC-DISCLOSURE-1.7 appends the caller class and forwards data attributes, ref and render', () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(
      <Disclosure
        title="Notes"
        className="caller"
        data-owner="notes"
        data-indicator-position="caller"
        ref={ref}
        defaultExpanded
        render={(props, state) => <section {...props} aria-busy={!state.isExpanded} />}
      >
        Plain text
      </Disclosure>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SECTION');
    expect(root).toHaveAttribute('data-owner', 'notes');
    expect(root).toHaveAttribute('aria-busy', 'false');
    expect(root).toHaveClass('ui-disclosure', 'caller');
    expect(root).toHaveAttribute('data-indicator-position', 'start');
    expect(ref.current).toBe(root);
    expectHooksMatchSpec(document.body, 'DISCLOSURE', { callerAttributes: ['data-owner'] });
  });

  it('UIC-DISCLOSURE-1.7 forwards caller attributes on the composed parts', () => {
    render(
      <Disclosure defaultExpanded>
        <DisclosureHeader className="row" id="header" data-part="header">
          <DisclosureTitle className="title" id="title" data-part="title">
            Notes
          </DisclosureTitle>
        </DisclosureHeader>
        <DisclosurePanel className="body" id="body" data-part="panel">
          Plain text
        </DisclosurePanel>
      </Disclosure>,
    );
    const header = document.getElementById('header');
    expect(header).toHaveClass('ui-disclosure__header', 'row');
    expect(header).toHaveAttribute('data-part', 'header');
    const heading = screen.getByRole('heading', { name: 'Notes' });
    expect(heading).toHaveClass('ui-disclosure__heading', 'title');
    expect(heading).toHaveAttribute('id', 'title');
    expect(heading).toHaveAttribute('data-part', 'title');
    const panel = document.getElementById('body');
    expect(panel).toHaveClass('ui-disclosure__panel', 'body');
    expect(panel).toHaveAttribute('data-part', 'panel');
    expect(screen.getByRole('button', { name: 'Notes' })).toHaveAttribute('aria-controls', 'body');
    expectHooksMatchSpec(document.body, 'DISCLOSURE', { callerAttributes: ['data-part'] });
  });
});

describe('Composed disclosures', () => {
  it('UIC-DISCLOSURE-2.1 UIC-DISCLOSURE-2.2 keeps header actions outside the trigger', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onExpandedChange = vi.fn();
    const { container } = render(
      <Disclosure indicatorPosition="end" headingLevel={4} onExpandedChange={onExpandedChange}>
        <DisclosureHeader>
          <DisclosureTitle>Delivery address</DisclosureTitle>
          <button type="button" onClick={onEdit}>
            Edit
          </button>
        </DisclosureHeader>
        <DisclosurePanel
          role="region"
          render={(props, state) => (
            <div {...props} aria-busy={state.isFocusVisibleWithin ? undefined : false} />
          )}
        >
          12 Harbour Road
        </DisclosurePanel>
      </Disclosure>,
    );
    const header = container.querySelector('.ui-disclosure__header') as HTMLElement;
    const heading = within(header).getByRole('heading', { level: 4, name: 'Delivery address' });
    const trigger = within(heading).getByRole('button', { name: 'Delivery address' });
    expect(trigger).toHaveAttribute('data-indicator-position', 'end');
    await user.click(within(header).getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onExpandedChange).not.toHaveBeenCalled();
    await user.click(trigger);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    const region = screen.getByRole('region', { name: 'Delivery address' });
    expect(region).toHaveTextContent('12 Harbour Road');
    expect(region).toHaveAttribute('aria-busy', 'false');
    expectHooksMatchSpec(container, 'DISCLOSURE', { slots: ['header', 'heading', 'panel'] });
  });
});

describe('DisclosureGroup', () => {
  it('UIC-DISCLOSURE-3.1 opens one disclosure at a time unless multiple are allowed', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<FruitGroup />);
    expect(container.firstElementChild).toHaveClass('ui-disclosure-group');
    const button = (name: string) => screen.getByRole('button', { name });
    await user.click(button('Apples'));
    await user.click(button('Pears'));
    expect(button('Apples')).toHaveAttribute('aria-expanded', 'false');
    expect(button('Pears')).toHaveAttribute('aria-expanded', 'true');
    expectHooksMatchSpec(container, 'DISCLOSURE');

    rerender(<FruitGroup allowsMultipleExpanded />);
    await user.click(button('Plums'));
    expect(button('Pears')).toHaveAttribute('aria-expanded', 'true');
    expect(button('Plums')).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-DISCLOSURE-3.2 follows default and controlled expanded keys', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { unmount } = render(
      <FruitGroup defaultExpandedKeys={['pears']} onExpandedChange={onExpandedChange} />,
    );
    expect(screen.getByRole('button', { name: 'Pears' })).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'Plums' }));
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['plums']));
    unmount();

    function Controlled() {
      const [keys, setKeys] = useState<Set<Key>>(new Set(['apples', 'plums']));
      return (
        <>
          <FruitGroup allowsMultipleExpanded expandedKeys={keys} onExpandedChange={setKeys} />
          <output>{[...keys].join(' ')}</output>
          <button type="button" onClick={() => setKeys(new Set())}>
            Collapse all
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('button', { name: 'Plums' })).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'Pears' }));
    expect(screen.getByRole('status')).toHaveTextContent('apples plums pears');
    await user.click(screen.getByRole('button', { name: 'Collapse all' }));
    for (const fruit of fruits) {
      expect(screen.getByRole('button', { name: fruit })).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('UIC-DISCLOSURE-3.2 addresses disclosures whose id is 0 or empty', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <DisclosureGroup
        allowsMultipleExpanded
        defaultExpandedKeys={[0]}
        onExpandedChange={onExpandedChange}
      >
        <Disclosure id={0} title="Zero">
          First
        </Disclosure>
        <Disclosure id="" title="Blank">
          Second
        </Disclosure>
        <Disclosure id="0" title="Text zero">
          Third
        </Disclosure>
      </DisclosureGroup>,
    );
    expect(screen.getByRole('button', { name: 'Zero' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Text zero' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await user.click(screen.getByRole('button', { name: 'Blank' }));
    expect([...(onExpandedChange.mock.lastCall?.[0] as Set<Key>)]).toEqual([0, '']);
    await user.click(screen.getByRole('button', { name: 'Zero' }));
    expect([...(onExpandedChange.mock.lastCall?.[0] as Set<Key>)]).toEqual(['']);
  });

  it('UIC-DISCLOSURE-3.2 lets the group keys win over a disclosure state', () => {
    render(
      <DisclosureGroup defaultExpandedKeys={['figs']}>
        <Disclosure id="figs" title="Figs" defaultExpanded={false}>
          Purple
        </Disclosure>
        <Disclosure id="dates" title="Dates" defaultExpanded>
          Brown
        </Disclosure>
      </DisclosureGroup>,
    );
    expect(screen.getByRole('button', { name: 'Figs' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Dates' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-DISCLOSURE-3.3 UIC-DISCLOSURE-1.7 disables every disclosure of a disabled group', () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(
      <FruitGroup
        isDisabled
        className="caller"
        ref={ref}
        id="fruits"
        data-owner="garden"
        render={(props, state) => <section {...props} aria-disabled={state.isDisabled} />}
      />,
    );
    const group = container.firstElementChild as HTMLElement;
    expect(group.tagName).toBe('SECTION');
    expect(group).toHaveAttribute('aria-disabled', 'true');
    expect(ref.current).toBe(group);
    expect(group).toHaveClass('ui-disclosure-group', 'caller');
    expect(group).toHaveAttribute('id', 'fruits');
    expect(group).toHaveAttribute('data-owner', 'garden');
    expect(group).toHaveAttribute('data-disabled', 'true');
    for (const fruit of fruits) {
      expect(screen.getByRole('button', { name: fruit })).toBeDisabled();
    }
    expect(container.querySelectorAll('.ui-disclosure[data-disabled]')).toHaveLength(3);
    expectHooksMatchSpec(container, 'DISCLOSURE', { callerAttributes: ['data-owner'] });
  });
});

describe('Disclosure accessibility', () => {
  it('UIC-DISCLOSURE-4.2 toggles with Enter and Space and tabs between triggers', async () => {
    const user = userEvent.setup();
    render(<FruitGroup allowsMultipleExpanded />);
    await user.tab();
    const apples = screen.getByRole('button', { name: 'Apples' });
    expect(apples).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(apples).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard(' ');
    expect(apples).toHaveAttribute('aria-expanded', 'false');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Pears' })).toHaveFocus();
  });

  it('UIC-DISCLOSURE-4.2 moves between the triggers of a group with arrows, Home and End', async () => {
    const user = userEvent.setup();
    render(
      <DisclosureGroup defaultExpandedKeys={['three']}>
        <Disclosure id="one" title="One" />
        <Disclosure id="two" title="Two" isDisabled />
        <Disclosure id="three" title="Three">
          <DisclosureGroup>
            <Disclosure id="inner" title="Inner" />
          </DisclosureGroup>
        </Disclosure>
        <Disclosure id="four" title="Four" />
      </DisclosureGroup>,
    );
    const button = (name: string) => screen.getByRole('button', { name });
    button('One').focus();
    await user.keyboard('{ArrowDown}');
    expect(button('Three')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(button('Four')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(button('One')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(button('Four')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(button('One')).toHaveFocus();
    await user.keyboard('{End}');
    expect(button('Four')).toHaveFocus();
    button('Inner').focus();
    await user.keyboard('{ArrowDown}');
    expect(button('Inner')).toHaveFocus();
  });

  it('UIC-DISCLOSURE-4.2 ignores arrow keys outside a group and lets other keys through', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <div onKeyDown={(event) => onKeyDown(event.key)}>
        <Disclosure title="Alone" />
        <Disclosure title="Beside" />
        <FruitGroup />
      </div>,
    );
    screen.getByRole('button', { name: 'Alone' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Alone' })).toHaveFocus();
    screen.getByRole('button', { name: 'Pears' }).focus();
    await user.keyboard('{Escape}{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Plums' })).toHaveFocus();
    expect(onKeyDown.mock.calls).toEqual([['ArrowDown'], ['Escape']]);
  });

  it('UIC-DISCLOSURE-4.3 expands when find in page matches its collapsed panel', () => {
    const onExpandedChange = vi.fn();
    const { container } = render(
      <FruitGroup allowsMultipleExpanded onExpandedChange={onExpandedChange} />,
    );
    const panels = container.querySelectorAll<HTMLElement>('.ui-disclosure__panel');
    fireEvent(panels[1] as HTMLElement, new Event('beforematch'));
    expect(onExpandedChange).toHaveBeenCalledWith(new Set(['pears']));
    expect(screen.getByRole('button', { name: 'Pears' })).toHaveAttribute('aria-expanded', 'true');
  });
});
