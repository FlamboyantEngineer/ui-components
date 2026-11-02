// Toolbar Scroller case: a tool disabled and enabled while it moves between the strip and the menu.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { Switch } from '../../src/components/switch/switch.js';
import {
  ToolbarScroller,
  type ToolbarScrollerItem,
} from '../../src/components/toolbar-scroller/toolbar-scroller.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const names = ['Bold', 'Italic', 'Underline', 'Strike', 'Highlight', 'Link'];
const widths = { wide: 640, narrow: 200 } as const;
type Width = keyof typeof widths;

function DisablableTool() {
  const [width, setWidth] = useState<Width>('narrow');
  const [isLinkDisabled, setLinkDisabled] = useState(true);
  const [last, setLast] = useState('none');
  const tools: ToolbarScrollerItem[] = names.map((name) => ({
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
        <ToolbarScroller
          aria-label="Formatting with a disabled tool"
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

export function ToolbarScrollerCases() {
  return (
    <div data-lab-family="toolbar-scroller-cases">
      <LabSection
        title="A disabled tool"
        description="Link carries isDisabled, which renderItem passes to its button and the overflow menu gives its entry. Narrow puts Link in the menu, Wide in the strip; neither runs it while disabled. Turn Disable Link off and choose it to see the action run."
      >
        <DisablableTool />
      </LabSection>
    </div>
  );
}
