import { useId, type ReactNode, type Ref } from 'react';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { getDisplayName, type AvatarIdentity } from '../avatar/avatar.js';
import { Badge } from '../badge/badge.js';
import { IconButton } from '../icon-button/icon-button.js';
import { RelativeTime } from '../relative-time/relative-time.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { SegmentedBar } from '../segmented-bar/segmented-bar.js';
import { UserIdentity } from '../user-identity/user-identity.js';

/** Where one approver's decision stands. */
export type ApprovalPanelDecision = 'pending' | 'approved' | 'rejected' | 'abstained';

/** Where the whole approval stands: approved once enough approve, rejected by any rejection. */
export type ApprovalPanelOutcome = 'pending' | 'approved' | 'rejected';

/** A person or a group whose decision is asked. */
export interface ApprovalPanelApprover {
  /** Identifies the approver. */
  id: Key;
  /** Who decides: a person, or a group with `kind: 'group'`. */
  person: AvatarIdentity;
  decision: ApprovalPanelDecision;
  /** When they decided: an ISO 8601 date or date and time. */
  time?: string | null | undefined;
  /** What they said with their decision. */
  comment?: ReactNode;
}

export interface ApprovalPanelProps extends BaseProps {
  /** The approvers, in the order they show. */
  approvers: readonly ApprovalPanelApprover[];
  /** The approvals needed. Defaults to every approver. */
  requiredCount?: number | undefined;
  /** The heading, which names the panel. Defaults to the provider's `approvals` string. */
  title?: ReactNode;
  /** The reader's own approver: marked as `You`. */
  currentApproverId?: Key | undefined;
  /** Draws a Remind button on each pending approver's row that calls this with their id. */
  onRemind?: ((id: Key) => void) | undefined;
  /** Draws a Request again button on each decided approver's row that calls this with their id. */
  onRequestAgain?: ((id: Key) => void) | undefined;
  /** The clock decision times are read against. Defaults to the current time. */
  getNow?: (() => Date) | undefined;
  /** The reader's own decision, such as a `DecisionControl`, under the approvers. */
  children?: ReactNode;
  /** The root `<section>`. */
  ref?: Ref<HTMLElement> | undefined;
}

type ApproverRowProps = Pick<ApprovalPanelProps, 'onRemind' | 'onRequestAgain' | 'getNow'> & {
  approver: ApprovalPanelApprover;
  isCurrent: boolean;
};

const hooks = createHooks('approval-panel', [
  'header',
  'title',
  'outcome',
  'progress',
  'approvers',
  'approver',
  'identity',
  'you',
  'decision',
  'time',
  'comment',
  'remind',
  'request-again',
  'actions',
]);

const decisionTones: Record<ApprovalPanelDecision, Tone> = {
  pending: 'neutral',
  approved: 'success',
  rejected: 'danger',
  abstained: 'info',
};

const decisionGlyphs: Record<ApprovalPanelDecision, GlyphName> = {
  pending: 'clock',
  approved: 'check',
  rejected: 'close',
  abstained: 'minus',
};

const decisions: readonly ApprovalPanelDecision[] = [
  'approved',
  'rejected',
  'abstained',
  'pending',
];

/** The approvals needed: `requiredCount` as a whole number from 1, else every approver. */
function resolveRequired(requiredCount: number | undefined, approverCount: number): number {
  if (requiredCount === undefined || !Number.isFinite(requiredCount)) return approverCount;
  return Math.max(1, Math.trunc(requiredCount));
}

/** Rejected by any rejection, approved once the approvals reach the count needed, else pending. */
function resolveApprovalOutcome(
  approvers: readonly Pick<ApprovalPanelApprover, 'decision'>[],
  requiredCount: number,
): ApprovalPanelOutcome {
  if (approvers.some((approver) => approver.decision === 'rejected')) return 'rejected';
  const approved = approvers.filter((approver) => approver.decision === 'approved').length;
  return approved >= requiredCount ? 'approved' : 'pending';
}

