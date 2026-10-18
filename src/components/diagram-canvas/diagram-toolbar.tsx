import { useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { ZoomControl } from '../zoom-control/zoom-control.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import type { DiagramController } from './use-diagram-controller.js';

/** `canvas` draws the diagram; `outline` lists its nodes and their links. */
export type DiagramView = 'canvas' | 'outline';

export interface DiagramToolbarProps {
  controller: DiagramController;
  view: DiagramView;
  onViewChange: (view: DiagramView) => void;
}

/** The zoom control and fit button of the canvas, and the switch between canvas and outline. */
export function DiagramToolbar({ controller, view, onViewChange }: DiagramToolbarProps) {
  const strings = useUiStrings();
  const { viewport, zoomTo, fit } = controller.view;
  return (
    <div {...hooks.slot('toolbar')}>
      {view === 'canvas' ? (
        <>
          <ZoomControl
            className={hooks.slotClass('zoom')}
            value={viewport.zoom}
            onChange={(zoom) => zoomTo(zoom)}
            resetValue={100}
            formatOptions={{ maximumFractionDigits: 0 }}
          />
          <IconButton
            className={hooks.slotClass('fit')}
            icon="expand"
            label={strings.diagramFit}
            tooltip={strings.diagramFit}
            size="sm"
            variant="ghost"
            isDisabled={controller.nodes.length === 0}
            onPress={fit}
          />
        </>
      ) : null}
      <SegmentedChoice
        className={hooks.slotClass('view-switch')}
        aria-label={strings.diagramView}
        size="sm"
        sizing="content"
        options={[
          { value: 'canvas', label: strings.diagramCanvasView },
          { value: 'outline', label: strings.diagramOutlineView },
        ]}
        value={view}
        onChange={(next) => {
          if (next === 'canvas' || next === 'outline') onViewChange(next);
        }}
      />
    </div>
  );
}
