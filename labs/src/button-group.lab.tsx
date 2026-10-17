import { Button } from '../../src/components/button/button.js';
import { ButtonGroup } from '../../src/components/button-group/button-group.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const densities = ['regular', 'compact', 'attached'] as const;
const orientations = ['horizontal', 'vertical'] as const;

mountLab(
  <>
    <LabSection
      title="Buttons"
      description="Three buttons at each density and orientation. Attached buttons share one border and round only the group's ends."
    >
      <StateMatrix
        axes={{ density: densities, orientation: orientations }}
        render={({ density, orientation }) => (
          <ButtonGroup
            aria-label={`Alignment ${density} ${orientation}`}
            density={density}
            orientation={orientation}
          >
            <Button>Left</Button>
            <Button defaultSelected>Center</Button>
            <Button>Right</Button>
          </ButtonGroup>
        )}
      />
    </LabSection>
    <LabSection
      title="Icon buttons"
      description="A cluster of icon buttons with a menu trigger; tab through it to see each keep its own tab stop."
    >
      <StateMatrix
        axes={{ density: densities, orientation: orientations }}
        render={({ density, orientation }) => (
          <ButtonGroup
            aria-label={`History ${density} ${orientation}`}
            density={density}
            orientation={orientation}
          >
            <IconButton icon="undo" label="Undo" tooltip="Undo" />
            <IconButton icon="redo" label="Redo" tooltip="Redo" />
            <DropdownMenu
              iconOnly
              label="More history"
              items={[
                { id: 'clear', label: 'Clear history' },
                { id: 'show', label: 'Show history' },
              ]}
            />
          </ButtonGroup>
        )}
      />
    </LabSection>
    <LabSection
      title="Justified"
      description="In a 360px column, the buttons share the group's width equally."
    >
      <div style={{ width: 360 }} data-lab-case="justified">
        <ButtonGroup aria-label="Period" density="attached" justified>
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
      </div>
    </LabSection>
  </>,
);
