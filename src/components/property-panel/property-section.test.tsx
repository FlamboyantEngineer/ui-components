import { PlusGlyph } from '../../core/glyphs.js';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { Button } from '../button/button.js';
import { PropertyCard } from './property-card.js';
import { PropertyRow } from './property-row.js';
import { PropertySection } from './property-section.js';
import { PropertyGroup, PropertyPanel } from './property-panel.js';
import { Form, useFormValidity } from '../form/form.js';
import { TextField } from '../text-field/text-field.js';
import { PropertyFilter } from '../property-filter/property-filter.js';
import { PropertyScope } from '../property-scope/property-scope.js';
import type { ReactNode } from 'react';

function glyph(trigger: HTMLElement) {
  return trigger.querySelector('[data-glyph]')?.getAttribute('data-glyph');
}

function slots(...names: string[]) {
  return names.map((name) => `ui-property-section__${name}`);
}

function contentOf(container: HTMLElement) {
  return container.querySelector('.ui-property-section__content') as HTMLElement;
}

describe('PropertySection', () => {
  it('UIC-PROPERTY-PANEL-2.1 is an open disclosure whose trigger sits in a heading and controls the content', async () => {
    const onExpandedChange = vi.fn();
    const { container } = render(
      <PropertySection
        title="Layout"
        description="How the page is laid out."
        onExpandedChange={onExpandedChange}
      >
        <p>Orientation</p>
      </PropertySection>,
    );
    const root = container.firstElementChild as HTMLElement;
    const trigger = screen.getByRole('button', { name: 'Layout' });
    expect(root).toHaveClass('ui-property-section');
    expect(root).toHaveAttribute('data-expanded', 'true');
    expect(trigger.closest('h3')).toHaveClass('ui-property-section__heading');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(glyph(trigger)).toBe('chevron-down');
    const content = contentOf(container);
    expect(trigger).toHaveAttribute('aria-controls', content.id);
    expect(content).toHaveAttribute('role', 'group');
    expect(content).toHaveAttribute('aria-labelledby', trigger.id);
    expect(content.firstElementChild).toHaveClass('ui-property-section__description');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', {
      slots: slots('header', 'heading', 'trigger', 'chevron', 'title', 'content', 'description'),
    });

    await userEvent.click(trigger);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(root).not.toHaveAttribute('data-expanded');
    expect(glyph(trigger)).toBe('chevron-right');
    expect(screen.getByText('Orientation')).toBeInTheDocument();
    expect(content).toHaveAttribute('hidden');
  });

  it('UIC-PROPERTY-PANEL-2.1 starts closed, follows a controlled state, takes a heading level and can be disabled', async () => {
    const { rerender } = render(
      <PropertySection title="Paper" defaultExpanded={false}>
        <p>Size</p>
      </PropertySection>,
    );
    expect(screen.getByRole('button', { name: 'Paper' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Size')).toBeInTheDocument();

    const onExpandedChange = vi.fn();
    rerender(
      <PropertySection
        title="Paper"
        isExpanded
        headingLevel={4}
        onExpandedChange={onExpandedChange}
      >
        <p>Size</p>
      </PropertySection>,
    );
    const trigger = screen.getByRole('button', { name: 'Paper' });
    expect(trigger.closest('h4')).not.toBeNull();
    await userEvent.click(trigger);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const { container } = render(
      <PropertySection title="Locked" isDisabled>
        <p>Nothing</p>
      </PropertySection>,
    );
    const locked = screen.getByRole('button', { name: 'Locked' });
    expect(locked).toBeDisabled();
    expect(container.firstElementChild).toHaveAttribute('data-disabled', 'true');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL');
  });

  it('UIC-PROPERTY-PANEL-2.1 points the closed chevron to the inline end from right to left', () => {
    render(
      <UiProvider locale="ar-EG">
        <PropertySection title="Paper" defaultExpanded={false}>
          <p>Size</p>
        </PropertySection>
      </UiProvider>,
    );
    expect(glyph(screen.getByRole('button'))).toBe('chevron-left');
  });

  it('UIC-PROPERTY-PANEL-2.2 counts the rows and cards inside, or shows an explicit count with zero', () => {
    const { container, rerender } = render(
      <PropertySection title="Colours" meta="3 shared">
        <PropertyRow label="Fill">red</PropertyRow>
        <PropertyRow label="Stroke">blue</PropertyRow>
        <PropertyCard name="Shadow">
          <PropertyRow label="Blur">4</PropertyRow>
          <PropertyRow label="Offset">2</PropertyRow>
        </PropertyCard>
      </PropertySection>,
    );
    const trigger = screen.getByRole('button', { name: /^Colours/ });
    const count = container.querySelector('.ui-property-section__count');
    expect(count).toHaveClass('ui-badge');
    expect(count).toHaveTextContent('3');
    expect(trigger).toContainElement(count as HTMLElement);
    const meta = container.querySelector('.ui-property-section__meta');
    expect(meta).toHaveTextContent('3 shared');
    expect(count?.nextElementSibling).toBe(meta);
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', { slots: slots('count', 'meta') });

    rerender(<PropertySection title="Empty">nothing</PropertySection>);
    expect(container.querySelector('.ui-property-section__count')).toBeNull();

    for (const count of [0, 4]) {
      rerender(
        <PropertySection title="Links" count={count}>
          <PropertyRow label="Address">x</PropertyRow>
        </PropertySection>,
      );
      expect(container.querySelector('.ui-property-section__count')).toHaveTextContent(
        String(count),
      );
    }
  });

  it('UIC-PROPERTY-PANEL-2.3 draws actions after the heading that never toggle the section', async () => {
    const onPress = vi.fn();
    const { container } = render(
      <PropertySection
        title="Notes"
        actions={<Button icon={PlusGlyph} label="Add note" onPress={onPress} />}
      >
        <p>Body</p>
      </PropertySection>,
    );
    const actions = container.querySelector('.ui-property-section__actions') as HTMLElement;
    expect(actions.previousElementSibling).toHaveClass('ui-property-section__heading');
    await userEvent.click(screen.getByRole('button', { name: 'Add note' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Notes' })).toHaveAttribute('aria-expanded', 'true');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', { slots: slots('actions') });
  });

  it('UIC-PROPERTY-PANEL-2.4 remembers an uncontrolled state under its key and ignores it when controlled', async () => {
    const storage = createMemoryStorage();
    const section = (
      <UiProvider storage={storage}>
        <PropertySection title="Print" persistKey="sections.print">
          <p>Copies</p>
        </PropertySection>
      </UiProvider>
    );
    const { unmount } = render(section);
    await userEvent.click(screen.getByRole('button', { name: 'Print' }));
    expect(storage.getItem('sections.print')).toBe('false');
    unmount();

    const view = render(section);
    expect(screen.getByRole('button', { name: 'Print' })).toHaveAttribute('aria-expanded', 'false');
    view.unmount();

    render(
      <UiProvider storage={storage}>
        <PropertySection title="Print" persistKey="sections.print" isExpanded>
          <p>Copies</p>
        </PropertySection>
      </UiProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'Print' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(trigger);
    expect(storage.getItem('sections.print')).toBe('false');
  });

  it('UIC-PROPERTY-PANEL-2.4 starts from defaultExpanded when the stored state is not a boolean', async () => {
    const storage = createMemoryStorage({ 'sections.print': '"false"' });
    render(
      <UiProvider storage={storage}>
        <PropertySection title="Print" persistKey="sections.print">
          <p>Copies</p>
        </PropertySection>
      </UiProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'Print' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(trigger);
    expect(storage.getItem('sections.print')).toBe('false');
  });

  it('UIC-PROPERTY-PANEL-2.5 stays mounted while hidden', () => {
    function Draft() {
      const [value, setValue] = useState('Draft');
      return (
        <input aria-label="Name" value={value} onChange={(event) => setValue(event.target.value)} />
      );
    }
    const { container, rerender } = render(
      <PropertySection title="Identity">
        <Draft />
      </PropertySection>,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    rerender(
      <PropertySection title="Identity" hidden>
        <Draft />
      </PropertySection>,
    );
    expect(container.firstElementChild).toHaveAttribute('hidden');
    expect(input).toBeInTheDocument();
  });

  it('UIC-PROPERTY-PANEL-2.7 marks a section holding an overridden row', () => {
    const { container, rerender } = render(
      <PropertySection title="Spacing">
        <PropertyRow label="Before">4</PropertyRow>
        <PropertyRow label="After" isOverridden>
          8
        </PropertyRow>
      </PropertySection>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-overridden', 'true');
    const mark = screen.getByRole('img', { name: 'Contains overridden values' });
    expect(mark).toHaveClass('ui-property-section__override');
    expect(screen.getByRole('button', { name: /^Spacing/ })).toContainElement(mark);
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', { slots: slots('override') });

    rerender(
      <PropertySection title="Spacing">
        <PropertyRow label="Before">4</PropertyRow>
      </PropertySection>,
    );
    expect(root).not.toHaveAttribute('data-overridden');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('UIC-PROPERTY-PANEL-2.8 UIC-PROPERTY-SCOPE-1.7 UIC-FIELD-3.12 reveals a field before focusing it', () => {
  function Sizes({ hideIn }: { hideIn: 'none' | 'section' | 'card' }) {
    const width = <TextField label="Width" name="width" isRequired />;
    return (
      <PropertySection title="Size" defaultExpanded={hideIn !== 'section'}>
        <PropertyGroup heading="Box">
          {hideIn === 'card' ? (
            <PropertyCard name="Frame">
              <PropertyRow label="Width">{width}</PropertyRow>
            </PropertyCard>
          ) : (
            <PropertyRow label="Width">{width}</PropertyRow>
          )}
          <PropertyRow label="Height">
            <TextField label="Height" name="height" defaultValue="2" isRequired />
          </PropertyRow>
        </PropertyGroup>
      </PropertySection>
    );
  }
  function Validate() {
    const validity = useFormValidity();
    return (
      <button type="button" onClick={() => validity?.validate()}>
        Check
      </button>
    );
  }
  function Settings({ children, onSubmit }: { children: ReactNode; onSubmit?: () => void }) {
    return (
      <Form
        aria-label="Settings"
        validationBehavior="aria"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        {children}
        <Validate />
        <button type="submit">Submit</button>
      </Form>
    );
  }
  const width = () => screen.getByRole('textbox', { name: /^Width/, hidden: true });
  const expectRevealed = () => {
    expect(width()).toHaveFocus();
    expect(width().closest('[hidden]')).toBeNull();
    expect(width().closest('[aria-hidden="true"]')).toBeNull();
  };

  it.each([
    ['a filter', 'filter'],
    ['a collapsed section', 'section'],
    ['a collapsed card', 'card'],
  ] as const)('opens %s on submit and on validate()', async (_, hideIn) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const panel = (
      <PropertyFilter aria-label="Shape" defaultQuery={hideIn === 'filter' ? 'Height' : ''}>
        <Sizes hideIn={hideIn === 'filter' ? 'none' : hideIn} />
      </PropertyFilter>
    );
    const { unmount } = render(<Settings onSubmit={onSubmit}>{panel}</Settings>);
    expect(width().closest('[hidden], [aria-hidden="true"]')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expectRevealed();
    expect(onSubmit).not.toHaveBeenCalled();
    if (hideIn === 'filter') {
      expect(screen.getByRole('searchbox')).toHaveValue('');
    } else {
      const trigger = screen.getByRole('button', { name: hideIn === 'card' ? /^Frame/ : /^Size/ });
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    }
    await user.type(width(), '4');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    unmount();

    render(<Settings>{panel}</Settings>);
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expectRevealed();
  });

  it('asks a controlled section and a host-owned query through their callbacks', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const onClear = vi.fn();
    render(
      <Settings>
        <PropertyPanel aria-label="Shape">
          <PropertyScope query="Height" onClear={onClear}>
            <PropertySection title="Size" isExpanded={false} onExpandedChange={onExpandedChange}>
              <PropertyRow label="Width">
                <TextField label="Width" isRequired />
              </PropertyRow>
              <PropertyRow label="Height">
                <TextField label="Height" isRequired />
              </PropertyRow>
            </PropertySection>
          </PropertyScope>
        </PropertyPanel>
      </Settings>,
    );
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    // The owner keeps the section closed; the query stays lifted until it changes.
    expect(screen.getByRole('button', { name: /^Size/ })).toHaveAttribute('aria-expanded', 'false');
    expect(width().closest('.ui-property-row')).not.toHaveAttribute('hidden');
  });

  it('focuses the first blocker in document order and leaves visible fields alone', async () => {
    const user = userEvent.setup();
    render(
      <Settings>
        <PropertyPanel aria-label="Shape">
          <PropertySection title="Visible">
            <PropertyRow label="Name">
              <TextField label="Name" isRequired />
            </PropertyRow>
          </PropertySection>
          <PropertySection title="Closed" defaultExpanded={false}>
            <PropertyRow label="Width">
              <TextField label="Width" isRequired />
            </PropertyRow>
          </PropertySection>
        </PropertyPanel>
      </Settings>,
    );
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByRole('textbox', { name: /^Name/ })).toHaveFocus();
    expect(screen.getByRole('button', { name: /^Closed/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await user.type(screen.getByRole('textbox', { name: /^Name/ }), 'Box');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expectRevealed();
  });
});

it('UIC-PROPERTY-PANEL-2.2 propagates the section count appearance without slot-specific visuals', () => {
  const { container, rerender } = render(
    <PropertySection title="Items" count={0}>
      <p>Content</p>
    </PropertySection>,
  );
  expect(container.querySelector('.ui-property-section__count')).toHaveAttribute(
    'data-variant',
    'subtle',
  );
  rerender(
    <PropertySection title="Items" count={7} countVariant="solid">
      <p>Content</p>
    </PropertySection>,
  );
  expect(container.querySelector('.ui-property-section__count')).toHaveAttribute(
    'data-variant',
    'solid',
  );
});
