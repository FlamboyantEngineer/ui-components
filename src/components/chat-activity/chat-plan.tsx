'use client';

import {
  ErrorGlyph,
  PendingGlyph,
  SkippedGlyph,
  SuccessGlyph,
  type GlyphComponent,
} from '../../core/glyphs.js';
import { useId, useState } from 'react';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { ActivityAnnouncer, type ActivityAnnouncerProps } from './activity-announcer.js';
import {
  countDoneSteps,
  listChangedSteps,
  mapStepStatuses,
  type ChatPlanData,
  type ChatPlanStep,
  type ChatPlanStepStatus,
} from './chat-activity.js';

export interface ChatPlanProps extends RefProps<HTMLDivElement>, BaseProps, ChatPlanData {}

const hooks = createHooks('chat-plan', [
  'header',
  'title',
  'progress',
  'list',
  'step',
  'glyph',
  'spinner',
  'label',
]);

/** The glyph of each settled or waiting status; a step in progress shows a spinner instead. */
const statusGlyphs: Readonly<Record<Exclude<ChatPlanStepStatus, 'in-progress'>, GlyphComponent>> = {
  pending: PendingGlyph,
  done: SuccessGlyph,
  failed: ErrorGlyph,
  skipped: SkippedGlyph,
};

/**
 * The announcement of the steps whose status changed since the last one announced. A step's status
 * at the first render, or a step added as pending, is not a change.
 */
function usePlanAnnouncement(steps: readonly ChatPlanStep[]): ActivityAnnouncerProps {
  const strings = useUiStrings();
  const [announced, setAnnounced] = useState(() => mapStepStatuses(steps));
  const changes = listChangedSteps(steps, announced);
  return {
    message:
      changes.length > 0
        ? strings.chatPlanChanged(
            changes.map(({ label, status }) => strings.chatPlanChange(label, status)),
          )
        : '',
    onAnnounce: () => setAnnounced(mapStepStatuses(steps)),
  };
}

/** One step: its status glyph or spinner, its label and the status words read after it. */
function ChatPlanItem({ step }: { step: ChatPlanStep }) {
  const strings = useUiStrings();
  const { status } = step;
  return (
    <li
      {...hooks.slot('step', { status })}
      aria-current={status === 'in-progress' ? 'step' : undefined}
    >
      {status === 'in-progress' ? (
        <span {...hooks.slot('spinner')} aria-hidden="true" />
      ) : (
        <Glyph icon={statusGlyphs[status]} className={hooks.slotClass('glyph')} />
      )}
      <span {...hooks.slot('label')}>{step.label}</span>{' '}
      <VisuallyHidden as="span">{strings.chatPlanStepStatus(status)}</VisuallyHidden>
    </li>
  );
}

/**
 * An assistant's plan: an optional title, how many steps are done, and the ordered steps, each with
 * a status glyph and status words, the one in progress marked as the current step. Status changes
 * are announced politely, at most one announcement every two seconds.
 */
export function ChatPlan({ title, steps, className, ...rest }: ChatPlanProps) {
  const strings = useUiStrings();
  const titleId = useId();
  const progressId = useId();
  const announcement = usePlanAnnouncement(steps);
  return (
    <div {...rest} {...hooks.root({ className, props: rest })}>
      <div {...hooks.slot('header')}>
        {title ? (
          <span {...hooks.slot('title')} id={titleId}>
            {title}
          </span>
        ) : null}{' '}
        <span {...hooks.slot('progress')} id={progressId}>
          {strings.chatPlanProgress(countDoneSteps(steps), steps.length)}
        </span>
      </div>
      <ol
        {...hooks.slot('list')}
        aria-label={title ? undefined : strings.chatPlan}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={progressId}
      >
        {steps.map((step) => (
          <ChatPlanItem key={step.id} step={step} />
        ))}
      </ol>
      <ActivityAnnouncer {...announcement} />
    </div>
  );
}
