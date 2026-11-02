// View Switcher case: an uncontrolled starting view that is not the first or the default one.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { FolderGlyph, ClockGlyph, UsersGlyph } from '../../src/core/glyphs.js';
import type { Key } from '../../src/core/props.js';
import {
  ViewSwitcher,
  type ViewSwitcherView,
} from '../../src/components/view-switcher/view-switcher.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const views: ViewSwitcherView[] = [
  { id: 'all', label: 'All recipes', icon: FolderGlyph },
  { id: 'quick', label: 'Quick meals', icon: ClockGlyph },
  { id: 'mine', label: 'My recipes', icon: UsersGlyph },
];

function StartingView() {
  const [mount, setMount] = useState(1);
  const [renders, setRenders] = useState(1);
  const [selections, setSelections] = useState<Key[]>([]);
  return (
    <div data-lab-demo="starting-view">
      <p>
        <Button size="sm" variant="secondary" onPress={() => setRenders((count) => count + 1)}>
          Render again
        </Button>{' '}
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            setMount((count) => count + 1);
            setSelections([]);
          }}
        >
          Mount again
        </Button>
      </p>
      <LabOutput name="mount">{`mount ${mount}, render ${renders}`}</LabOutput>
      <LabOutput name="selections">{selections.map(String).join(', ') || 'none'}</LabOutput>
      <ViewSwitcher
        key={mount}
        aria-label="Starting view"
        views={views}
        defaultViewKey="all"
        defaultSelectedKey="mine"
        onSelectionChange={(key) => setSelections((previous) => [...previous, key])}
      >
        <p>Render {renders} of the selected view.</p>
      </ViewSwitcher>
    </div>
  );
}

export function ViewSwitcherCases() {
  return (
    <div data-lab-family="view-switcher-cases">
      <LabSection
        title="Starting view"
        description="Uncontrolled, defaultSelectedKey opens My recipes, though All recipes is first and the default view. Selecting a view reports it through onSelectionChange. Render again keeps the selection; Mount again starts over at My recipes."
      >
        <StartingView />
      </LabSection>
    </div>
  );
}
