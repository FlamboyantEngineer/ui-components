import { RedoGlyph, UndoGlyph } from '../../src/core/glyphs.js';
import { Button } from '../../src/components/button/button.js';
import { ButtonGroup } from '../../src/components/button-group/button-group.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const densities = ['default', 'compact', 'attached'] as const;
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
            <Button icon={UndoGlyph} label="Undo" tooltip="Undo" />
            <Button icon={RedoGlyph} label="Redo" tooltip="Redo" />
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
      title="Selected on a shared edge"
      description="The selected button's border stays above its neighbours at rest, after the pointer leaves, in both orientations, right to left and while disabled; hover a neighbour and the selected border still shows, Tab to a button and its focus ring rises above both."
    >
      <StateMatrix
        axes={{
          selected: ['first', 'middle', 'last'],
          layout: ['horizontal', 'vertical', 'right to left', 'disabled'],
        }}
        render={({ selected, layout }) => (
          <div dir={layout === 'right to left' ? 'rtl' : undefined}>
            <ButtonGroup
              aria-label={`Size ${selected} ${layout}`}
              density="attached"
              orientation={layout === 'vertical' ? 'vertical' : 'horizontal'}
            >
              {['Small', 'Medium', 'Large'].map((size, index) => (
                <Button
                  key={size}
                  isSelected={index === ['first', 'middle', 'last'].indexOf(selected)}
                  isDisabled={layout === 'disabled'}
                >
                  {size}
                </Button>
              ))}
            </ButtonGroup>
          </div>
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
    <LabSection
      title="Swapped root"
      description="render replaces the group's root with a caller's div that keeps every prop it receives (role, name, hooks and ref). The first shows the state it was given: hover the group or tab into it. The second is attached, and its swapped root still joins the buttons."
    >
      <div data-lab-case="render">
        <ButtonGroup
          aria-label="Alignment"
          render={(props, state) => (
            <div {...props} data-lab-swapped="">
              {props.children}
              <output aria-label="Group state" data-lab-output="state">
                {[
                  state.isHovered ? 'hovered' : null,
                  state.isFocusWithin ? 'focus within' : null,
                  state.isFocusVisible ? 'focus visible' : null,
                ]
                  .filter(Boolean)
                  .join(', ') || 'idle'}
              </output>
            </div>
          )}
        >
          <Button>Left</Button>
          <Button>Centre</Button>
          <Button>Right</Button>
        </ButtonGroup>
        <ButtonGroup
          aria-label="Zoom"
          density="attached"
          render={(props) => <div {...props} data-lab-swapped="" />}
        >
          <Button>Zoom out</Button>
          <Button>Reset zoom</Button>
          <Button>Zoom in</Button>
        </ButtonGroup>
      </div>
    </LabSection>
  </>,
);
