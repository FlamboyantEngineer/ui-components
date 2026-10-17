import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { overlayLayers } from '../../src/components/portal/layers.js';
import { Portal, PortalContainerProvider, PortalHost } from '../../src/components/portal/portal.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

// Lab-only presentation for the content placed in portals; the library draws none of it.
const card: CSSProperties = {
  boxSizing: 'border-box',
  width: 120,
  height: 60,
  padding: '4px 8px',
  border: '1px solid currentColor',
  borderRadius: 6,
  background: 'Canvas',
  color: 'CanvasText',
};

const colours = ['Teal', 'Plum', 'Amber'] as const;

const topLayerOf = { default: undefined, on: true, off: false } as const;

function Stage({ children, height = 72 }: { children: ReactNode; height?: number }) {
  return (
    <div data-lab-stage="" style={{ position: 'relative', width: 240, height }}>
      <PortalHost>{children}</PortalHost>
    </div>
  );
}

function Stack({ order }: { order: 'lowest first' | 'highest first' }) {
  const layers = order === 'lowest first' ? [...overlayLayers] : [...overlayLayers].reverse();
  return (
    <Stage height={110}>
      {layers.map((layer) => {
        const index = overlayLayers.indexOf(layer);
        return (
          <Portal key={layer} layer={layer}>
            <div
              data-lab-card={layer}
              style={{ ...card, position: 'absolute', left: index * 8, top: index * 6 }}
            >
              {layer}
            </div>
          </Portal>
        );
      })}
    </Stage>
  );
}

/** A host whose backdrop layer is raised above the toast layer. */
function RaisedBackdrop() {
  return (
    <div data-lab-stage="" style={{ position: 'relative', width: 240, height: 80 }}>
      <PortalHost layerZIndex={{ backdrop: 170 }}>
        <Portal layer="toast">
          <div data-lab-card="toast" style={{ ...card, position: 'absolute' }}>
            toast
          </div>
        </Portal>
        <Portal layer="backdrop">
          <div
            data-lab-card="backdrop"
            style={{ ...card, position: 'absolute', left: 24, top: 16 }}
          >
            backdrop, raised
          </div>
        </Portal>
      </PortalHost>
    </div>
  );
}

/** Portals rendered into a container the caller chooses, which mounts after them. */
function ChosenContainer() {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  return (
    <div data-lab-stage="" style={{ position: 'relative', width: 240, height: 72 }}>
      <PortalContainerProvider container={target}>
        <Portal layer="tooltip">
          <div style={card}>In the chosen container</div>
        </Portal>
      </PortalContainerProvider>
      <div ref={setTarget} data-lab-target="" />
    </div>
  );
}

function BodyNotice() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={open}>
        Show notice
      </button>
      {open ? (
        <Portal layer="toast" data-lab-notice="">
          <div
            role="status"
            style={{
              ...card,
              position: 'fixed',
              right: 16,
              bottom: 16,
              width: 180,
              height: 'auto',
            }}
          >
            <p style={{ margin: '0 0 8px' }}>Report.pdf saved</p>
            <button type="button" onClick={() => setOpen(false)}>
              Dismiss
            </button>
          </div>
        </Portal>
      ) : null}
    </>
  );
}

