// Toolbar Row cases for the overflow menu: tools given as data collapse into a "more" menu by
// priority, keep their drafts across overflow modes, and stay disabled in the strip and the menu.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { Switch } from '../../src/components/switch/switch.js';
import { ToolbarRow, type ToolbarRowItem } from '../../src/components/toolbar-row/toolbar-row.js';
import { SaveGlyph } from '../../src/core/glyphs.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const manyTools = ['Bold', 'Italic', 'Underline', 'Strike', 'Highlight', 'Link', 'Quote', 'Code'];
const menuWidths = { wide: 640, medium: 360, narrow: 200 } as const;

function MenuTools({ width }: { width: keyof typeof menuWidths }) {
  const [last, setLast] = useState('none');
  const tools: ToolbarRowItem[] = [
    ...manyTools.map((name) => ({ id: name, label: name, onAction: () => setLast(name) })),
    { id: 'save', label: 'Save', icon: SaveGlyph, priority: 1, onAction: () => setLast('Save') },
  ];
  return (
    <div style={{ width: menuWidths[width] }} data-lab-menu={width}>
      <ToolbarRow
        aria-label={`Editing, ${width}`}
        justify="start"
        space="xs"
        overflow="menu"
        items={tools}
        renderItem={(tool) => (
          <Button variant="ghost" size="sm" onPress={() => setLast(tool.label)}>
            {tool.label}
          </Button>
        )}
      />
      <LabOutput name="last">{last}</LabOutput>
    </div>
  );
}

const switchModes = ['scroll', 'menu', 'wrap'] as const;

/** Switching the overflow mode keeps the tools that stay visible, with their drafts and focus. */
function SwitchingMode() {
  const [overflow, setOverflow] = useState<(typeof switchModes)[number]>('scroll');
  const next = switchModes[(switchModes.indexOf(overflow) + 1) % switchModes.length] ?? 'scroll';
  const tools = [
    { id: 'find', label: 'Find' },
    { id: 'replace', label: 'Replace' },
  ];
  return (
    <div style={{ width: 360 }} data-lab-demo="switching-mode">
      <Button onPress={() => setOverflow(next)}>Switch to {next}</Button>
      <ToolbarRow
        aria-label="Find and replace"
        justify="start"
        overflow={overflow}
        items={tools}
        renderItem={(tool) => <input aria-label={tool.label} placeholder={tool.label} />}
      />
    </div>
  );
}

const names = ['Bold', 'Italic', 'Underline', 'Strike', 'Highlight', 'Link'];
const widths = { wide: 640, narrow: 200 } as const;
type Width = keyof typeof widths;

/** A tool disabled and enabled while it moves between the strip and the menu. */
function DisablableTool() {
  const [width, setWidth] = useState<Width>('narrow');
  const [isLinkDisabled, setLinkDisabled] = useState(true);
  const [last, setLast] = useState('none');
  const tools: ToolbarRowItem[] = names.map((name) => ({
    id: name,
    label: name,
    isDisabled: name === 'Link' && isLinkDisabled,
    onAction: () => setLast(`${name} from the menu`),
  }));
  return (
    <div data-lab-demo="disabled-tool">
      <SegmentedChoice
        aria-label="Toolbar width"
        size="sm"
        sizing="content"
        options={[
          { value: 'wide', label: 'Wide' },
          { value: 'narrow', label: 'Narrow' },
        ]}
        value={width}
        onChange={(value) => setWidth(value === 'wide' ? 'wide' : 'narrow')}
      />{' '}
      <Switch isSelected={isLinkDisabled} onChange={setLinkDisabled}>
        Disable Link
      </Switch>
      <div style={{ width: widths[width] }}>
        <ToolbarRow
          aria-label="Formatting with a disabled tool"
          justify="start"
          space="xs"
          overflow="menu"
          items={tools}
          renderItem={(tool) => (
            <Button
              variant="ghost"
              size="sm"
              isDisabled={tool.isDisabled}
              onPress={() => setLast(`${tool.label} from the strip`)}
            >
              {tool.label}
            </Button>
          )}
        />
      </div>
      <LabOutput name="last">{last}</LabOutput>
    </div>
  );
}

export function ToolbarMenuSections() {
  return (
    <>
      <LabSection
        title="Overflow menu"
        description="With overflow menu the tools given as items that do not fit move into a menu at the end of the toolbar; Save has a higher priority and stays."
      >
        <StateMatrix
          axes={{ width: ['wide', 'medium', 'narrow'] }}
          render={({ width }) => <MenuTools width={width} />}
        />
      </LabSection>
      <LabSection
        title="Switching to and from the menu"
        description="Type a draft in Find, then switch between scroll, menu and wrap: the tools fit every way, so they keep their drafts."
      >
        <SwitchingMode />
      </LabSection>
      <LabSection
        title="A disabled tool in the menu"
        description="Link carries isDisabled, which renderItem passes to its button and the overflow menu gives its entry. Narrow puts Link in the menu, Wide in the strip; neither runs it while disabled. Turn Disable Link off and choose it to see the action run."
      >
        <DisablableTool />
      </LabSection>
    </>
  );
}
