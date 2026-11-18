import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ImageHotspots,
  type ImageHotspotsItem,
} from '../../src/components/image-hotspots/index.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  brokenImageSrc,
  frontHotspots,
  frontPanel,
  type FrontPanelState,
  rearHotspots,
  rearPanel,
} from './image-hotspots-samples.js';

const states = ['plain', 'pressed', 'disabled', 'advisory'] as const;
const zooms = ['100', '200'] as const;

const cellHotspot: Record<(typeof states)[number], Partial<ImageHotspotsItem>> = {
  plain: {},
  pressed: { isPressed: true },
  disabled: { isDisabled: true },
  advisory: { tone: 'warning', message: 'Check first' },
};

/** The caller's answer to a pressed key: toggles that state, or records a plain press. */
function applyAction(state: FrontPanelState, id: Key): FrontPanelState {
  if (id === 'power') return { ...state, power: !state.power };
  if (id === 'output-a' || id === 'inset-a') return { ...state, outputA: !state.outputA };
  if (id === 'output-b') return { ...state, outputB: !state.outputB };
  return state;
}

/** The front panel driven by caller state: shared toggles, a disabled fuse and a dispatch log. */
function FrontPanel() {
  const [state, setState] = useState<FrontPanelState>({
    power: true,
    outputA: false,
    outputB: true,
    isFuseMissing: true,
  });
  const [zoom, setZoom] = useState(100);
  const [log, setLog] = useState<Key[]>([]);
  return (
    <div data-lab-demo="front-panel">
      <ImageHotspots
        aria-label="Front panel controls"
        src={frontPanel.src}
        alt="Drawing of a front panel with switches, a dial, lamps and a fuse holder"
        width={frontPanel.width}
        height={frontPanel.height}
        hotspots={frontHotspots(state)}
        zoom={zoom}
        onZoomChange={setZoom}
        showZoomReset
        onAction={(id) => {
          setLog((entries) => [...entries.slice(-5), id]);
          setState((current) => applyAction(current, id));
        }}
      />
      <p>
        Zoom: <output data-lab-output="zoom">{zoom}</output>; dispatched keys:{' '}
        <output data-lab-output="log">{log.join(', ') || 'none'}</output>; output A:{' '}
        <output data-lab-output="output-a">{state.outputA ? 'on' : 'off'}</output>
      </p>
      <Button
        size="sm"
        onPress={() =>
          setState((current) => ({ ...current, isFuseMissing: !current.isFuseMissing }))
        }
      >
        {state.isFuseMissing ? 'Fit the fuse' : 'Remove the fuse'}
      </Button>
    </div>
  );
}

/** One surface whose image changes: each panel brings its own size and hotspots. */
function ChangingImage() {
  const [panelId, setPanelId] = useState<'front' | 'rear' | 'broken'>('rear');
  const [pressed, setPressed] = useState<Key>('none');
  const panel = panelId === 'front' ? frontPanel : rearPanel;
  const hotspots =
    panelId === 'front'
      ? frontHotspots({ power: true, outputA: false, outputB: false, isFuseMissing: false })
      : rearHotspots;
  return (
    <div data-lab-demo="changing-image">
      <p>
        <Button size="sm" isSelected={panelId === 'rear'} onPress={() => setPanelId('rear')}>
          Rear panel
        </Button>{' '}
        <Button size="sm" isSelected={panelId === 'front'} onPress={() => setPanelId('front')}>
          Front panel
        </Button>{' '}
        <Button size="sm" isSelected={panelId === 'broken'} onPress={() => setPanelId('broken')}>
          Unavailable image
        </Button>
      </p>
      <ImageHotspots
        aria-label="Panel controls"
        src={panelId === 'broken' ? brokenImageSrc : panel.src}
        alt={panelId === 'broken' ? 'Side panel' : `Drawing of the ${panel.name.toLowerCase()}`}
        width={panel.width}
        height={panel.height}
        hotspots={hotspots}
        onAction={setPressed}
      />
      <p>
        Last pressed: <output data-lab-output="pressed">{String(pressed)}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Caller-owned panel"
      description="The caller holds every state. Power, Output A and Output B are toggles; Output A also has an inset copy that shows the same state. With the power off the outputs refuse presses. The fuse holder is disabled with a visible warning until the fuse is fitted. Focus the image and press + or - to zoom, Tab to reach each hotspot and Enter or Space to press it."
    >
      <FrontPanel />
    </LabSection>
    <LabSection
      title="Changing the image"
      description="A new src, size and hotspot list load in place; the third image fails to load, and its hotspots stay pressable."
    >
      <ChangingImage />
    </LabSection>
    <LabSection
      title="Hotspot states and zoom"
      description="One hotspot over the power switch in each state, at 100% and 200% of the fit. The rectangle stays on the switch at every zoom."
    >
      <StateMatrix
        axes={{ state: states, zoom: zooms }}
        render={({ state, zoom }) => (
          <ImageHotspots
            aria-label={`Panel ${state} ${zoom}%`}
            src={frontPanel.src}
            alt=""
            width={frontPanel.width}
            height={frontPanel.height}
            defaultZoom={Number(zoom)}
            hotspots={[
              {
                id: 'power',
                label: `Power ${state}`,
                x: 10,
                y: 25,
                width: 10,
                height: 15,
                ...cellHotspot[state],
              },
            ]}
          />
        )}
      />
    </LabSection>
  </>,
);
