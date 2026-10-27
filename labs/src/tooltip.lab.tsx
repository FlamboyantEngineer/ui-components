import { Button } from '../../src/components/button/button.js';
import { Icon } from '../../src/components/icon/icon.js';

import { Tooltip, type TooltipVariant } from '../../src/components/tooltip/tooltip.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { AnchoredTooltipCases } from './tooltip-anchored-cases.js';

const variants: TooltipVariant[] = ['default', 'info'];
const placements = ['top', 'bottom', 'start', 'end'] as const;

mountLab(
  <>
    <LabSection
      title="Variants and states"
      description="Each variant at rest and open. Hover or focus a resting trigger to open its hint."
    >
      <StateMatrix
        axes={{ variant: variants, state: ['resting', 'open'] }}
        render={({ variant, state }) => (
          <div style={{ paddingBlock: 40, paddingInline: 24 }}>
            <Tooltip
              variant={variant}
              content={variant === 'info' ? 'Totals refresh every hour.' : 'Save changes'}
              defaultOpen={state === 'open'}
            >
              <Button>{variant === 'info' ? 'About totals' : 'Save'}</Button>
            </Tooltip>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Placements"
      description="Hover or focus each trigger; hints flip when there is no room."
    >
      <StateMatrix
        axes={{ placement: placements }}
        render={({ placement }) => (
          <div style={{ padding: 24 }}>
            <Tooltip content={`Placed ${placement}`} placement={placement}>
              <Button>{placement}</Button>
            </Tooltip>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Button tooltips"
      description="The tooltip prop on Button and Button, including pending and focusable disabled buttons."
    >
      <StateMatrix
        axes={{
          control: ['button', 'icon button'],
          state: ['default', 'pending', 'focusable disabled'],
        }}
        render={({ control, state }) =>
          control === 'button' ? (
            <Button
              tooltip={
                state === 'focusable disabled' ? 'Only owners can publish' : 'Publish the report'
              }
              isPending={state === 'pending'}
              isDisabled={state === 'focusable disabled'}
              focusableWhenDisabled
            >
              Publish
            </Button>
          ) : (
            <Button
              icon="undo"
              label="Undo"
              tooltip={state === 'focusable disabled' ? 'Nothing to undo' : 'Undo the last edit'}
              isPending={state === 'pending'}
              isDisabled={state === 'focusable disabled'}
              focusableWhenDisabled
            />
          )
        }
      />
    </LabSection>
    <LabSection
      title="Label relationship"
      description="The hint is the trigger's name, open or not: these icon-only triggers have no other label."
    >
      <StateMatrix
        axes={{ label: ['Undo', 'Redo', 'Refresh'] }}
        render={({ label }) => (
          <div style={{ padding: 24 }}>
            <Tooltip relationship="label" content={label}>
              <Button variant="ghost">
                <Icon glyph={label === 'Undo' ? 'undo' : label === 'Redo' ? 'redo' : 'refresh'} />
              </Button>
            </Tooltip>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Delay and trigger"
      description="No delay, a long delay, and a hint that opens on focus only."
    >
      <StateMatrix
        axes={{ option: ['no delay', 'long delay', 'focus only'] }}
        render={({ option }) => (
          <Tooltip
            content={`Hint with ${option}`}
            {...(option === 'no delay' ? { delay: 0 } : {})}
            {...(option === 'long delay' ? { delay: 1500 } : {})}
            {...(option === 'focus only' ? { trigger: 'focus' as const } : {})}
          >
            <Button>{option}</Button>
          </Tooltip>
        )}
      />
    </LabSection>
    <LabSection
      title="Anchored tooltips"
      description="Hints the page opens itself: on a status chip it owns, on the bars of an SVG chart, on a region of a scrolling plan with no element of its own (the hint follows it as the plan scrolls), and a visual-only hint that repeats an icon button's name."
    >
      <AnchoredTooltipCases />
    </LabSection>
  </>,
);
