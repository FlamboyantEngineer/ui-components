import { LabSection, mountLab } from './chrome/index.js';
import {
  AssetPlacementComposition,
  CalendarEditorComposition,
  TimelineEditorComposition,
} from './composition-editors.js';
import {
  FormulaBarComposition,
  StateMachineComposition,
  TableWorkflowComposition,
} from './composition-editors-grid.js';

mountLab(
  <>
    <LabSection
      title="Event drafts"
      description="The host validates and saves a form over calendar navigation and event interaction."
    >
      <CalendarEditorComposition />
    </LabSection>
    <LabSection
      title="Timeline drafts"
      description="An item's menu opens a host form; timeline geometry and keyboard interaction remain reusable."
    >
      <TimelineEditorComposition />
    </LabSection>
    <LabSection
      title="Asset placement"
      description="Asynchronous asset selection followed by host dimensions, alternative text and placement."
    >
      <AssetPlacementComposition />
    </LabSection>
    <LabSection
      title="Raw source editing"
      description="A host owns the active address and source draft; Apply and Cancel commit or restore it."
    >
      <FormulaBarComposition />
    </LabSection>
    <LabSection
      title="Selected row actions"
      description="Select editable rows, apply a host bulk action and preview CSV for an explicit scope."
    >
      <TableWorkflowComposition />
    </LabSection>
    <LabSection
      title="State visualizations"
      description="The host chooses a graph or sequence over the same neutral state data."
    >
      <StateMachineComposition />
    </LabSection>
  </>,
);
