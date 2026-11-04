import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Icon } from '../../src/components/icon/icon.js';
import { Tooltip, type TooltipVariant } from '../../src/components/tooltip/tooltip.js';
import { RedoGlyph, RefreshGlyph, UndoGlyph } from '../../src/core/glyphs.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { AnchoredTooltipCases } from './tooltip-anchored-cases.js';
import { TooltipTimingSections } from './tooltip-timing-cases.js';

const variants: TooltipVariant[] = ['default', 'info'];
const placements = ['top', 'bottom', 'start', 'end'] as const;

/**
 * A hint the page shows and keeps open, whatever the hint reports, and can lock: a locked hint draws
 * closed and asks the page once to close it.
 */
function LockedHint() {
  const [isOpen, setOpen] = useState(false);
  const [isLocked, setLocked] = useState(false);
  const [requests, setRequests] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Button onPress={() => setOpen(true)}>Show the drafts hint</Button>
      <Button onPress={() => setLocked(!isLocked)}>
        {isLocked ? 'Unlock the drafts hint' : 'Lock the drafts hint'}
      </Button>
      <Tooltip
        content="Saved drafts"
        isOpen={isOpen}
        onOpenChange={(next) => {
          if (!next) setRequests((count) => count + 1);
        }}
        isDisabled={isLocked}
      >
        <Button>Drafts</Button>
      </Tooltip>
      <output data-lab-output="locked-hint">{`${requests} close requests`}</output>
    </div>
  );
}

function EscapeOwnerHint() {
  const [escapes, setEscapes] = useState(0);
  return (
    <div
      data-lab-demo="escape-owner"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setEscapes((previous) => previous + 1);
      }}
    >
      <Button>Before the hint</Button>
      <Tooltip content="A hint for the command">
        <Button>Hinted command</Button>
      </Tooltip>
      <output data-lab-output="owner-escapes">{escapes}</output>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Escape ownership"
      description="Closing a hint leaves the same Escape available to its owning surface."
    >
      <EscapeOwnerHint />
    </LabSection>
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
      description="The first pointer entry or keyboard focus opens each hint; hints flip when there is no room."
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
              icon={UndoGlyph}
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
                <Icon
                  icon={label === 'Undo' ? UndoGlyph : label === 'Redo' ? RedoGlyph : RefreshGlyph}
                />
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
      title="Disabled while open"
      description="The page shows the hint and keeps it open. Locking draws it closed and asks the page to close it once; unlocking shows it again, since the page still keeps it open."
    >
      <LockedHint />
    </LabSection>
    <LabSection
      title="Anchored tooltips"
      description="Hints the page opens itself: on a status chip it owns, on the bars of an SVG chart, on a region of a scrolling plan with no element of its own (the hint follows it as the plan scrolls), a visual-only hint that repeats an icon button's name, and a stage button the page replaces and removes under one ref: the hint moves with it and hides while it is gone."
    >
      <AnchoredTooltipCases />
    </LabSection>
    <TooltipTimingSections />
  </>,
);
