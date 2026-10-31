'use client';

import { useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { TextField } from '../text-field/text-field.js';
import { actionHooks } from './message-actions-bar.js';
import type { FeedbackDetails } from './message-commands.js';

interface FeedbackFormProps {
  /** The reasons offered as toggle chips, in order. */
  reasons: readonly string[];
  onSubmit: (details: FeedbackDetails) => void;
  onSkip: () => void;
}

/** The details that follow a rating: reason chips, an optional comment, then Skip and Submit. */
export function FeedbackForm({ reasons, onSubmit, onSkip }: FeedbackFormProps) {
  const strings = useUiStrings();
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [comment, setComment] = useState('');
  const toggle = (reason: string, isChosen: boolean) =>
    setChosen((current) => {
      const next = new Set(current);
      if (isChosen) next.add(reason);
      else next.delete(reason);
      return next;
    });
  return (
    <>
      {reasons.length > 0 ? (
        <div {...actionHooks.slot('reasons')} role="group" aria-label={strings.feedbackReasons}>
          {reasons.map((reason) => (
            <Button
              key={reason}
              variant="chip"
              size="sm"
              className={actionHooks.slotClass('reason')}
              isSelected={chosen.has(reason)}
              onChange={(isChosen) => toggle(reason, isChosen)}
            >
              {reason}
            </Button>
          ))}
        </div>
      ) : null}
      {/* The comment is never saved on its own, so it is never dirty: no Restore, and Escape closes. */}
      <TextField
        label={strings.feedbackComment}
        multiline
        value={comment}
        tracksChanges={false}
        onChange={setComment}
        className={actionHooks.slotClass('comment')}
      />
      <div {...actionHooks.slot('feedback-actions')}>
        <Button size="sm" onPress={onSkip}>
          {strings.skip}
        </Button>
        <Button
          size="sm"
          variant="primary"
          onPress={() =>
            onSubmit({ reasons: reasons.filter((reason) => chosen.has(reason)), comment })
          }
        >
          {strings.submitFeedback}
        </Button>
      </div>
    </>
  );
}