function ApproverActions({ approver, onRemind, onRequestAgain }: ApproverRowProps) {
  const strings = useUiStrings();
  const name = getDisplayName(approver.person.name, strings.unnamed);
  if (approver.decision === 'pending') {
    if (!onRemind) return null;
    const label = strings.remindApprover(name);
    return (
      <IconButton
        icon="bell"
        label={label}
        tooltip={label}
        size="sm"
        className={hooks.slotClass('remind')}
        onPress={() => onRemind(approver.id)}
      />
    );
  }
  if (!onRequestAgain) return null;
  const label = strings.requestApprovalAgain(name);
  return (
    <IconButton
      icon="refresh"
      label={label}
      tooltip={label}
      size="sm"
      className={hooks.slotClass('request-again')}
      onPress={() => onRequestAgain(approver.id)}
    />
  );
}

function ApproverRow(props: ApproverRowProps) {
  const strings = useUiStrings();
  const { approver, isCurrent, getNow } = props;
  const { decision } = approver;
  return (
    <li {...hooks.slot('approver', { decision, current: isCurrent })}>
      <UserIdentity
        {...approver.person}
        size="sm"
        nameSuffix={isCurrent ? <span {...hooks.slot('you')}>{strings.you}</span> : null}
        className={hooks.slotClass('identity')}
      />
      <Badge
        tone={decisionTones[decision]}
        startIcon={decisionGlyphs[decision]}
        size="sm"
        className={hooks.slotClass('decision')}
      >
        {strings.approvalDecision(decision)}
      </Badge>
      {approver.time ? (
        <RelativeTime value={approver.time} getNow={getNow} className={hooks.slotClass('time')} />
      ) : null}
      {isEmptyNode(approver.comment) ? null : (
        <div {...hooks.slot('comment')}>{approver.comment}</div>
      )}
      <ApproverActions {...props} />
    </li>
  );
}

/**
 * Who must decide on something and where each decision stands: a heading with the outcome, the
 * approvals given against those needed over a bar of every decision, one row per approver with
 * their decision, time and comment, Remind and Request again actions, and the reader's own
 * decision under them.
 */
export function ApprovalPanel({
  approvers,
  requiredCount,
  title,
  currentApproverId,
  onRemind,
  onRequestAgain,
  getNow,
  children,
  className,
  ...rest
}: ApprovalPanelProps) {
  const strings = useUiStrings();
  const titleId = useId();
  const Heading = `h${useHeadingLevel(undefined)}` as const;
  const required = resolveRequired(requiredCount, approvers.length);
  const outcome = resolveApprovalOutcome(approvers, required);
  const countOf = (decision: ApprovalPanelDecision) =>
    approvers.filter((approver) => approver.decision === decision).length;
  const segments = decisions.map((decision) => ({
    id: decision,
    label: strings.approvalDecision(decision),
    value: countOf(decision),
    tone: decision === 'pending' ? undefined : decisionTones[decision],
  }));
  return (
    <section
      {...rest}
      {...hooks.root({ className, props: rest, data: { outcome } })}
      aria-labelledby={titleId}
    >
      <div {...hooks.slot('header')}>
        <Heading {...hooks.slot('title')} id={titleId}>
          {title ?? strings.approvals}
        </Heading>
        <Badge
          variant="status"
          tone={decisionTones[outcome]}
          size="sm"
          className={hooks.slotClass('outcome')}
        >
          {strings.approvalDecision(outcome)}
        </Badge>
      </div>
      <SegmentedBar
        // Approvals past the count needed read as the count needed (`1 of 1 approval`).
        label={strings.approvalProgress(Math.min(countOf('approved'), required), required)}
        segments={segments}
        showTotal={false}
        size="sm"
        className={hooks.slotClass('progress')}
      />
      <ul {...hooks.slot('approvers')} aria-label={strings.approvers}>
        {approvers.map((approver) => (
          <ApproverRow
            key={approver.id}
            approver={approver}
            isCurrent={approver.id === currentApproverId}
            onRemind={onRemind}
            onRequestAgain={onRequestAgain}
            getNow={getNow}
          />
        ))}
      </ul>
      {isEmptyNode(children) ? null : <div {...hooks.slot('actions')}>{children}</div>}
    </section>
  );
}
