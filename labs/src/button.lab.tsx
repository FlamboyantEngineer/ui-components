import {
  ChevronDownGlyph,
  ChevronRightGlyph,
  EyeGlyph,
  InfoGlyph,
  PlusGlyph,
  SaveGlyph,
} from '../../src/core/glyphs.js';
import type { IconSource } from '../../src/components/icon/icon.js';
import { ButtonActionCases } from './button-action-cases.js';
import { ButtonIconCases } from './button-icon-cases.js';
import { ButtonTriggerCases } from './button-trigger-cases.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { mergeProps } from '../../src/utils/merge-props.js';
import { buttonSizes, buttonStates, buttonVariants } from './button-axes.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { ButtonHostCases } from './button-host-cases.js';

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

/** Buttons and links the checkbox hides with the native attribute, at natural and full width. */
function HiddenButtons() {
  const [hidden, setHidden] = useState(true);
  return (
    <div data-lab-demo="hidden">
      <label>
        <input
          type="checkbox"
          checked={hidden}
          onChange={(event) => setHidden(event.target.checked)}
        />{' '}
        Hide the buttons
      </label>
      <p>
        <Button hidden={hidden}>Save draft</Button>{' '}
        <Button hidden={hidden} variant="primary" href="#reports">
          Open reports
        </Button>
      </p>
      <div style={{ width: 220 }}>
        <Button hidden={hidden} fullWidth variant="ghost">
          Full-width action
        </Button>
      </div>
    </div>
  );
}

/** A button disabled until a checkbox is ticked: a press while disabled leaves no press behind. */
function EnabledLater() {
  const [agreed, setAgreed] = useState(false);
  const [sent, setSent] = useState(0);
  return (
    <div data-lab-demo="enabled-later">
      <Button isDisabled={!agreed} onPress={() => setSent((count) => count + 1)}>
        Send
      </Button>{' '}
      <label>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />{' '}
        I have read the notes
      </label>
      <p data-lab-output="sent">Sent: {sent}</p>
    </div>
  );
}

/** The end icon each external-link case gives: a replacement, none, or the default glyph. */
const linkEndIcons: Record<string, IconSource> = {
  'custom icon': ChevronRightGlyph,
  'no icon': null,
};

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
        title="External and new-tab links"
        description="A link that opens a new tab (isExternal, or target=_blank) shows the external-link glyph after its label and says so to assistive technology; a same-tab link shows none. A given end icon replaces the glyph and endIcon={null} hides it; an icon-only link adds the words to its name."
      >
        <StateMatrix
          axes={{
            link: [
              'same tab',
              'isExternal',
              'target _blank',
              'custom icon',
              'no icon',
              'icon only',
            ],
            size: ['xs', 'sm', 'md', 'lg'],
          }}
          render={({ link, size }) => (
            <Button
              href="https://example.com/guide"
              size={size}
              isExternal={link !== 'same tab' && link !== 'target _blank'}
              target={link === 'target _blank' ? '_blank' : undefined}
              endIcon={linkEndIcons[link]}
              icon={link === 'icon only' ? InfoGlyph : undefined}
              label="Guide"
            >
              Guide
            </Button>
          )}
        />
      </LabSection>
      <LabSection
        title="Link variant: underline and icon sizes"
        description="variant=link draws a button as a link. Its text has no underline by default (underline none, even on hover and focus), or one on hover and keyboard focus (hover) or always (always); keyboard focus also draws the focus ring either way. Its icons, the new-tab glyph included, grow with the size: 12, 14, 16 and 20 pixels from xs to lg."
      >
        <StateMatrix
          axes={{
            link: ['internal', 'new tab', 'custom icon'],
            underline: ['none', 'hover', 'always'],
            size: ['xs', 'sm', 'md', 'lg'],
          }}
          render={({ link, underline, size }) => (
            <Button
              variant="link"
              href={link === 'internal' ? '#reports' : 'https://example.com/guide'}
              isExternal={link === 'new tab'}
              startIcon={link === 'custom icon' ? InfoGlyph : undefined}
              endIcon={link === 'custom icon' ? ChevronRightGlyph : undefined}
              underline={underline}
              size={size}
              data-lab-link={`${link}-${underline}-${size}`}
            >
              {link === 'internal' ? 'Reports' : 'Growing guide'}
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
        title="Hidden"
        description="The native hidden attribute hides a button or link at any width or variant: it takes no space, no focus and no press until it is shown again."
      >
        <HiddenButtons />
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
        title="Enabled later"
        description="Send is disabled until the checkbox is ticked. Press it first, tick the box, then press it once: it sends on that first press."
      >
        <EnabledLater />
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
    <ButtonHostCases />
  </>,
);
