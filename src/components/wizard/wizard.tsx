'use client';

import { useId, type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, Orientation } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Button } from '../button/button.js';
import { Form } from '../form/form.js';
import { InlineError } from '../inline-error/inline-error.js';
import { useHeadingLevel, type HeadingLevel } from '../section-header/section-header.js';
import { Steps } from '../steps/steps.js';
import { useWizardNavigation, type WizardNavigation } from './wizard-navigation.js';

/** What a step's check answers: `false` or a message keeps the reader on the step. */
export type WizardValidation = boolean | string | void;

export interface WizardStep {
  /** Identifies the step. */
  id: Key;
  /** The step's name, in the list of steps and as its panel's heading. */
  label: ReactNode;
  /** A line under the label in the list of steps. */
  description?: ReactNode;
  /** The step's panel: its fields and content. */
  content: ReactNode;
  /** The reader may pass over the step with Skip. */
  isOptional?: boolean | undefined;
  /**
   * Checks the step once its fields pass, before the wizard moves on. Return `false` or a message to
   * stay; a returned promise keeps Next pending until it settles. `signal` aborts once the wizard
   * leaves the step or its workflow, or unmounts, and the check's answer then changes nothing.
   */
  validate?: ((signal: AbortSignal) => WizardValidation | Promise<WizardValidation>) | undefined;
}

export interface WizardProps extends BaseProps, AriaLabellingProps {
  /** The steps, in order. */
  steps: readonly WizardStep[];
  /** The shown step, controlled. */
  currentId?: Key | undefined;
  /** The step shown first, uncontrolled. Defaults to the first step. */
  defaultCurrentId?: Key | undefined;
  /** Receives the step the wizard moves to. */
  onCurrentIdChange?: ((id: Key) => void) | undefined;
  /**
   * Runs when the last step passes; a returned promise keeps Finish pending until it settles. It
   * never runs for a check the wizard has left. Once it runs it is the host's: leaving the step or
   * workflow, or unmounting, then ends the pending state and ignores its outcome.
   */
  onFinish?: (() => void | Promise<unknown>) | undefined;
  /** Draws a Cancel button that calls it. */
  onCancel?: (() => void) | undefined;
  /** The last step's button. Defaults to the provider's `finish` string. */
  finishLabel?: ReactNode;
  /** How the list of steps runs: above the panel, or beside it. Defaults to `horizontal`. */
  orientation?: Orientation | undefined;
  /** The level of each panel's heading. Defaults to one below the enclosing section, else 3. */
  headingLevel?: HeadingLevel | undefined;
}

type FooterProps = Pick<WizardProps, 'onCancel' | 'finishLabel'> & {
  navigation: WizardNavigation;
  steps: readonly WizardStep[];
};

const hooks = createHooks('wizard', [
  'steps',
  'form',
  'panel',
  'heading',
  'error',
  'footer',
  'action',
]);

function WizardFooter({ navigation, steps, onCancel, finishLabel }: FooterProps) {
  const strings = useUiStrings();
  const { index, isPending, goTo, skip } = navigation;
  const previous = steps[index - 1];
  const isLast = index >= steps.length - 1;
  const action = (name: string) => hooks.slot('action', { action: name });
  return (
    <div {...hooks.slot('footer')}>
      {onCancel ? (
        <Button {...action('cancel')} variant="tertiary" isDisabled={isPending} onPress={onCancel}>
          {strings.cancel}
        </Button>
      ) : null}
      {previous ? (
        <Button {...action('back')} isDisabled={isPending} onPress={() => goTo(previous.id)}>
          {strings.back}
        </Button>
      ) : null}
      {steps[index]?.isOptional && !isLast ? (
        <Button {...action('skip')} variant="tertiary" isDisabled={isPending} onPress={skip}>
          {strings.skip}
        </Button>
      ) : null}
      <Button
        {...action(isLast ? 'finish' : 'next')}
        type="submit"
        variant="primary"
        isPending={isPending}
      >
        {isLast ? (finishLabel ?? strings.finish) : strings.next}
      </Button>
    </div>
  );
}

/**
 * A multi-step task: the list of steps, the current step's panel, and Back, Skip, Next and Finish.
 * Next checks the step's fields as a form submit does, then the step's own `validate`, before
 * moving on; focus moves to the new step's heading. It renders inline or inside a `Modal`.
 */
export function Wizard({
  steps,
  currentId,
  defaultCurrentId,
  onCurrentIdChange,
  onFinish,
  onCancel,
  finishLabel,
  orientation = 'horizontal',
  headingLevel,
  className,
  ...rest
}: WizardProps) {
  const navigation = useWizardNavigation({
    steps,
    currentId,
    defaultCurrentId,
    onCurrentIdChange,
    onFinish,
  });
  const headingId = useId();
  const Heading = `h${useHeadingLevel(headingLevel)}` as const;
  const step = steps[navigation.index];
  const items = steps.map((entry, position) => ({
    id: entry.id,
    label: entry.label,
    description: entry.description,
    isOptional: entry.isOptional,
    status: navigation.statuses[position],
  }));
  const data = { orientation, pending: navigation.isPending };
  return (
    <div role="group" {...rest} {...hooks.root({ className, props: rest, data })}>
      <Steps
        items={items}
        currentId={step?.id}
        orientation={orientation}
        isDisabled={navigation.isPending}
        onAction={navigation.goTo}
        className={hooks.slotClass('steps')}
      />
      <Form className={hooks.slotClass('form')} onSubmit={navigation.submit}>
        {step ? (
          <div
            key={toKeyIdentity(step.id)}
            {...hooks.slot('panel')}
            role="group"
            aria-labelledby={headingId}
          >
            <Heading
              {...hooks.slot('heading')}
              id={headingId}
              ref={navigation.headingRef}
              tabIndex={-1}
            >
              {step.label}
            </Heading>
            {step.content}
          </div>
        ) : null}
        {navigation.failure?.message ? (
          <InlineError className={hooks.slotClass('error')}>
            {navigation.failure.message}
          </InlineError>
        ) : null}
        <WizardFooter
          navigation={navigation}
          steps={steps}
          onCancel={onCancel}
          finishLabel={finishLabel}
        />
      </Form>
    </div>
  );
}
