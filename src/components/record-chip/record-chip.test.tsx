import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Badge } from '../badge/badge.js';
import { RecordChip } from './record-chip.js';

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`.ui-record-chip__${name}`);

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe('RecordChip', () => {
  afterEach(async () => {
    if (vi.isFakeTimers()) await advance(5000);
    vi.useRealTimers();
  });

  it('UIC-RECORD-CHIP-1.1 draws the label then the version, type and state', () => {
    const { container } = render(
      <RecordChip
        identifier="REQ-12"
        name="Brake pressure limits"
        icon="folder"
        version="v3"
        type="Requirement"
        state={<Badge tone="success">Approved</Badge>}
      />,
    );
    const element = root(container);
    expect(element).toHaveClass('ui-record-chip');
    expect(element).toHaveAttribute('data-layout', 'inline');
    expect(element).toHaveAttribute('data-size', 'md');
    const children = Array.from(element.children);
    expect(children.map((child) => child.className.split(' ')[0])).toEqual([
      'ui-record-label',
      'ui-record-chip__version',
      'ui-record-chip__type',
      'ui-record-chip__state',
    ]);
    expect(slot(container, 'label')).toHaveTextContent('REQ-12 Brake pressure limits');
    expect(slot(container, 'version')).toHaveTextContent('v3');
    expect(slot(container, 'type')).toHaveTextContent('Requirement');
    expect(slot(container, 'state')?.querySelector('.ui-badge')).toHaveTextContent('Approved');
    expectHooksMatchSpec(container, 'RECORD-CHIP', {
      slots: ['label', 'version', 'type', 'state'],
    });
  });

  it('UIC-RECORD-CHIP-1.1 leaves out the parts it is not given and sizes the label', () => {
    const { container } = render(<RecordChip identifier="REQ-12" size="sm" />);
    expect(root(container).children).toHaveLength(1);
    expect(root(container)).toHaveAttribute('data-size', 'sm');
    expect(slot(container, 'label')).toHaveAttribute('data-size', 'sm');
  });

  it('UIC-RECORD-CHIP-1.2 moves the name to a second line that describes the link', () => {
    const { container } = render(
      <RecordChip
        identifier="REQ-12"
        name="Brake pressure limits"
        href="/records/12"
        type="Requirement"
        layout="stacked"
      />,
    );
    expect(root(container)).toHaveAttribute('data-layout', 'stacked');
    const header = slot(container, 'header');
    expect(header?.firstElementChild).toHaveClass('ui-record-chip__label');
    expect(header).toContainElement(slot(container, 'type') as HTMLElement);
    const name = slot(container, 'name');
    expect(name).toHaveClass('ui-truncation-tooltip');
    expect(header?.nextElementSibling).toBe(name);
    const link = screen.getByRole('link', { name: 'REQ-12' });
    expect(link).toHaveAttribute('aria-describedby', name?.id);
    expect(link).toHaveAccessibleDescription('Brake pressure limits');
    expect(container.querySelector('.ui-record-label__name')).toBeNull();
    expectHooksMatchSpec(container, 'RECORD-CHIP', { slots: ['label', 'header', 'type', 'name'] });
  });

  it('UIC-RECORD-CHIP-1.3 previews a linked record on hover', async () => {
    vi.useFakeTimers();
    render(
      <RecordChip identifier="REQ-12" href="/records/12" preview={<p>Owner: Maria Santos</p>} />,
    );
    const link = screen.getByRole('link', { name: 'REQ-12' });
    fireEvent.pointerMove(link, { pointerType: 'mouse' });
    fireEvent.pointerEnter(link, { pointerType: 'mouse' });
    fireEvent.mouseEnter(link);
    await advance(700);
    const card = document.querySelector('.ui-record-chip__preview');
    expect(card).toHaveClass('ui-hover-card');
    expect(card).toHaveTextContent('Owner: Maria Santos');
    expectHooksMatchSpec(document.body, 'RECORD-CHIP', { slots: ['label', 'preview'] });
  });

  it('UIC-RECORD-CHIP-1.3 ignores the preview of a record without a link', async () => {
    vi.useFakeTimers();
    const { container } = render(
      <RecordChip identifier="REQ-12" name="Limits" preview={<p>Owner: Jon Berg</p>} />,
    );
    const label = slot(container, 'label') as HTMLElement;
    expect(label).not.toHaveAttribute('tabindex');
    expect(label).not.toHaveAttribute('aria-haspopup');
    fireEvent.pointerEnter(label, { pointerType: 'mouse' });
    await advance(700);
    expect(document.querySelector('.ui-record-chip__preview')).toBeNull();
  });

  it('UIC-RECORD-CHIP-1.4 removes the reference with a named button', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { container } = render(
      <RecordChip identifier="REQ-12" type="Requirement" onRemove={onRemove} />,
    );
    const remove = screen.getByRole('button', { name: 'Remove REQ-12' });
    expect(remove).toHaveClass('ui-record-chip__remove', 'ui-icon-button');
    expect(root(container).lastElementChild).toBe(remove);
    await user.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('UIC-RECORD-CHIP-1.5 shows only the unavailable text and keeps remove', () => {
    const { container } = render(
      <RecordChip
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
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('button', { name: 'Remove Missing item' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'RECORD-CHIP', { slots: ['label', 'remove'] });
  });

  it('UIC-RECORD-CHIP-1.6 forwards the class, id and data attributes', () => {
    const { container } = render(
      <RecordChip identifier="REQ-12" className="extra" id="chip" data-row="7" />,
    );
    expect(root(container)).toHaveClass('ui-record-chip', 'extra');
    expect(root(container)).toHaveAttribute('id', 'chip');
    expect(root(container)).toHaveAttribute('data-row', '7');
    expect(root(container)).not.toHaveAttribute('role');
    expectHooksMatchSpec(container, 'RECORD-CHIP', { callerAttributes: ['data-row'] });
  });
});
