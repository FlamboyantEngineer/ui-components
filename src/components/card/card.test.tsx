import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Card } from './card.js';

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
    expectHooksMatchSpec(container, 'CARD', { slots: 'all' });
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
});
