import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Section, SectionHeader, type HeadingLevel } from './section-header.js';

const levels: HeadingLevel[] = [1, 2, 3, 4, 5, 6];

describe('SectionHeader', () => {
  it('UIC-SECTION-HEADER-1.1 renders the title and description before the actions', () => {
    const { container } = render(
      <SectionHeader
        title="Orchard"
        description="Apples and pears"
        actions={<button type="button">Add tree</button>}
      />,
    );
    const header = container.firstElementChild!;
    expect(header.tagName).toBe('HEADER');
    expect(header).toHaveClass('ui-section-header');
    const [content, actions] = Array.from(header.children);
    expect(content).toHaveClass('ui-section-header__content');
    expect(content!.querySelector('.ui-section-header__title')).toHaveTextContent('Orchard');
    expect(content!.querySelector('.ui-section-header__description')).toHaveTextContent(
      'Apples and pears',
    );
    expect(actions).toHaveClass('ui-section-header__actions');
    expect(actions).toContainElement(screen.getByRole('button', { name: 'Add tree' }));
    expectHooksMatchSpec(container, 'SECTION-HEADER', {
      slots: ['content', 'title', 'description', 'actions'],
    });
  });

  it('UIC-SECTION-HEADER-1.1 renders no description or actions slot for empty values', () => {
    for (const empty of [undefined, null, false, '']) {
      const { container, unmount } = render(
        <SectionHeader title="Orchard" description={empty} actions={empty} />,
      );
      expect(container.querySelector('.ui-section-header__description')).toBeNull();
      expect(container.querySelector('.ui-section-header__actions')).toBeNull();
      unmount();
    }
    const { container } = render(<SectionHeader title="Orchard" description={0} />);
    expect(container.querySelector('.ui-section-header__description')).toHaveTextContent('0');
  });

  it('UIC-SECTION-HEADER-1.2 renders each heading level with a unique id that survives rerenders', () => {
    const { container, rerender } = render(
      <>
        {levels.map((level) => (
          <SectionHeader key={level} title="<Settings>" headingLevel={level} />
        ))}
        <SectionHeader title="Default" />
      </>,
    );
    const headings = Array.from(container.querySelectorAll('.ui-section-header__title'));
    expect(headings.map((heading) => heading.tagName)).toEqual([
      'H1',
      'H2',
      'H3',
      'H4',
      'H5',
      'H6',
      'H3',
    ]);
    expect(headings[0]).toHaveTextContent('<Settings>');
    const ids = headings.map((heading) => heading.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    rerender(
      <>
        {levels.map((level) => (
          <SectionHeader key={level} title="Renamed" headingLevel={level} />
        ))}
        <SectionHeader title="Default" />
      </>,
    );
    expect(
      Array.from(container.querySelectorAll('.ui-section-header__title'), (h) => h.id),
    ).toEqual(ids);
  });

  it('UIC-SECTION-HEADER-1.3 names a section by its title only and leaves a standalone header unnamed', () => {
    const { container } = render(
      <>
        <SectionHeader title="Standalone" description="Not a name" />
        <Section
          title="Orchard"
          description="Apples and pears"
          actions={<button type="button">Add tree</button>}
          headingLevel={2}
        >
          <p>Twelve trees</p>
        </Section>
      </>,
    );
    const region = screen.getByRole('region', { name: 'Orchard' });
    expect(region.tagName).toBe('SECTION');
    expect(region).toHaveClass('ui-section', 'ui-stack');
    expect(region).toHaveAttribute('data-space', 'md');
    expect(region).not.toHaveAttribute('data-grow');
    const heading = screen.getByRole('heading', { level: 2, name: 'Orchard' });
    expect(region).toHaveAttribute('aria-labelledby', heading.id);
    expect(region.firstElementChild).toHaveClass('ui-section-header');
    expect(region).toHaveTextContent('Twelve trees');
    for (const header of container.querySelectorAll('.ui-section-header')) {
      expect(header).not.toHaveAttribute('aria-labelledby');
      expect(header).not.toHaveAttribute('aria-label');
    }
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expectHooksMatchSpec(container, 'SECTION-HEADER');
  });

  it('UIC-SECTION-HEADER-1.3 passes spacing and containment to the stack', () => {
    const { container } = render(
      <Section title="Orchard" space="compact" grow fill clip>
        Trees
      </Section>,
    );
    const region = container.firstElementChild!;
    expect(region).toHaveAttribute('data-space', 'compact');
    expect(region).toHaveAttribute('data-grow', 'true');
    expect(region).toHaveAttribute('data-fill', 'true');
    expect(region).toHaveAttribute('data-clip', 'true');
    expectHooksMatchSpec(container, 'SECTION-HEADER');
  });

  it('UIC-SECTION-HEADER-1.4 keeps content, ids and action behaviour across rerenders', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const view = (title: string, disabled: boolean) => (
      <Section
        title={title}
        description={disabled ? null : 'Description'}
        actions={
          <button type="button" disabled={disabled} onClick={onPress}>
            Refresh
          </button>
        }
      >
        <input defaultValue="retained draft" aria-label="Notes" />
      </Section>
    );
    const { rerender } = render(view('Settings', false));
    const region = screen.getByRole('region', { name: 'Settings' });
    const labelledBy = region.getAttribute('aria-labelledby');
    const input = screen.getByRole('textbox', { name: 'Notes' });
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(view('Updated settings', true));
    expect(screen.getByRole('region', { name: 'Updated settings' })).toBe(region);
    expect(region.getAttribute('aria-labelledby')).toBe(labelledBy);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBe(input);
    expect(region.querySelector('.ui-section-header__description')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(region.querySelector('[aria-busy], [aria-disabled]')).toBeNull();
  });

  it('UIC-SECTION-HEADER-1.5 appends caller classes and forwards ids and data attributes', () => {
    const { container } = render(
      <>
        <SectionHeader title="Orchard" className="caller" id="orchard" data-owner="garden" />
        <Section
          title="Meadow"
          className="caller-section"
          id="meadow"
          data-owner="field"
          data-space="huge"
        >
          Grass
        </Section>
      </>,
    );
    const [header, section] = Array.from(container.children);
    expect(header).toHaveClass('ui-section-header', 'caller');
    expect(header).toHaveAttribute('id', 'orchard');
    expect(header).toHaveAttribute('data-owner', 'garden');
    expect(section).toHaveClass('ui-section', 'caller-section');
    expect(section).toHaveAttribute('id', 'meadow');
    expect(section).toHaveAttribute('data-owner', 'field');
    expect(section).toHaveAttribute('data-space', 'md');
    expectHooksMatchSpec(container, 'SECTION-HEADER', { callerAttributes: ['data-owner'] });
  });
});
