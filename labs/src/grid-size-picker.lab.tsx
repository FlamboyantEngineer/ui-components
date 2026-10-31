import { useState } from 'react';
import { UiProvider } from '../../src/core/provider.js';
import { Button } from '../../src/components/button/button.js';
import {
  GridSizePicker,
  type GridSize,
} from '../../src/components/grid-size-picker/grid-size-picker.js';
import { Popover, PopoverTrigger } from '../../src/components/popover/popover.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const states = ['enabled', 'disabled'] as const;
const bounds = ['default', 'small', 'fixed'] as const;

const boundProps = {
  default: {},
  small: { minRows: 3, minColumns: 3, maxRows: 6, maxColumns: 8 },
  fixed: { minRows: 4, minColumns: 4, maxRows: 4, maxColumns: 4 },
} as const;

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

function formatSize(size: GridSize | null) {
  return size ? `${size.rows} × ${size.columns}` : 'none';
}

function InlinePicker() {
  const [size, setSize] = useState<GridSize | null>(null);
  return (
    <>
      <GridSizePicker aria-label="Grid size" onSelect={setSize} data-lab-field="inline" />
      <Output name="inline" value={formatSize(size)} />
    </>
  );
}

function InsertTable() {
  const [size, setSize] = useState<GridSize | null>(null);
  return (
    <>
      <PopoverTrigger>
        <Button data-lab-trigger>Insert table</Button>
        <Popover aria-label="Insert table" placement="bottom start">
          {({ close }) => (
            <GridSizePicker
              autoFocus
              maxRows={8}
              maxColumns={8}
              onSelect={(next) => {
                setSize(next);
                close();
              }}
            />
          )}
        </Popover>
      </PopoverTrigger>
      <Output name="table" value={formatSize(size)} />
    </>
  );
}

function LimitedPicker() {
  const [isLimited, setLimited] = useState(false);
  const max = isLimited ? 3 : 8;
  return (
    <>
      <Button data-lab-control="limit" onPress={() => setLimited((value) => !value)}>
        {isLimited ? 'Allow 8 × 8' : 'Limit to 3 × 3'}
      </Button>
      <GridSizePicker
        aria-label="Grid size, changing bounds"
        maxRows={max}
        maxColumns={max}
        onSelect={() => {}}
        data-lab-field="limited"
      />
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="States and bounds"
      description="Enabled and disabled pickers with the default bounds (5 × 5 growing to 10 × 10), small bounds (3 × 3 to 6 × 8) and a fixed 4 × 4 grid."
    >
      <StateMatrix
        axes={{ state: states, bounds }}
        render={({ state, bounds: bound }) => (
          <GridSizePicker
            aria-label={`Grid size, ${state}, ${bound}`}
            onSelect={() => {}}
            isDisabled={state === 'disabled'}
            {...boundProps[bound]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Inline"
      description="Hover or focus a cell to preview its size; the grid grows one past the preview. Press, Enter or Space chooses."
    >
      <InlinePicker />
    </LabSection>
    <LabSection
      title="In a popover"
      description="The insert command opens the picker with the first cell focused; choosing closes it."
    >
      <InsertTable />
    </LabSection>
    <LabSection
      title="Changing bounds"
      description="Limiting the bounds below the preview clamps it, and a focused picker keeps focus on the clamped cell; allowing 8 × 8 again keeps the clamped size."
    >
      <LimitedPicker />
    </LabSection>
    <LabSection title="Right to left" description="Left and right follow the reading direction.">
      <UiProvider locale="ar-EG">
        <div dir="rtl" data-lab-field="rtl">
          <GridSizePicker aria-label="Grid size, right to left" onSelect={() => {}} />
        </div>
      </UiProvider>
    </LabSection>
  </>,
);
