'use client';

import { CheckGlyph, CloseGlyph } from '../../core/glyphs.js';
import { useId, useState, type ReactNode } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { BaseProps, ControlSize, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { Form } from '../form/form.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import {
  DecisionComment,
  DecisionSignature,
  DecisionSubmit,
  decisionControlHooks as hooks,
  useDecisionSubmission,
  type DecisionControlComment,
  type DecisionControlDetails,
  type DecisionControlOption,
  type DecisionControlSignature,
  describeSigning,
} from './decision-parts.js';

export type {
  DecisionControlComment,
  DecisionControlDetails,
  DecisionControlOption,
  DecisionControlSignature,
} from './decision-parts.js';

export interface DecisionControlProps extends RefProps<HTMLDivElement>, BaseProps {
  /** Names the choice of decision. Defaults to the provider's `yourDecision` string. */
  label?: string | undefined;
  /** The decisions, in order. Defaults to Approve, then Reject, which asks for a comment. */
  options?: readonly DecisionControlOption[] | undefined;
  /** The decision picked (controlled), or `null`. */
  value?: string | null | undefined;
  /** The decision picked at first. Defaults to none. */
  defaultValue?: string | null | undefined;
  /** Receives the decision the reader picks. */
  onChange?: ((value: string | null) => void) | undefined;
  /** Asks for a comment. Defaults to `optional`. */
  comment?: DecisionControlComment | undefined;
  /** Signs the decision: Submit opens a `SignatureDialog` stating the decision as its meaning. */
  signature?: DecisionControlSignature | undefined;
  /** Labels the submit button. Defaults to the provider's `submitDecision` string. */
  submitLabel?: ReactNode;
  /**
   * Submits the decision. A returned promise keeps Submit pending; a rejection shows its error and
   * keeps the comment. Once it succeeds the comment clears, unless the reader has changed the
   * decision or the comment since submitting.
   */
  onSubmit: (details: DecisionControlDetails) => void | Promise<unknown>;
  /** Refuses picking and submitting. */
  isDisabled?: boolean | undefined;
  /**
   * The size of the decisions, the comment field and Submit on the shared control scale, and of
   * the spacing between them. Defaults to `md`.
   */
  size?: ControlSize | undefined;
}

function defaultOptions(strings: UiStrings): DecisionControlOption[] {
  return [
    { value: 'approve', label: strings.approve, icon: CheckGlyph },
    { value: 'reject', label: strings.reject, icon: CloseGlyph, requiresComment: true },
  ];
}

/**
 * The reader's own decision: a choice of decisions (approve or reject, or the scores of a vote) on
 * a `SegmentedChoice`, a comment that is optional, required, or required by the decision picked,
 * and Submit. With `signature`, Submit confirms through a `SignatureDialog` first.
 */
export function DecisionControl({
  label,
  options,
  value,
  defaultValue = null,
  onChange,
  comment = 'optional',
  signature,
  submitLabel,
  onSubmit,
  isDisabled = false,
  size = 'md',
  className,
  ...rest
}: DecisionControlProps) {
  const strings = useUiStrings();
  const labelId = useId();
  const choices = options ?? defaultOptions(strings);
  const [decision, setDecision] = useControllableState(value, defaultValue, onChange);
  const [commentText, setCommentText] = useState('');
  const picked = choices.find((option) => option.value === decision);
  const submission = useDecisionSubmission({
    details: { decision: picked?.value ?? '', comment: commentText },
    ...describeSigning({ signature, picked, comment, commentText, isDisabled }),
    isDisabled,
    onSubmit,
    onSubmitted: () => setCommentText(''),
  });
  const state = { decision: picked?.value, pending: submission.isPending, size };
  return (
    <div {...rest} {...hooks.root({ className, props: rest, data: state })}>
      <Form
        className={hooks.slotClass('form')}
        aria-labelledby={labelId}
        onSubmit={(event) => {
          event.preventDefault();
          if (picked) submission.start();
        }}
      >
        <span {...hooks.slot('label')} id={labelId}>
          {label ?? strings.yourDecision}
        </span>
        <SegmentedChoice
          aria-labelledby={labelId}
          options={choices.map(({ requiresComment: _requiresComment, ...option }) => option)}
          value={decision}
          onChange={setDecision}
          isDisabled={isDisabled}
          sizing="content"
          size={size}
          className={hooks.slotClass('choice')}
        />
        <DecisionComment
          comment={comment}
          options={choices}
          picked={picked}
          value={commentText}
          onChange={setCommentText}
          isDisabled={isDisabled}
          size={size}
        />
        <DecisionSubmit
          submission={submission}
          label={submitLabel}
          isDisabled={isDisabled || !picked}
          size={size}
        />
      </Form>
      {signature && picked && !isDisabled ? (
        <DecisionSignature
          signature={signature}
          picked={picked}
          comment={commentText}
          submission={submission}
        />
      ) : null}
    </div>
  );
}
