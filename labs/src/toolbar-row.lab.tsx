import {
  ToolbarRow,
  ToolbarRowGroup,
  ToolbarRowSeparator,
} from '../../src/components/toolbar-row/toolbar-row.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  AttachedGroups,
  PendingToolbar,
  PresentationChanges,
  ToolbarEdgeFades,
  ToolbarOverflow,
  ToolbarScrollButtons,
} from './toolbar-row-cases.js';

const frameStyle = (width: number) => ({ width });

mountLab(
  <>
    <LabSection
      title="Toolbar row"
      description="Roles against variants. The toolbar role moves focus with the arrow keys."
    >
      <StateMatrix
        axes={{ role: ['toolbar', 'group', 'none'], variant: ['plain', 'surface'] }}
        render={({ role, variant }) => (
          <div style={frameStyle(300)}>
            <ToolbarRow
              role={role}
              variant={variant}
              {...(role === 'none' ? {} : { 'aria-label': `Fruit actions ${role} ${variant}` })}
            >
              <button type="button">Peel</button>
              <button type="button">Slice</button>
              <button type="button">Juice</button>
            </ToolbarRow>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Toolbar orientation and groups"
      description="Horizontal and vertical rows of named groups split by separators. A vertical toolbar moves focus with Up and Down."
    >
      <StateMatrix
        axes={{ orientation: ['horizontal', 'vertical'], role: ['toolbar', 'group'] }}
        render={({ orientation, role }) => (
          <div style={frameStyle(orientation === 'vertical' ? 120 : 340)}>
            <ToolbarRow
              role={role}
              orientation={orientation}
              justify="start"
              aria-label={`Kitchen tools ${orientation} ${role}`}
            >
              <ToolbarRowGroup aria-label={`Knives ${orientation} ${role}`}>
                <button type="button">Peel</button>
                <button type="button">Slice</button>
              </ToolbarRowGroup>
              <ToolbarRowSeparator />
              <ToolbarRowGroup aria-label={`Machines ${orientation} ${role}`}>
                <button type="button">Juice</button>
              </ToolbarRowGroup>
            </ToolbarRow>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Toolbar overflow"
      description="In a 240px host: wrap flows the tools and their groups onto more rows, scroll keeps one row that scrolls between edge buttons, none keeps one row and leaves overflow to the caller."
    >
      <ToolbarOverflow />
    </LabSection>
    <LabSection title="Scroll buttons">
      <ToolbarScrollButtons />
    </LabSection>
    <LabSection
      title="Toolbar edge fades"
      description="Edge fades are on by default: a fade covers each edge that hides tools, under the chevron. With showEdgeFades={false} a scrolling row draws only its chevrons, on the canvas."
    >
      <ToolbarEdgeFades />
    </LabSection>
    <LabSection
      title="Presentation changes keep drafts"
      description="Type in the notes and the search, then toggle the dividers, cycle the toolbar's overflow or turn it vertical: the drafts and the focus stay, since only the presentation changes."
    >
      <PresentationChanges />
    </LabSection>
    <LabSection
      title="Attached toolbar groups"
      description="An attached group joins its tools into one segmented run; each tool stays a toolbar stop."
    >
      <AttachedGroups />
    </LabSection>
    <LabSection
      title="Pending toolbar"
      description="While the editor starts, the row keeps its place but is not painted and its tools are inert, so the text below never moves."
    >
      <PendingToolbar />
    </LabSection>
  </>,
);
