'use client';

import { CheckGlyph } from '../../core/glyphs.js';
import { useId, type ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { Tab, TabList, TabPanel, Tabs } from '../tabs/tabs.js';
import {
  chatQuestionHooks as hooks,
  isQuestionAnswered,
  type ChatQuestionAnsweredMark,
  type ChatQuestionItem,
  type QuestionDraft,
} from './chat-question-model.js';

interface QuestionTabsProps {
  questions: readonly ChatQuestionItem[];
  drafts: Readonly<Record<string, QuestionDraft>>;
  /** The shown question's position from 0. */
  step: number;
  answeredMark: ChatQuestionAnsweredMark;
  /** Shows the question at a position, chosen by its tab. */
  onSelect: (step: number) => void;
  /** The shown question. */
  children: ReactNode;
}

/**
 * A pending card's questions as tabs, one per question labelled by its header, the shown one
 * selected; the counter after them; and the shown question in the panel. An answered question's
 * tab says so in its description and, with the `icon` mark, with a check before its label.
 */
export function QuestionTabs({
  questions,
  drafts,
  step,
  answeredMark,
  onSelect,
  children,
}: QuestionTabsProps) {
  const strings = useUiStrings();
  const answeredId = useId();
  const current = questions[step];
  const select = (key: Key) => {
    const index = questions.findIndex((item) => item.id === key);
    if (index !== -1) onSelect(index);
  };
  return (
    <Tabs
      className={hooks.slotClass('tabs')}
      size="sm"
      selectedKey={current?.id}
      onSelectionChange={select}
    >
      <TabList aria-label={strings.questionSteps} scrollButtons>
        {questions.map((item, index) => {
          const isAnswered = isQuestionAnswered(item, drafts[item.id]);
          return (
            <Tab
              key={item.id}
              id={item.id}
              {...hooks.slot('tab', { answered: isAnswered })}
              icon={isAnswered && answeredMark === 'icon' ? CheckGlyph : undefined}
              aria-describedby={isAnswered ? answeredId : undefined}
            >
              {item.header || strings.questionStep(index + 1)}
            </Tab>
          );
        })}
      </TabList>
      <span {...hooks.slot('progress')}>
        <span aria-hidden="true">{strings.questionCounter(step + 1, questions.length)}</span>
        <VisuallyHidden elementType="span">
          {strings.questionProgress(step + 1, questions.length)}
        </VisuallyHidden>
      </span>
      <span id={answeredId} hidden>
        {strings.questionAnsweredTab}
      </span>
      {/* One panel per tab, as the tabs register them by key; only the selected one renders. */}
      {questions.map((item) => (
        <TabPanel key={item.id} id={item.id} className={hooks.slotClass('panel')}>
          {item.id === current?.id ? children : null}
        </TabPanel>
      ))}
    </Tabs>
  );
}
