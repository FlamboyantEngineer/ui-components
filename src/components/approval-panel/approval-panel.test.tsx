import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Section } from '../section-header/section-header.js';
import { ApprovalPanel, type ApprovalPanelApprover } from './approval-panel.js';

const now = new Date(2026, 4, 20, 10, 30);
const getNow = () => now;

const approvers: ApprovalPanelApprover[] = [
  {
    id: 'maria',
    person: { name: 'Maria Santos' },
    decision: 'approved',
    time: new Date(2026, 4, 20, 9, 30).toISOString(),
    comment: 'Looks good.',
  },
  { id: 'jon', person: { name: 'Jon Berg' }, decision: 'pending' },
  {
    id: 'quality',
    person: { name: 'Quality team', kind: 'group' },
    decision: 'abstained',
    time: '2026-05-19',
  },
];

const row = (name: string) =>
  screen.getByText(name).closest<HTMLElement>('.ui-approval-panel__approver') as HTMLElement;

describe('ApprovalPanel', () => {
  it('UIC-APPROVAL-PANEL-1.1 UIC-APPROVAL-PANEL-1.8 renders a section named by its heading', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <ApprovalPanel
        ref={ref}
        approvers={approvers}
        getNow={getNow}
        className="extra"
        id="approvals"
        data-lab="panel"
        data-outcome="caller"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(ref.current).toBe(root);
    expect(root.tagName).toBe('SECTION');
    expect(root).toHaveClass('ui-approval-panel', 'extra');
    expect(root).toHaveAttribute('id', 'approvals');
    expect(root).toHaveAttribute('data-lab', 'panel');
    expect(screen.getByRole('region', { name: 'Approvals' })).toBe(root);
    expect(screen.getByRole('heading', { level: 3, name: 'Approvals' })).toHaveClass(
      'ui-approval-panel__title',
    );
    const outcome = root.querySelector('.ui-approval-panel__outcome');
    expect(outcome).toHaveClass('ui-badge');
    expect(outcome).toHaveAttribute('data-variant', 'status');
    expect(outcome).toHaveAttribute('role', 'status');
    expect(outcome).toHaveAttribute('data-tone', 'neutral');
    expect(outcome).toHaveTextContent('Pending');
    expectHooksMatchSpec(container, 'APPROVAL-PANEL', {
      slots: [
        'header',
        'title',
        'outcome',
        'progress',
        'approvers',
        'approver',
        'identity',
        'decision',
        'time',
        'comment',
      ],
      callerAttributes: ['data-lab'],
    });
  });

  it('UIC-APPROVAL-PANEL-1.1 takes its title and heading level from the caller', () => {
    render(
      <Section title="Change 12" headingLevel={2}>
        <ApprovalPanel approvers={approvers} title="Sign-off" />
      </Section>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Sign-off' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Sign-off' })).toBeInTheDocument();
  });

  it('UIC-APPROVAL-PANEL-1.2 resolves the outcome from the decisions and the count needed', () => {
    const { container, rerender } = render(<ApprovalPanel approvers={approvers} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-outcome', 'pending');
    rerender(<ApprovalPanel approvers={approvers} requiredCount={1} />);
    expect(root).toHaveAttribute('data-outcome', 'approved');
    expect(root.querySelector('.ui-approval-panel__outcome')).toHaveAttribute(
      'data-tone',
      'success',
    );
    rerender(<ApprovalPanel approvers={approvers} requiredCount={0.4} />);
    expect(root).toHaveAttribute('data-outcome', 'approved');
    const rejected = [
      ...approvers,
      { id: 'ada', person: { name: 'Ada Park' }, decision: 'rejected' as const },
    ];
    rerender(<ApprovalPanel approvers={rejected} requiredCount={1} />);
    expect(root).toHaveAttribute('data-outcome', 'rejected');
    expect(root.querySelector('.ui-approval-panel__outcome')).toHaveTextContent('Rejected');
  });

  it('UIC-APPROVAL-PANEL-1.3 shows the approvals against those needed over a bar of decisions', () => {
    const { container, rerender } = render(<ApprovalPanel approvers={approvers} />);
    const progress = container.querySelector('.ui-approval-panel__progress') as HTMLElement;
    expect(progress).toHaveClass('ui-segmented-bar');
    expect(progress.querySelector('.ui-segmented-bar__label')).toHaveTextContent(
      '1 of 3 approvals',
    );
    expect(progress.querySelector('.ui-segmented-bar__total')).toBeNull();
    const segments = [...progress.querySelectorAll('.ui-segmented-bar__item')];
    expect(segments.map((item) => item.getAttribute('data-tone'))).toEqual([
      'success',
      'danger',
      'info',
      'neutral',
    ]);
    expect(
      segments.map((item) => item.querySelector('.ui-segmented-bar__item-label')?.textContent),
    ).toEqual(['Approved', 'Rejected', 'Abstained', 'Pending']);
    rerender(<ApprovalPanel approvers={approvers} requiredCount={1} />);
    expect(progress.querySelector('.ui-segmented-bar__label')).toHaveTextContent('1 of 1 approval');
    const twice = approvers.map((approver) => ({ ...approver, decision: 'approved' as const }));
    rerender(<ApprovalPanel approvers={twice} requiredCount={2} />);
    expect(progress.querySelector('.ui-segmented-bar__label')).toHaveTextContent(
      '2 of 2 approvals',
    );
  });

  it('UIC-APPROVAL-PANEL-1.4 draws each approver with their decision, time and comment', () => {
    render(<ApprovalPanel approvers={approvers} getNow={getNow} />);
    const list = screen.getByRole('list', { name: 'Approvers' });
    expect(list).toHaveClass('ui-approval-panel__approvers');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    const maria = row('Maria Santos');
    expect(maria).toHaveAttribute('data-decision', 'approved');
    expect(maria.querySelector('.ui-approval-panel__identity')).toHaveClass('ui-user-identity');
    const decision = maria.querySelector('.ui-approval-panel__decision');
    expect(decision).toHaveTextContent('Approved');
    expect(decision).toHaveAttribute('data-tone', 'success');
    expect(decision?.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'check');
    expect(maria.querySelector('.ui-approval-panel__time')).toHaveTextContent('1 hour ago');
    expect(maria.querySelector('.ui-approval-panel__comment')).toHaveTextContent('Looks good.');
    const jon = row('Jon Berg');
    expect(jon.querySelector('.ui-approval-panel__decision [data-glyph]')).toHaveAttribute(
      'data-glyph',
      'clock',
    );
    expect(jon.querySelector('.ui-approval-panel__time')).toBeNull();
    expect(jon.querySelector('.ui-approval-panel__comment')).toBeNull();
    const group = row('Quality team');
    expect(group.querySelector('.ui-avatar')).toHaveAttribute('data-kind', 'group');
    expect(group.querySelector('.ui-approval-panel__decision')).toHaveAttribute(
      'data-tone',
      'info',
    );
  });

  it('UIC-APPROVAL-PANEL-1.5 marks the reader among the approvers', () => {
    const { container } = render(<ApprovalPanel approvers={approvers} currentApproverId="jon" />);
    expect(row('Jon Berg')).toHaveAttribute('data-current', 'true');
    expect(row('Jon Berg').querySelector('.ui-approval-panel__you')).toHaveTextContent('You');
    expect(row('Maria Santos')).not.toHaveAttribute('data-current');
    expectHooksMatchSpec(container, 'APPROVAL-PANEL', { slots: ['you'] });
  });

  it('UIC-APPROVAL-PANEL-1.6 reminds pending approvers and asks decided ones again', async () => {
    const onRemind = vi.fn();
    const onRequestAgain = vi.fn();
    const { container, rerender } = render(
      <ApprovalPanel approvers={approvers} onRemind={onRemind} onRequestAgain={onRequestAgain} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remind Jon Berg' }));
    expect(onRemind).toHaveBeenCalledWith('jon');
    await userEvent.click(screen.getByRole('button', { name: 'Request again from Maria Santos' }));
    expect(onRequestAgain).toHaveBeenCalledWith('maria');
    expect(within(row('Jon Berg')).queryByRole('button', { name: /Request again/ })).toBeNull();
    expect(within(row('Maria Santos')).queryByRole('button', { name: /Remind/ })).toBeNull();
    expectHooksMatchSpec(container, 'APPROVAL-PANEL', { slots: ['remind', 'request-again'] });
    rerender(<ApprovalPanel approvers={approvers} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('UIC-APPROVAL-PANEL-1.7 holds the reader decision in the action area', () => {
    const { container, rerender } = render(
      <ApprovalPanel approvers={approvers}>
        <button type="button">Decide</button>
      </ApprovalPanel>,
    );
    const actions = container.querySelector('.ui-approval-panel__actions');
    expect(actions).toContainElement(screen.getByRole('button', { name: 'Decide' }));
    expect(actions?.previousElementSibling).toHaveClass('ui-approval-panel__approvers');
    rerender(<ApprovalPanel approvers={approvers} />);
    expect(container.querySelector('.ui-approval-panel__actions')).toBeNull();
  });

  it('UIC-APPROVAL-PANEL-2.1 reads every decision as text and adds no tab stop of its own', async () => {
    render(<ApprovalPanel approvers={approvers} getNow={getNow} />);
    expect(row('Quality team')).toHaveTextContent('Abstained');
    await userEvent.tab();
    // Only the decision times' tooltips take focus.
    expect(document.activeElement).toHaveClass('ui-approval-panel__time');
    await userEvent.tab();
    expect(document.activeElement).toHaveClass('ui-approval-panel__time');
    await userEvent.tab();
    expect(document.activeElement).toBe(document.body);
  });
});
