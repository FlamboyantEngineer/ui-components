import {
  ChevronDownGlyph,
  ChevronRightGlyph,
  EyeGlyph,
  InfoGlyph,
  PlusGlyph,
  SaveGlyph,
} from '../../src/core/glyphs.js';
import { ButtonActionCases } from './button-action-cases.js';
import { ButtonIconCases } from './button-icon-cases.js';
import { ButtonTriggerCases } from './button-trigger-cases.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { mergeProps } from '../../src/utils/merge-props.js';
import { buttonSizes, buttonStates, buttonVariants } from './button-axes.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const hints = ['tooltip', 'shortcut', 'tooltip and shortcut'] as const;

function Toggles() {
  const [pinned, setPinned] = useState(false);
  return (
    <div data-lab-demo="toggles">
      <Button startIcon={EyeGlyph} defaultSelected>
        Show grid
      </Button>{' '}
      <Button
        isSelected={pinned}
        onChange={setPinned}
        tooltip={pinned ? 'Press again to unpin' : undefined}
      >
        Pin panel
      </Button>
      <p data-lab-output="pinned">Pinned: {pinned ? 'yes' : 'no'}</p>
    </div>
  );
}

mountLab(
  <>
    <div data-lab-family="button-main">
      <LabSection title="Variants and sizes">
        <StateMatrix
          axes={{ variant: buttonVariants, size: buttonSizes }}
          render={({ variant, size }) => (
            <Button variant={variant} size={size}>
              Save changes
            </Button>
          )}
        />
      </LabSection>
      <LabSection
        title="States"
        description="Hover, press and keyboard focus show on interaction; tab through the matrix to see focus."
      >
        <StateMatrix
          axes={{ variant: buttonVariants, state: buttonStates }}
          render={({ variant, state }) => (
            <Button
              variant={variant}
              startIcon={PlusGlyph}
              isSelected={state === 'selected'}
              isDisabled={state === 'disabled' || state === 'focusable disabled'}
              focusableWhenDisabled={state === 'focusable disabled'}
              isPending={state === 'pending'}
            >
              Add item
            </Button>
          )}
        />
      </LabSection>
      <LabSection title="Icons">
        <StateMatrix
          axes={{ icons: ['start', 'end', 'both'], size: buttonSizes }}
          render={({ icons, size }) => (
            <Button
              size={size}
              {...(icons !== 'end' ? { startIcon: PlusGlyph } : {})}
              {...(icons !== 'start' ? { endIcon: ChevronDownGlyph } : {})}
            >
              New
            </Button>
          )}
        />
      </LabSection>
      <LabSection
        title="Hint and shortcut"
        description="Hover or tab to a button: its tooltip shows the hint, then the keyboard shortcut in the reader's notation. The button publishes aria-keyshortcuts and never listens for the keys."
      >
        <StateMatrix
          axes={{ hint: hints, state: ['default', 'focusable disabled', 'pending'] }}
          render={({ hint, state }) => (
            <Button
              startIcon={SaveGlyph}
              isDisabled={state === 'focusable disabled'}
              focusableWhenDisabled
              isPending={state === 'pending'}
              {...(hint === 'shortcut' ? {} : { tooltip: 'Save every change' })}
              {...(hint === 'tooltip' ? {} : { shortcut: 'Ctrl+Shift+S' })}
            >
              Save
            </Button>
          )}
        />
      </LabSection>
      <LabSection title="Content and alignment" description="Each in a 220px column.">
        <StateMatrix
          axes={{ content: ['label', 'sentence', 'parts'], align: ['center', 'start'] }}
          render={({ content, align }) => (
            <div style={{ width: 220 }}>
              <Button
                content={content}
                align={align}
                fullWidth
                {...(content === 'parts' ? {} : { startIcon: InfoGlyph })}
              >
                {content === 'parts' ? (
                  <>
                    <span>Part one</span>
                    <span>Part two</span>
                  </>
                ) : content === 'sentence' ? (
                  'Summarise the selected rows into a short paragraph'
                ) : (
                  'Details'
                )}
              </Button>
            </div>
          )}
        />
      </LabSection>
      <LabSection
        title="Links"
        description="With href the button is a link drawn through the provider's link renderer, with the same hooks. A disabled link is text."
      >
        <StateMatrix
          axes={{ variant: ['primary', 'secondary', 'link'], link: ['enabled', 'disabled'] }}
          render={({ variant, link }) => (
            <Button
              href="#reports"
              variant={variant}
              endIcon={ChevronRightGlyph}
              isDisabled={link === 'disabled'}
            >
              Open reports
            </Button>
          )}
        />
      </LabSection>
      <LabSection
        title="Toggles"
        description="A button with defaultSelected keeps its own pressed state; one with isSelected and onChange leaves it to its caller. Pin panel gains a hint while pinned and loses it again, keeping keyboard focus."
      >
        <Toggles />
      </LabSection>
      <LabSection
        title="Caller hook precedence"
        description="The component's fullWidth state wins over a conflicting caller data attribute, including when the state is off."
      >
        <Button fullWidth={false} data-full-width="true">
          Natural width
        </Button>
      </LabSection>
      <LabSection
        title="Swapped element"
        description="The render prop replaces the button element; the caller's element keeps every hook."
      >
        <Button
          variant="primary"
          render={(props) => <button {...mergeProps(props, { 'data-lab-swapped': '' })} />}
        >
          Swapped
        </Button>
      </LabSection>
    </div>
    <ButtonIconCases />
    <ButtonActionCases />
    <ButtonTriggerCases />
  </>,
);
