import type { CSSProperties } from 'react';
import {
  ConstraintEditor,
  type ConstraintEditorKind,
  type ConstraintName,
  type ConstraintSet,
} from '../../src/components/constraint-editor/index.js';
import { TextField } from '../../src/components/text-field/index.js';
import type { ControlSize } from '../../src/core/index.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const satisfies readonly ControlSize[];
const column: CSSProperties = { width: 380 };
const narrow: CSSProperties = { width: 240 };

const colours = [
  { id: 'red', label: 'Red' },
  { id: 'green', label: 'Green' },
  { id: 'blue', label: 'Blue' },
];

/** Each size: every control and its Unset button take the size's height. */
export function ConstraintEditorSizes() {
  return (
    <LabSection
      title="Sizes"
      description="The size prop sizes every control; Unset takes the size below, like a field's own buttons."
    >
      <StateMatrix
        axes={{ kind: ['text', 'number'], size: sizes }}
        render={({ kind, size }) => (
          <div style={column}>
            <ConstraintEditor
              kind={kind as ConstraintEditorKind}
              size={size}
              aria-label={`${kind} constraints, ${size}`}
              defaultValue={
                kind === 'text'
                  ? { required: true, minLength: 1, maxLength: 40 }
                  : { minimum: '0', maximum: '100', default: '10' }
              }
            />
          </div>
        )}
      />
    </LabSection>
  );
}

interface Corner {
  kind: ConstraintEditorKind;
  value: ConstraintSet;
  width?: CSSProperties;
  locked?: readonly ConstraintName[];
  constraints?: readonly ConstraintName[];
  custom?: boolean;
}

const corners = {
  'nothing set': { kind: 'text', value: {} },
  'false, zero and empty': {
    kind: 'text',
    value: { required: false, default: '', minLength: 0, maxLength: 0 },
  },
  'reversed bounds': { kind: 'number', value: { minimum: '10', maximum: '2', default: '20' } },
  'unreadable numbers': { kind: 'number', value: { minimum: 'ten', default: '1,5' } },
  'precise decimals': {
    kind: 'number',
    value: {
      minimum: '-9007199254740993.25',
      maximum: '9007199254740993.75',
      default: '0.1000000000000000055511151231257827',
    },
  },
  'reversed dates': { kind: 'date', value: { minimum: '2026-12-31', maximum: '2026-01-01' } },
  'counts out of range': {
    kind: 'options',
    value: { default: 'blue', minCount: 3, maxCount: 1 },
  },
  'long pattern, narrow': {
    kind: 'text',
    width: narrow,
    value: { pattern: '^(?:[A-Z]{2}-\\d{4}-[a-z]{3,8}|\\p{L}+(?: \\p{L}+)*)$', maxLength: 120 },
  },
  'all locked': {
    kind: 'number',
    value: { required: true, minimum: '0', maximum: '1' },
    locked: ['required', 'default', 'minimum', 'maximum'] as ConstraintName[],
  },
  'subset only': {
    kind: 'text',
    value: { maxLength: 10 },
    constraints: ['maxLength', 'pattern'] as ConstraintName[],
  },
  'custom control': { kind: 'text', value: { pattern: '[a-z]+' }, custom: true },
} satisfies Record<string, Corner>;

type CornerName = keyof typeof corners;

/** Corner cases the rules and layout must hold: unset against falsy, reversed and unreadable bounds. */
export function ConstraintEditorCorners() {
  return (
    <LabSection
      title="Corner cases"
      description="Nothing set; false, zero and empty kept apart from unset; reversed and unreadable bounds; decimals beyond a number's precision; counts out of range; a long pattern in a narrow column; every row locked; a subset of constraints; and a host's own control for one constraint."
    >
      <StateMatrix
        axes={{ corner: Object.keys(corners) as CornerName[] }}
        render={({ corner }) => {
          const sample: Corner = corners[corner];
          return (
            <div style={sample.width ?? column}>
              <ConstraintEditor
                kind={sample.kind}
                aria-label={`Constraints, ${corner}`}
                defaultValue={sample.value}
                options={colours}
                lockedConstraints={sample.locked}
                constraints={sample.constraints}
                renderConstraint={
                  sample.custom
                    ? (control) =>
                        control.name === 'pattern' ? (
                          <TextField
                            label={`${control.label} (host control)`}
                            size={control.size}
                            description="The host draws this one; the editor still owns its value and problems."
                            value={typeof control.value === 'string' ? control.value : ''}
                            onChange={(text) => control.onChange(text === '' ? undefined : text)}
                          />
                        ) : undefined
                    : undefined
                }
              />
            </div>
          );
        }}
      />
    </LabSection>
  );
}
