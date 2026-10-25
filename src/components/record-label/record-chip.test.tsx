import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Badge } from '../badge/badge.js';
import { RecordLabel } from './record-label.js';

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`.ui-record-label__${name}`);

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe('RecordLabel', () => {
  afterEach(async () => {
    if (vi.isFakeTimers()) await advance(5000);
    vi.useRealTimers();
  });

  it('UIC-RECORD-LABEL-11.1 draws the label then the version, type and state', () => {
    const { container } = render(
      <RecordLabel
        mode="chip"
        identifier="REQ-12"
        name="Brake pressure limits"
        icon="folder"
        version="v3"
        type="Requirement"
        state={<Badge tone="success">Approved</Badge>}
      />,
    );
    const element = root(container);
    expect(element).toHaveClass('ui-record-label');
    expect(element).toHaveAttribute('data-layout', 'inline');
    expect(element).toHaveAttribute('data-size', 'md');
    const children = Array.from(element.children);
    expect(children.map((child) => child.className.split(' ')[0])).toEqual([
      'ui-record-label__label',
      'ui-record-label__version',
      'ui-record-label__type',
      'ui-record-label__state',
    ]);
    expect(slot(container, 'label')).toHaveTextContent('REQ-12 Brake pressure limits');
    expect(slot(container, 'version')).toHaveTextContent('v3');
    expect(slot(container, 'type')).toHaveTextContent('Requirement');
    expect(slot(container, 'state')?.querySelector('.ui-badge')).toHaveTextContent('Approved');
    expectHooksMatchSpec(container, 'RECORD-LABEL', {
      slots: ['label', 'version', 'type', 'state'],
    });
  });

  it('UIC-RECORD-LABEL-11.1 leaves out the parts it is not given and sizes the label', () => {
    const { container } = render(<RecordLabel mode="chip" identifier="REQ-12" size="sm" />);
    expect(root(container).children).toHaveLength(1);
    expect(root(container)).toHaveAttribute('data-size', 'sm');
    expect(slot(container, 'label')).toHaveAttribute('data-size', 'sm');
  });

  it('UIC-RECORD-LABEL-11.2 moves the name to a second line that describes the link', () => {
    const { container } = render(
      <RecordLabel
        mode="chip"
        identifier="REQ-12"
        name="Brake pressure limits"
        href="/records/12"
        type="Requirement"
        layout="stacked"
      />,
    );
    expect(root(container)).toHaveAttribute('data-layout', 'stacked');
    const header = slot(container, 'header');
    expect(header?.firstElementChild).toHaveClass('ui-record-label__label');
    expect(header).toContainElement(slot(container, 'type') as HTMLElement);
    const name = slot(container, 'name');
    expect(name).toHaveClass('ui-truncation-tooltip');
    expect(header?.nextElementSibling).toBe(name);
    const link = screen.getByRole('link', { name: 'REQ-12' });
    expect(link).toHaveAttribute('aria-describedby', name?.id);
    expect(link).toHaveAccessibleDescription('Brake pressure limits');
    expect(container.querySelector('.ui-record-label__label .ui-record-label__name')).toBeNull();
    expectHooksMatchSpec(container, 'RECORD-LABEL', { slots: ['label', 'header', 'type', 'name'] });
  });

  it('UIC-RECORD-LABEL-11.3 previews a linked record on hover', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RecordLabel
        mode="chip"
        identifier="REQ-12"
        href="/records/12"
        preview={<p>Owner: Maria Santos</p>}
      />,
    );
    const link = screen.getByRole('link', { name: 'REQ-12' });
    // Move onto the page first, so React Aria reads a pointer modality when the link is entered.
    await user.pointer({ target: document.body });
    await user.hover(link);
    await advance(700);
    const card = document.querySelector('.ui-record-label__preview');
    expect(card).toHaveClass('ui-hover-card');
    expect(card).toHaveTextContent('Owner: Maria Santos');
    expectHooksMatchSpec(document.body, 'RECORD-LABEL', { slots: ['label', 'preview'] });
  });

  it('UIC-RECORD-LABEL-11.3 ignores the preview of a record without a link', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(
      <RecordLabel
        mode="chip"
        identifier="REQ-12"
        name="Limits"
        preview={<p>Owner: Jon Berg</p>}
      />,
    );
    const label = slot(container, 'label') as HTMLElement;
    expect(label).not.toHaveAttribute('tabindex');
    expect(label).not.toHaveAttribute('aria-haspopup');
    await user.pointer({ target: document.body });
    await user.hover(label);
    await advance(700);
    expect(document.querySelector('.ui-record-label__preview')).toBeNull();
  });

  it('UIC-RECORD-LABEL-11.4 removes the reference with a named button', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { container } = render(
      <RecordLabel mode="chip" identifier="REQ-12" type="Requirement" onRemove={onRemove} />,
    );
    const remove = screen.getByRole('button', { name: 'Remove REQ-12' });
    expect(remove).toHaveClass('ui-record-label__remove', 'ui-button');
    expect(root(container).lastElementChild).toBe(remove);
    await user.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('UIC-RECORD-LABEL-11.5 shows only the unavailable text and keeps remove', () => {
    const { container } = render(
      <RecordLabel
        mode="chip"
        identifier="REQ-12"
        name="Limits"
        href="/records/12"
        version="v3"
        type="Requirement"
        state={<Badge>Draft</Badge>}
        layout="stacked"
        preview={<p>Owner</p>}
        unavailable="missing"
        onRemove={() => {}}
      />,
    );
    expect(root(container)).toHaveAttribute('data-unavailable', 'missing');
    expect(root(container)).toHaveAttribute('data-layout', 'inline');
    expect(root(container)).toHaveTextContent(/^Missing item$/);
    for (const name of ['version', 'type', 'state', 'name', 'header', 'preview']) {
      expect(slot(container, name)).toBeNull();
    }
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Missing item' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'RECORD-LABEL', { slots: ['label', 'remove'] });
  });

  it('UIC-RECORD-LABEL-11.6 forwards the class, id and data attributes', () => {
    const { container } = render(
      <RecordLabel mode="chip" identifier="REQ-12" className="extra" id="chip" data-row="7" />,
    );
    expect(root(container)).toHaveClass('ui-record-label', 'extra');
    expect(root(container)).toHaveAttribute('id', 'chip');
    expect(root(container)).toHaveAttribute('data-row', '7');
    expect(root(container)).not.toHaveAttribute('role');
    expectHooksMatchSpec(container, 'RECORD-LABEL', { callerAttributes: ['data-row'] });
  });
});
