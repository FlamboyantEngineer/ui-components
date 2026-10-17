import {
  ColorArea,
  ColorField as AriaColorField,
  ColorSlider,
  ColorThumb,
  Dialog,
  Input,
  Popover,
  SliderTrack,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import type { FieldState } from '../field/field.js';

export const colorFieldHooks = createHooks('color-field', [
  'trigger',
  'swatch',
  'value',
  'popover',
  'dialog',
  'area',
  'slider',
  'track',
  'thumb',
  'hex',
  'input',
  'clear',
]);

const hooks = colorFieldHooks;

/**
 * The picker popover: a saturation and brightness area, a hue slider, a hex input and Clear, which
 * closes the picker once the colour is gone.
 */
export function ColorFieldPanel({
  label,
  state,
}: {
  label: string;
  state: FieldState<string | null>;
}) {
  const strings = useUiStrings();
  return (
    <Popover {...hooks.slot('popover')} placement="bottom start" offset={4}>
      <Dialog {...hooks.slot('dialog')} aria-label={label}>
        {({ close }) => (
          <>
            <ColorArea
              {...hooks.slot('area')}
              colorSpace="hsb"
              xChannel="saturation"
              yChannel="brightness"
            >
              <ColorThumb {...hooks.slot('thumb')} />
            </ColorArea>
            <ColorSlider {...hooks.slot('slider')} colorSpace="hsb" channel="hue">
              <SliderTrack {...hooks.slot('track')}>
                <ColorThumb {...hooks.slot('thumb')} />
              </SliderTrack>
            </ColorSlider>
            <AriaColorField {...hooks.slot('hex')} aria-label={strings.hexColor}>
              <Input {...hooks.slot('input')} />
            </AriaColorField>
            {state.isRequired ? null : (
              <Button
                className={hooks.slotClass('clear')}
                variant="ghost"
                size="sm"
                isDisabled={!state.canClear}
                onPress={() => {
                  state.clear();
                  close();
                }}
              >
                {strings.clear}
              </Button>
            )}
          </>
        )}
      </Dialog>
    </Popover>
  );
}
