'use client';

import { useUiStrings } from '../../core/provider.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { NumberField } from '../number-field/number-field.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { TextField } from '../text-field/text-field.js';
import { assetPickerHooks as hooks } from './asset-picker-hooks.js';
import {
  type AssetPickerAlign,
  type AssetPickerItem,
  type AssetPlacement,
  resizePlacement,
} from './asset-placement.js';

interface AssetDetailsProps {
  item: AssetPickerItem;
  placement: AssetPlacement;
  onChange: (placement: AssetPlacement) => void;
}

const aligns: readonly AssetPickerAlign[] = ['start', 'center', 'end'];

function isAlign(value: string): value is AssetPickerAlign {
  return (aligns as readonly string[]).includes(value);
}

/** The chosen asset's alternative text, size, proportions and alignment. */
export function AssetDetails({ item, placement, onChange }: AssetDetailsProps) {
  const strings = useUiStrings();
  const alignLabels = {
    start: strings.assetAlignStart,
    center: strings.assetAlignCenter,
    end: strings.assetAlignEnd,
  };
  const resize = (side: 'width' | 'height', value: number | null) =>
    onChange(resizePlacement(placement, item, { side, value }));
  return (
    <div {...hooks.slot('details')}>
      <TextField
        {...hooks.slot('alt')}
        label={strings.assetAlt}
        value={placement.alt}
        tracksChanges={false}
        onChange={(alt) => onChange({ ...placement, alt })}
      />
      <div {...hooks.slot('size')}>
        <NumberField
          label={strings.assetWidth}
          value={placement.width}
          minValue={1}
          formatOptions={{ useGrouping: false }}
          tracksChanges={false}
          onChange={(width) => resize('width', width)}
        />
        <NumberField
          label={strings.assetHeight}
          value={placement.height}
          minValue={1}
          formatOptions={{ useGrouping: false }}
          tracksChanges={false}
          onChange={(height) => resize('height', height)}
        />
      </div>
      <Checkbox
        {...hooks.slot('constrain')}
        isSelected={placement.constrain}
        onChange={(constrain) => onChange({ ...placement, constrain })}
      >
        {strings.assetConstrain}
      </Checkbox>
      <SegmentedChoice
        {...hooks.slot('align')}
        aria-label={strings.assetAlign}
        options={aligns.map((align) => ({ value: align, label: alignLabels[align] }))}
        value={placement.align}
        onChange={(align) => {
          if (typeof align === 'string' && isAlign(align)) onChange({ ...placement, align });
        }}
      />
    </div>
  );
}
