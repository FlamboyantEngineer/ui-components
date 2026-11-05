import type { CSSProperties } from 'react';
import { Button } from '../../src/components/button/index.js';
import {
  ExpressionField,
  type ExpressionFieldResult,
} from '../../src/components/expression-field/index.js';
import type { ControlSize } from '../../src/core/index.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { tokenizeExpression } from './expression-field-evaluator.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const satisfies readonly ControlSize[];
const narrow: CSSProperties = { width: 220 };
const column: CSSProperties = { width: 360 };

const long = 'width * height * depth + rate * (width + height + depth) / 3 - 0.0000001';

const contents = {
  short: { source: '2 * width', result: { status: 'ready', source: '2 * width', value: '25' } },
  long: { source: long, result: { status: 'ready', source: long, value: '1234567.8901234567' } },
  'unit and action': {
    source: 'rate * 3',
    result: { status: 'pending', source: 'rate * 3' },
  },
} satisfies Record<string, { source: string; result: ExpressionFieldResult }>;

/** Each size with short and long source, and with a unit and an action beside the source. */
export function ExpressionFieldSizes() {
  return (
    <LabSection
      title="Sizes"
      description="The source box takes the control height of each size, like a text field; the unit, actions and result follow the field's type."
    >
      <StateMatrix
        axes={{ content: Object.keys(contents) as (keyof typeof contents)[], size: sizes }}
        render={({ content, size }) => {
          const sample = contents[content];
          const hasExtras = content === 'unit and action';
          return (
            <div style={column}>
              <ExpressionField
                label={`Expression, ${content}, ${size}`}
                size={size}
                defaultValue={sample.source}
                result={sample.result}
                tokenize={tokenizeExpression}
                unit={hasExtras ? 'm²' : undefined}
                actions={
                  hasExtras ? (
                    <Button size={size === 'xs' ? 'xs' : 'sm'} variant="ghost">
                      Insert
                    </Button>
                  ) : undefined
                }
              />
            </div>
          );
        }}
      />
    </LabSection>
  );
}

const longMessage =
  'The name depth is not defined in this sheet. Define it, or pick one of width, height or rate.';

const corners = [
  'narrow and long',
  'long message',
  'diagnostics',
  'label beside',
  'control only',
  'required and empty',
  'host error',
  'right to left',
] as const;

type Corner = (typeof corners)[number];

function CornerField({ corner }: { corner: Corner }) {
  const label = `Expression, ${corner}`;
  switch (corner) {
    case 'narrow and long':
      return (
        <div style={narrow}>
          <ExpressionField
            label={label}
            defaultValue={long}
            unit="m³"
            result={{ status: 'ready', source: long, value: '98765432109876543210.123' }}
            tokenize={tokenizeExpression}
          />
        </div>
      );
    case 'long message':
      return (
        <ExpressionField
          label={label}
          defaultValue="depth * 2"
          result={{ status: 'invalid', source: 'depth * 2', message: longMessage }}
        />
      );
    case 'diagnostics':
      return (
        <ExpressionField
          label={label}
          defaultValue="width * depth"
          tokenize={tokenizeExpression}
          diagnostics={[{ message: 'Unknown name depth.', line: 1, column: 9, severity: 'error' }]}
          result={{ status: 'invalid', source: 'width * depth', message: 'Unknown name depth.' }}
        />
      );
    case 'label beside':
      return (
        <ExpressionField
          label={label}
          labelLayout="label-colon-control"
          defaultValue="width / 2"
          result={{ status: 'ready', source: 'width / 2', value: '6.25' }}
        />
      );
    case 'control only':
      return <ExpressionField label={label} labelLayout="control-only" placeholder="2 * width" />;
    case 'required and empty':
      return (
        <ExpressionField
          label={label}
          isRequired
          validationMode="immediate"
          placeholder="Required"
          description="An empty required source shows the field's own message."
        />
      );
    case 'host error':
      return (
        <ExpressionField
          label={label}
          defaultValue="width / 0"
          validationMode="immediate"
          validate={() => [{ severity: 'error', message: 'Division by zero is not allowed here.' }]}
          result={{ status: 'invalid', source: 'width / 0', message: 'Division by zero.' }}
        />
      );
    case 'right to left':
      return (
        <div dir="rtl">
          <ExpressionField
            label={label}
            defaultValue="width + 1"
            unit="m"
            result={{ status: 'ready', source: 'width + 1', value: '13.5' }}
            tokenize={tokenizeExpression}
          />
        </div>
      );
  }
}

/** Corner cases: long source and messages, diagnostics, label layouts, validation and direction. */
export function ExpressionFieldCorners() {
  return (
    <LabSection
      title="Corner cases"
      description="Long source in a narrow column scrolls inside its box; long messages wrap; diagnostics mark the source without making the field invalid; label layouts, required, host errors and right-to-left text."
    >
      <StateMatrix
        axes={{ corner: corners }}
        render={({ corner }) => (
          <div style={column}>
            <CornerField corner={corner} />
          </div>
        )}
      />
    </LabSection>
  );
}
