import type { CSSProperties } from 'react';
import {
  PeoplePicker,
  type PeoplePickerLoader,
} from '../../src/components/people-picker/people-picker.js';
import { PinInput } from '../../src/components/pin-input/pin-input.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const contents = ['short', 'long', 'large type'] as const;

/** A directory with nobody in it: the samples only show the closed field. */
const noPeople: PeoplePickerLoader = () => Promise.resolve([]);

const sample = (content: (typeof contents)[number]): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  ...(content === 'large type' ? { fontSize: 24, lineHeight: 2 } : {}),
});

/** The people picker at the sizes it takes: sm, md and lg, no xs. */
export function PeoplePickerSizes() {
  return (
    <div data-lab-family="people-picker-sizes">
      <LabSection
        title="People picker sizes"
        description="The people picker takes sm, md and lg only. Its field box follows the scale like any combobox, with short and long placeholders and inside large type."
      >
        <StateMatrix
          axes={{ content: contents, size: ['sm', 'md', 'lg'] as const }}
          render={({ content, size }) => (
            <div data-lab-control-sample={content} style={sample(content)}>
              <span aria-hidden="true">Aa</span>
              <PeoplePicker
                size={size}
                label="Owner"
                placeholder={content === 'long' ? 'Search people, groups and teams' : 'Search'}
                loadItems={noPeople}
              />
            </div>
          )}
        />
      </LabSection>
    </div>
  );
}

/** PIN cells side by side at each size, under the scale and an overridden md step. */
export function PinCellGeometry() {
  return (
    <LabSection
      title="PIN cells"
      description="Each PIN cell is deliberately a step larger than the control scale, for one large character: the control height plus 4 pixels wide and plus 8 pixels tall (24 by 28 at xs, up to 36 by 40 at lg). The cells follow an overridden scale step, and their character follows the type around them, while their box keeps to the scale; the group wraps in a narrow column."
    >
      <StateMatrix
        axes={{
          setting: ['scale', 'md at 40 pixels', 'large type', 'narrow column'] as const,
          size: ['xs', 'sm', 'md', 'lg'] as const,
        }}
        render={({ setting, size }) => (
          <div
            data-lab-pin-sample={setting}
            style={{
              ...(setting === 'md at 40 pixels'
                ? ({ '--ref-control-height-md': '40px' } as CSSProperties)
                : {}),
              ...(setting === 'large type' ? { fontSize: 24, lineHeight: 2 } : {}),
              ...(setting === 'narrow column' ? { width: 90 } : {}),
            }}
          >
            <PinInput
              size={size}
              label="Code"
              labelLayout="control-only"
              length={4}
              defaultValue="1234"
            />
          </div>
        )}
      />
    </LabSection>
  );
}
