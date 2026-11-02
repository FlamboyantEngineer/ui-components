// Portal cases for a host that positions its own layer with the z-index in effect, read through
// useLayerZIndex under nested layerZIndex overrides.

import type { CSSProperties, ReactNode } from 'react';
import { Portal, PortalHost, useLayerZIndex } from '../../src/components/portal/portal.js';
import { LabSection } from './chrome/index.js';

// Lab-only presentation; the library draws none of it.
const frame: CSSProperties = {
  position: 'relative',
  padding: 8,
  border: '1px dashed currentColor',
  borderRadius: 6,
};
const card: CSSProperties = {
  boxSizing: 'border-box',
  position: 'absolute',
  width: 150,
  padding: '4px 8px',
  border: '1px solid currentColor',
  borderRadius: 6,
  background: 'Canvas',
  color: 'CanvasText',
};

/** The z-indexes in effect where it renders. */
function Readout({ level }: { level: string }) {
  const dropdown = useLayerZIndex('dropdown');
  const tooltip = useLayerZIndex('tooltip');
  return (
    <p data-lab-output={`layer-${level}`}>
      {level}: dropdown {dropdown}, tooltip {tooltip}
    </p>
  );
}

/**
 * The host's own panel, positioned by the host at the dropdown layer's z-index in effect, beside a
 * library portal on the tooltip layer in the same stage: whichever z-index is higher paints on top.
 * The stage's own host inherits the overrides of the hosts around it.
 */
function HostPanel({ level }: { level: string }) {
  const zIndex = useLayerZIndex('dropdown');
  return (
    <div style={{ position: 'relative', height: 64 }}>
      <PortalHost>
        <div data-lab-host-panel={level} style={{ ...card, left: 0, top: 0, zIndex }}>
          Host panel (z {zIndex})
        </div>
        <Portal layer="tooltip">
          <div data-lab-tooltip-card={level} style={{ ...card, left: 40, top: 20 }}>
            Tooltip portal
          </div>
        </Portal>
      </PortalHost>
    </div>
  );
}

function Level({ level, children }: { level: string; children?: ReactNode }) {
  return (
    <div style={frame} data-lab-level={level}>
      <Readout level={level} />
      <HostPanel level={level} />
      {children}
    </div>
  );
}

/** Defaults, then an outer host raising the tooltip layer, then an inner one raising the dropdown. */
function NestedOverrides() {
  return (
    <div data-lab-demo="layer-z-index">
      <Level level="default">
        <PortalHost layerZIndex={{ tooltip: 500 }}>
          <Level level="outer">
            <PortalHost layerZIndex={{ dropdown: 600 }}>
              <Level level="inner" />
            </PortalHost>
          </Level>
        </PortalHost>
      </Level>
    </div>
  );
}

export function PortalLayerSections() {
  return (
    <LabSection
      title="Layer z-index for a host's own layer"
      description="useLayerZIndex returns the z-index of a layer in effect where it is called. Each level draws a host-owned panel at the dropdown layer's z-index next to a library portal on the tooltip layer. By default the tooltip portal (150) covers the panel (130); the outer host raises the tooltip to 500; the inner host keeps that and raises the dropdown to 600, so its panel covers the tooltip. Portals in shadow roots, which need enableShadowRoots, are shown in the Combobox and Completion List labs."
    >
      <NestedOverrides />
      <p>
        Shadow-root hosts: <a href="combobox.html">Combobox</a>,{' '}
        <a href="completion-list.html">Completion List</a>.
      </p>
    </LabSection>
  );
}
