import { type ReactNode, useState } from 'react';
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

function TripQuestions({
  isStepping,
  label,
  isCrossingDisabled = false,
}: {
  isStepping: boolean;
  label: string;
  isCrossingDisabled?: boolean;
}) {
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  return (
    <div style={{ inlineSize: '24rem' }}>
      <Questionnaire
        aria-label={label}
        items={isStepping ? steps : undefined}
        onSubmit={setAnswers}
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="crossing" isRequired isDisabled={isCrossingDisabled}>
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

function UnavailableQuestion() {
  const [isDisabled, setDisabled] = useState(true);
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={isDisabled}
          onChange={(event) => setDisabled(event.target.checked)}
        />{' '}
        Disable the crossing question
      </label>
      <TripQuestions
        isStepping
        label="Questionnaire with an unavailable question"
        isCrossingDisabled={isDisabled}
      />
    </>
  );
}

function EnclosingFieldset({ children }: { children: ReactNode }) {
  const [isDisabled, setDisabled] = useState(false);
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={isDisabled}
          onChange={(event) => setDisabled(event.target.checked)}
        />{' '}
        Disable the survey fieldset
      </label>
      <fieldset disabled={isDisabled}>
        <legend>Survey fieldset</legend>
        {children}
      </fieldset>
    </>
  );
}

/**
 * Answers kept outside the form, as drafts that outlive its controls: Next and Submit stay
 * unavailable, with a hint, until the shown question has an answer; read-only shows them unchanged.
 */
function KeptQuestions({ isReadOnly, label }: { isReadOnly: boolean; label: string }) {
  const [kept, setKept] = useState<QuestionnaireAnswers>({ crossing: ['ferry'], extras: [] });
  const [current, setCurrent] = useState('crossing');
  const [sent, setSent] = useState<QuestionnaireAnswers | null>(null);
  const keep = (name: string) => (values: string[]) =>
    setKept((answers) => ({ ...answers, [name]: values }));
  const isAnswered = (kept[current] ?? []).length > 0;
  return (
    <div style={{ inlineSize: '24rem' }}>
      <Questionnaire
        aria-label={label}
        items={['crossing', 'extras']}
        currentKey={current}
        onCurrentKeyChange={setCurrent}
        answers={kept}
        isReadOnly={isReadOnly}
        onSubmit={setSent}
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="crossing" isRequired={!isReadOnly}>
          <QuestionnaireTitle>Which crossing suits you?</QuestionnaireTitle>
          <QuestionnaireChoices value={kept['crossing']} onChange={keep('crossing')}>
            <QuestionnaireChoice value="ferry">Ferry</QuestionnaireChoice>
            <QuestionnaireChoice value="bridge">Bridge</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
        <QuestionnaireItem name="extras" isRequired={!isReadOnly}>
          <QuestionnaireTitle>Anything to bring along?</QuestionnaireTitle>
          <QuestionnaireChoices
            selectionMode="multiple"
            value={kept['extras']}
            onChange={keep('extras')}
          >
            <QuestionnaireChoice value="bike">A bike</QuestionnaireChoice>
            <QuestionnaireChoice value="lunch">A packed lunch</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious>Back</QuestionnairePrevious>
          <QuestionnaireNext
            isDisabled={!isAnswered && !isReadOnly}
            focusableWhenDisabled
            tooltip={isAnswered || isReadOnly ? undefined : 'Answer to continue'}
          />
          {isReadOnly ? null : (
            <QuestionnaireSubmit
              isDisabled={!isAnswered}
              focusableWhenDisabled
              tooltip={isAnswered ? undefined : 'Answer every question to submit'}
            />
          )}
        </QuestionnaireActions>
      </Questionnaire>
      <output aria-label={`${label} answers`}>{sent ? JSON.stringify(sent) : ''}</output>
    </div>
  );
}

mountLab(
  <>
    <LabSection title="Questionnaire layouts">
      <StateMatrix
        axes={{ layout: ['stepping', 'all at once'] }}
        render={({ layout }) => (
          <TripQuestions isStepping={layout === 'stepping'} label={`${layout} questionnaire`} />
        )}
      />
    </LabSection>
    <LabSection
      title="Kept answers"
      description="The answers live outside the form, so they survive its controls unmounting; Next and Submit wait for an answer with a hint, and a read-only questionnaire only steps."
    >
      <StateMatrix
        axes={{ mode: ['editable', 'read-only'] }}
        render={({ mode }) => (
          <KeptQuestions isReadOnly={mode === 'read-only'} label={`${mode} kept questionnaire`} />
        )}
      />
    </LabSection>
    <LabSection
      title="Unavailable question"
      description="The crossing question is required when enabled. While disabled, go to the next question and submit without choosing a crossing."
    >
      <UnavailableQuestion />
    </LabSection>
    <LabSection
      title="Enclosing fieldset"
      description="Submit with unanswered questions, then disable the enclosing fieldset. Validation messages disappear until you enable the fieldset again."
    >
      <EnclosingFieldset>
        <TripQuestions isStepping={false} label="Survey in an enclosing fieldset" />
      </EnclosingFieldset>
    </LabSection>
  </>,
);
