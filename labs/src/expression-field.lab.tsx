import { type CSSProperties, useEffect, useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import {
  ExpressionField,
  type ExpressionFieldResult,
} from '../../src/components/expression-field/index.js';
import { FieldBehaviours } from './field-behaviours.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { ExpressionFieldCorners, ExpressionFieldSizes } from './expression-field-cases.js';
import { constants, evaluateExpression, tokenizeExpression } from './expression-field-evaluator.js';
import { LabOutput } from './lab-output.js';

const column: CSSProperties = { width: 360 };

const exact = '9007199254740993.0000000000000001';

const cases: Readonly<Record<string, { source: string; result?: ExpressionFieldResult }>> = {
  empty: { source: '' },
  ready: { source: '2 * width', result: { status: 'ready', source: '2 * width', value: '25' } },
  pending: { source: 'width / 3', result: { status: 'pending', source: 'width / 3' } },
  invalid: {
    source: 'width *',
    result: { status: 'invalid', source: 'width *', message: 'The expression ends early.' },
  },
  unavailable: { source: 'depth + 1', result: { status: 'unavailable' } },
  stale: { source: 'width + 2', result: { status: 'ready', source: 'width + 1', value: '13.5' } },
};

const completions = Object.keys(constants).map((name) => ({
  label: name,
  kind: 'constant',
  description: String(constants[name]),
}));

/**
 * The host evaluates each draft after a delay, as a remote engine would, and answers for the source
 * it was asked about: while the reader types on, the older answer shows as stale.
 */
function useMockEvaluation(source: string, delay: number): ExpressionFieldResult {
  const [answer, setAnswer] = useState<ExpressionFieldResult>({ status: 'pending', source });
  useEffect(() => {
    const timer = setTimeout(() => {
      const read = evaluateExpression(source);
      setAnswer(
        source.trim() === ''
          ? { status: 'unavailable', message: 'Type an expression.' }
          : read.ok
            ? { status: 'ready', source, value: String(read.value) }
            : { status: 'invalid', source, message: read.message },
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [source, delay]);
  return answer;
}

function LiveDemo() {
  const [source, setSource] = useState('width * height + 1');
  const [commits, setCommits] = useState<string[]>([]);
  const result = useMockEvaluation(source, 600);
  return (
    <div data-lab-demo="live" style={column}>
      <ExpressionField
        label="Area"
        description="Names: width, height, rate. Enter or leaving commits; Escape restores."
        value={source}
        onChange={setSource}
        onCommit={(value) => setCommits((previous) => [...previous, value])}
        result={result}
        tokenize={tokenizeExpression}
        completions={completions}
        unit="m²"
        actions={
          <Button size="xs" variant="ghost" onPress={() => setSource(`${source} * rate`)}>
            Apply rate
          </Button>
        }
      />
      <LabOutput name="Source">{JSON.stringify(source)}</LabOutput>
      <LabOutput name="Commits">{JSON.stringify(commits)}</LabOutput>
    </div>
  );
}

function ExactDemo() {
  const [commits, setCommits] = useState<string[]>([]);
  const [committed, setCommitted] = useState(exact);
  return (
    <div data-lab-demo="exact" style={column}>
      <ExpressionField
        label="Tolerance"
        defaultValue="1e-100"
        onCommit={(value) => setCommits((previous) => [...previous, value])}
      />
      <ExpressionField
        label="Exact decimal"
        committedValue={committed}
        defaultValue={exact}
        onCommit={(value) => {
          setCommitted(value);
          setCommits((previous) => [...previous, value]);
        }}
      />
      <Button onPress={() => setCommitted('0.10')}>Replace saved decimal</Button>
      <LabOutput name="Exact commits">{JSON.stringify(commits)}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="The host passes each result with the source it was evaluated from; a result for other source shows as stale."
    >
      <StateMatrix
        axes={{ state: [...Object.keys(cases), 'read-only', 'disabled'] }}
        render={({ state }) => {
          const sample = cases[state] ?? cases.ready;
          return (
            <div style={column}>
              <ExpressionField
                label={`Expression, ${state}`}
                defaultValue={sample?.source}
                result={sample?.result}
                tokenize={tokenizeExpression}
                placeholder="2 * width"
                isReadOnly={state === 'read-only'}
                isDisabled={state === 'disabled'}
              />
            </div>
          );
        }}
      />
    </LabSection>
    <ExpressionFieldSizes />
    <ExpressionFieldCorners />
    <LabSection
      title="Mock host evaluator"
      description="Each edit asks the mock host to evaluate after 600 ms. Until it answers, the previous result is marked out of date; the answer never changes the source."
    >
      <LiveDemo />
    </LabSection>
    <LabSection
      title="Exact decimals"
      description="Source is kept as typed: 1e-100 and a decimal with more digits than a number holds come back unchanged."
    >
      <ExactDemo />
    </LabSection>
    <FieldBehaviours<string>
      committed="width * height"
      changed="width * height * rate"
      empty=""
      refused="width / 0"
      isRefused={(value) => value.includes('/ 0')}
      refusedText="Dividing by zero"
      render={(props) => <ExpressionField tokenize={tokenizeExpression} {...props} />}
    />
  </>,
);
