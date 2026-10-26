import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ChatQuestion,
  type ChatQuestionAnswer,
  type ChatQuestionItem,
  type ChatQuestionStatus,
} from '../../src/components/chat-question/chat-question.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  databaseQuestion,
  featuresQuestion,
  layoutQuestion,
  nameQuestion,
  servingsQuestion,
  setupAnswers,
  setupQuestions,
  toppingsQuestion,
} from './chat-question-samples.js';

const statuses = [
  'pending',
  'answered',
  'dismissed',
] as const satisfies readonly ChatQuestionStatus[];

const counts = { one: [databaseQuestion], several: setupQuestions } as const;

const modeQuestions: Record<'single' | 'multiple' | 'none', ChatQuestionItem> = {
  single: { ...servingsQuestion, allowsOther: false },
  multiple: { ...toppingsQuestion, allowsOther: false },
  none: { ...nameQuestion, question: 'What should the soup be called?' },
};

/** How long the asynchronous host takes to answer a request. */
const hostDelay = 1200;

/** A card that writes what it submitted under itself, as a caller would record it. */
function Recorded({ name, questions }: { name: string; questions: ChatQuestionItem[] }) {
  const [record, setRecord] = useState('');
  return (
    <div>
      <ChatQuestion
        id={`ask-${name}`}
        questions={questions}
        status="pending"
        onSubmit={(answers) => setRecord(JSON.stringify(answers))}
        data-lab-demo={name}
      />
      <p data-lab-record={name}>{record}</p>
    </div>
  );
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * A host that takes a moment to accept the answers: it refuses the first attempt, so the card keeps
 * every answer and shows why, and accepts the retry, settling the card. Dismiss is accepted after
 * the same moment.
 */
function AsyncCard() {
  const [status, setStatus] = useState<ChatQuestionStatus>('pending');
  const [answers, setAnswers] = useState<ChatQuestionAnswer[]>([]);
  const [record, setRecord] = useState('');
  const attempts = useRef(0);
  return (
    <div>
      <ChatQuestion
        id="ask-async"
        questions={[databaseQuestion, nameQuestion]}
        status={status}
        answers={answers}
        onSubmit={async (given) => {
          attempts.current += 1;
          const attempt = attempts.current;
          setRecord(`Attempt ${attempt} sent`);
          await wait(hostDelay);
          if (attempt === 1) {
            setRecord('Attempt 1 refused');
            throw new Error('The helper did not receive the answers. Try again.');
          }
          setRecord(`Attempt ${attempt} accepted`);
          setAnswers(given);
          setStatus('answered');
        }}
        onDismiss={async () => {
          await wait(hostDelay);
          setStatus('dismissed');
        }}
        data-lab-demo="async"
      />
      <p data-lab-record="async">{record}</p>
    </div>
  );
}

/**
 * A conversation's view of a card: Submit and Dismiss settle it, the submitted answers show
 * below, and Ask again puts a fresh card back.
 */
function InteractiveCard() {
  const [status, setStatus] = useState<ChatQuestionStatus>('pending');
  const [answers, setAnswers] = useState<ChatQuestionAnswer[]>([]);
  const [round, setRound] = useState(1);
  return (
    <div>
      <ChatQuestion
        key={round}
        id={`ask-interactive-${round}`}
        questions={setupQuestions}
        status={status}
        answers={answers}
        onSubmit={(given) => {
          setAnswers(given);
          setStatus('answered');
        }}
        onDismiss={() => setStatus('dismissed')}
        data-lab-demo="interactive"
      />
      <pre data-lab-output="interactive">
        {status === 'answered' ? JSON.stringify(answers, null, 2) : status}
      </pre>
      <Button
        size="sm"
        isDisabled={status === 'pending'}
        onPress={() => {
          setStatus('pending');
          setAnswers([]);
          setRound((value) => value + 1);
        }}
      >
        Ask again
      </Button>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Statuses"
      description="One question and three asked one at a time, pending, answered (a summary of the answers) and dismissed. A pending card announces itself once to assistive technology."
    >
      <StateMatrix
        axes={{ questions: ['one', 'several'] as const, status: statuses }}
        render={({ questions, status }) => (
          <ChatQuestion
            id={`ask-${questions}-${status}`}
            questions={counts[questions]}
            status={status}
            answers={questions === 'one' ? setupAnswers.slice(0, 1) : setupAnswers}
            onSubmit={() => {}}
            onDismiss={() => {}}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Selection modes"
      description="One option as radios, any options as checkboxes, or free text only. Submit is unavailable, with a hint, until the question has an answer; Enter in the text field submits."
    >
      <StateMatrix
        axes={{ selectionMode: ['single', 'multiple', 'none'] as const }}
        render={({ selectionMode }) => (
          <ChatQuestion
            id={`ask-mode-${selectionMode}`}
            questions={[modeQuestions[selectionMode]]}
            status="pending"
            onSubmit={() => {}}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Recommended option and Other"
      description="Options with descriptions, a Recommended badge, and Other with a field for the reader's own words. Pressing Other focuses its field; an arrow key that moves onto it keeps walking the radios. Submitted answers show under each card."
    >
      <Recorded name="other-single" questions={[servingsQuestion]} />
      <Recorded name="other-multiple" questions={[toppingsQuestion]} />
    </LabSection>
    <LabSection
      title="Previews"
      description="Each option's preview shows beside the options for the focused option, else the chosen one: code in one card, Markdown in the other."
    >
      <Recorded name="preview-code" questions={[databaseQuestion]} />
      <Recorded name="preview-markdown" questions={[layoutQuestion]} />
    </LabSection>
    <LabSection
      title="Several questions"
      description="Three questions asked one at a time, with chips, a progress hint, Back and Next. Stepping moves focus to the next answer, and Enter in a text field steps on or submits."
    >
      <Recorded name="stepped" questions={[databaseQuestion, featuresQuestion, nameQuestion]} />
    </LabSection>
    <LabSection
      title="Interactive"
      description="Answer or dismiss the card: it collapses to its summary and the submitted answers show below. Ask again brings a fresh card."
    >
      <InteractiveCard />
    </LabSection>
    <LabSection
      title="Asynchronous answers"
      description="The host takes a moment to accept: the card is locked and Submit (or Dismiss) shows its spinner meanwhile, and pressing again sends nothing. The first Submit is refused: every answer and the question shown stay, and the error is announced. The retry is accepted and the host settles the card."
    >
      <AsyncCard />
    </LabSection>
    <LabSection
      title="Read-only"
      description="Without onSubmit a pending card is read-only: its options and fields take no changes and there is no Submit, while Next steps through the questions."
    >
      <ChatQuestion
        id="ask-read-only"
        questions={setupQuestions}
        status="pending"
        data-lab-demo="read-only"
      />
    </LabSection>
  </>,
);