function ColourDialog() {
  const [listOpen, setListOpen] = useState(false);
  const [chosen, setChosen] = useState<string>('none');
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <DialogTrigger>
      <Button>Choose a colour</Button>
      <ModalOverlay
        isDismissable
        style={{
          position: 'fixed',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          background: 'rgb(0 0 0 / 0.3)',
        }}
      >
        <Modal style={{ ...card, width: 260, height: 'auto', padding: 16 }}>
          <Dialog>
            <Heading slot="title" style={{ margin: '0 0 8px', fontSize: 16 }}>
              Colour
            </Heading>
            <p data-lab-chosen="">Chosen: {chosen}</p>
            <button ref={toggle} type="button" onClick={() => setListOpen((value) => !value)}>
              {listOpen ? 'Hide colours' : 'Show colours'}
            </button>{' '}
            <Button slot="close">Done</Button>
            {listOpen ? (
              <Portal layer="dropdown" data-lab-colours="">
                <ul
                  aria-label="Colours"
                  style={{
                    ...card,
                    position: 'fixed',
                    left: 'calc(50% - 60px)',
                    top: 'calc(50% + 90px)',
                    height: 'auto',
                    margin: 0,
                    listStyle: 'none',
                  }}
                >
                  {colours.map((colour) => (
                    <li key={colour}>
                      <button
                        type="button"
                        onClick={() => {
                          setChosen(colour);
                          setListOpen(false);
                          toggle.current?.focus();
                        }}
                      >
                        {colour}
                      </button>
                    </li>
                  ))}
                </ul>
              </Portal>
            ) : null}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

function TabOrderDemo({ preserveTabOrder }: { preserveTabOrder: boolean }) {
  const [open, setOpen] = useState(false);
  const name = preserveTabOrder ? 'Kept order' : 'Document order';
  return (
    <div data-lab-demo={preserveTabOrder ? 'tab-order' : 'document-order'}>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        {open ? `Hide ${name} tools` : `Show ${name} tools`}
      </button>{' '}
      {open ? (
        <Portal layer="dropdown" preserveTabOrder={preserveTabOrder}>
          <div
            role="group"
            aria-label={`${name} tools`}
            style={{
              ...card,
              position: 'fixed',
              left: preserveTabOrder ? 16 : 232,
              bottom: 16,
              width: 200,
              height: 'auto',
            }}
          >
            <button type="button">Cut</button> <button type="button">Copy</button>
          </div>
        </Portal>
      ) : null}
      <button type="button">{name} next</button>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Layers"
      description="One portal per layer, each in a portal host scoped to its cell. The wrapper carries data-layer and its z-index."
    >
      <StateMatrix
        axes={{ layer: overlayLayers }}
        render={({ layer }) => (
          <Stage>
            <Portal layer={layer}>
              <div style={card}>{layer}</div>
            </Portal>
          </Stage>
        )}
      />
    </LabSection>
    <LabSection
      title="Stacking"
      description="Seven overlapping portals. The toast stays on top whichever order they mount in."
    >
      <StateMatrix
        axes={{ order: ['lowest first', 'highest first'] }}
        render={({ order }) => <Stack order={order} />}
      />
    </LabSection>
    <LabSection
      title="Containers and z-indexes"
      description="A provider's chosen container, and a host that raises one layer's z-index above the others."
    >
      <StateMatrix
        axes={{ override: ['container', 'layer z-index'] }}
        render={({ override }) =>
          override === 'container' ? <ChosenContainer /> : <RaisedBackdrop />
        }
      />
    </LabSection>
    <LabSection
      title="Top layer"
      description="Layers above modal are React Aria top layers by default; topLayer turns the mark on or off for any layer."
    >
      <StateMatrix
        axes={{ topLayer: ['default', 'on', 'off'], layer: ['modal', 'toast'] }}
        render={({ topLayer, layer }) => (
          <Stage>
            <Portal layer={layer} topLayer={topLayerOf[topLayer]}>
              <div style={card}>
                {layer}, {topLayer}
              </div>
            </Portal>
          </Stage>
        )}
      />
    </LabSection>
    <LabSection
      title="In place"
      description="inPlace keeps the wrapper where the portal is declared, with its layer, z-index and top-layer mark."
    >
      <div
        data-lab-stage=""
        data-lab-in-place=""
        style={{ position: 'relative', width: 240, height: 72 }}
      >
        <Portal layer="tooltip" inPlace>
          <div style={card}>tooltip, in place</div>
        </Portal>
      </div>
    </LabSection>
    <LabSection
      title="Tab order"
      description="Tools in a portal at the end of the document. With preserveTabOrder, Tab reaches them right after their toggle and leaves them to the button after it; without it, they come last."
    >
      <TabOrderDemo preserveTabOrder />
      <TabOrderDemo preserveTabOrder={false} />
    </LabSection>
    <LabSection
      title="Document body"
      description="Without a provider, a portal renders at the end of the document body."
    >
      <BodyNotice />
    </LabSection>
    <LabSection
      title="With a React Aria modal"
      description="A dropdown-layer portal opened from a React Aria modal stays usable: choosing a colour keeps the dialog open."
    >
      <ColourDialog />
    </LabSection>
  </>,
);
