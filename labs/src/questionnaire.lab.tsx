import { useState } from 'react';
import {
  Questionnaire,
  QuestionnaireActions,
  type QuestionnaireAnswers,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '../../src/components/questionnaire/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const steps = ['crossing', 'extras', 'note'];

function TripQuestions({ isStepping, label }: { isStepping: boolean; label: string }) {
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  return (
    <div style={{ inlineSize: '24rem' }}>
      <Questionnaire
        aria-label={label}
        items={isStepping ? steps : undefined}
        onSubmit={setAnswers}
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="crossing" isRequired>
          <QuestionnaireTitle>Which crossing suits you?</QuestionnaireTitle>
          <QuestionnaireDescription>Both reach the island before noon.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="ferry" description="Hourly from the west quay">
              Ferry
            </QuestionnaireChoice>
            <QuestionnaireChoice value="bridge" description="A longer drive along the coast">
              Bridge
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem name="extras">
          <QuestionnaireTitle>Anything to bring along?</QuestionnaireTitle>
          <QuestionnaireChoices selectionMode="multiple">
            <QuestionnaireChoice value="bike">A bike</QuestionnaireChoice>
            <QuestionnaireChoice value="lunch">A packed lunch</QuestionnaireChoice>
            <QuestionnaireChoice value="cabin" isDisabled>
              A cabin (sold out)
            </QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
        <QuestionnaireItem name="note" isRequired>
          <QuestionnaireTitle>A note for the crew</QuestionnaireTitle>
          <QuestionnaireInput placeholder="Such as a window seat" />
          <QuestionnaireError>Write a short note first.</QuestionnaireError>
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </QuestionnaireActions>
      </Questionnaire>
      <output aria-label={`${label} answers`}>{answers ? JSON.stringify(answers) : ''}</output>
    </div>
  );
}

mountLab(
  <LabSection title="Questionnaire layouts">
    <StateMatrix
      axes={{ layout: ['stepping', 'all at once'] }}
      render={({ layout }) => (
        <TripQuestions isStepping={layout === 'stepping'} label={`${layout} questionnaire`} />
      )}
    />
  </LabSection>,
);
