import { FolderGlyph } from '../../src/core/glyphs.js';
import { useState, type KeyboardEvent } from 'react';
import { ExpandToggle } from '../../src/components/expand-toggle/expand-toggle.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const glyphs = {
  chevron: undefined,
  folder: FolderGlyph,
  'no icon (null)': null,
} as const;

/** A row that takes Tab itself: its toggle is out of the tab order, and the arrows toggle it. */
function TabOwningRow() {
  const [isExpanded, setExpanded] = useState(false);
  const [opened, setOpened] = useState(0);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      setExpanded(event.key === 'ArrowRight');
    } else if (event.key === 'Enter') {
      setOpened((count) => count + 1);
    }
  };
  return (
    <div data-lab-case="tab-owning-row">
      <div
        role="group"
        aria-label="Citrus"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onClick={() => setOpened((count) => count + 1)}
        data-lab-row="tab-owner"
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <ExpandToggle
          excludeFromTabOrder
          isExpanded={isExpanded}
          onExpandedChange={setExpanded}
          aria-controls="tab-owning-children"
        />
        <span>Citrus</span>
      </div>
      {isExpanded ? (
        <ul id="tab-owning-children">
          <li>Lemon</li>
          <li>Lime</li>
        </ul>
      ) : null}
      <p>
        Row opened: <output data-lab-output="row-opened">{opened}</output>
      </p>
    </div>
  );
}

/** A toggle on the caller's own button inside a clickable row, showing the state it receives. */
function SwappedToggle() {
  const [isExpanded, setExpanded] = useState(false);
  const [opened, setOpened] = useState(0);
  return (
    <div data-lab-case="swapped-toggle">
      <div
        data-lab-row="swapped"
        onClick={() => setOpened((count) => count + 1)}
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <ExpandToggle
          isExpanded={isExpanded}
          onExpandedChange={setExpanded}
          aria-controls="swapped-children"
          render={(props, state) => (
            <button
              {...props}
              data-lab-swapped="true"
              data-lab-hovered={state.isHovered}
              data-lab-focus-visible={state.isFocusVisible}
              style={{
                outline: state.isHovered || state.isFocusVisible ? '2px dashed' : undefined,
                outlineOffset: 2,
              }}
            />
          )}
        />
        <span>Berries</span>
      </div>
      {isExpanded ? (
        <ul id="swapped-children">
          <li>Strawberry</li>
          <li>Blueberry</li>
        </ul>
      ) : null}
      <p>
        Row opened: <output data-lab-output="row-opened">{opened}</output>
      </p>
    </div>
  );
}

export function ExpandToggleHostCases() {
  return (
    <div data-lab-family="expand-toggle-host-cases">
      <LabSection
        title="Glyphs and tooltip"
        description="The chevron, a custom folder glyph that a narrow panel might show, and a null icon that falls back to the chevron; each collapsed and expanded, with a tooltip on hover and keyboard focus. The name and aria-expanded stay the same whatever the glyph."
      >
        <StateMatrix
          axes={{
            icon: Object.keys(glyphs) as (keyof typeof glyphs)[],
            state: ['collapsed', 'expanded'],
          }}
          render={({ icon, state }) => (
            <ExpandToggle
              icon={glyphs[icon]}
              defaultExpanded={state === 'expanded'}
              tooltip="Show the varieties"
            />
          )}
        />
      </LabSection>
      <LabSection
        title="A row that owns Tab"
        description="Tab stops on the row, not the toggle (excludeFromTabOrder). Right arrow expands it, Left arrow collapses it and Enter opens the row; a pointer can still press the toggle without opening the row."
      >
        <TabOwningRow />
      </LabSection>
      <LabSection
        title="Swapped root"
        description="The toggle renders on the caller's own button through render, spreading its props and drawing a dashed outline from the hover and keyboard focus state it receives (data-lab-hovered and data-lab-focus-visible). Pressing it expands Berries without opening the row; clicking the row's text opens it."
      >
        <SwappedToggle />
      </LabSection>
    </div>
  );
}
