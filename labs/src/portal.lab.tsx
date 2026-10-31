import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Menu, MenuPopover, MenuTrigger } from '../../src/components/menu/menu.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
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

/** Overlays built on React Aria and on `Portal` alike render into the host's container. */
function HostedOverlays() {
  return (
    <div data-lab-demo="hosted-overlays">
      <PortalHost>
        <MenuTrigger>
          <Button>Hosted menu</Button>
          <MenuPopover>
            <Menu
              aria-label="Hosted menu"
              items={[
                { id: 'copy', label: 'Copy' },
                { id: 'paste', label: 'Paste' },
              ]}
            />
          </MenuPopover>
        </MenuTrigger>{' '}
        <ModalTrigger>
          <Button>Hosted dialog</Button>
          <Modal title="Hosted dialog" size="sm" isDismissable>
            <p>This dialog renders in the portal host.</p>
          </Modal>
        </ModalTrigger>
      </PortalHost>
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
    <ModalTrigger>
      <Button>Choose a colour</Button>
      <Modal
        title="Colour"
        size="sm"
        isDismissable
        cancelAction={null}
        primaryAction={{ label: 'Done', onPress: (close) => close() }}
      >
        <p data-lab-chosen="">Chosen: {chosen}</p>
        <button ref={toggle} type="button" onClick={() => setListOpen((value) => !value)}>
          {listOpen ? 'Hide colours' : 'Show colours'}
        </button>
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
      </Modal>
    </ModalTrigger>
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

type EdgeCase =
  | 'checked radios'
  | 'unchecked radios'
  | 'empty'
  | 'two portals'
  | 'nested'
  | 'container before'
  | 'document body';

/** Kept order with focus guards, or the same content in place, as the reference order. */
type EdgeMode = 'kept' | 'in place';

function EdgePortal({ id, mode, children }: { id: string; mode: EdgeMode; children?: ReactNode }) {
  return (
    <Portal preserveTabOrder={mode === 'kept'} inPlace={mode === 'in place'} data-lab-portal={id}>
      {children}
    </Portal>
  );
}

function EdgeContent({ id, mode, edge }: { id: string; mode: EdgeMode; edge: EdgeCase }) {
  switch (edge) {
    case 'checked radios':
    case 'unchecked radios':
      return (
        <EdgePortal id={id} mode={mode}>
          <input type="radio" name={id} aria-label="Radio A" />
          <input
            type="radio"
            name={id}
            aria-label="Radio B"
            defaultChecked={edge === 'checked radios'}
          />
        </EdgePortal>
      );
    case 'two portals':
      return (
        <>
          <EdgePortal id={`${id} one`} mode={mode}>
            <button type="button">First tool</button>
          </EdgePortal>
          <EdgePortal id={`${id} two`} mode={mode}>
            <button type="button">Second tool</button>
          </EdgePortal>
        </>
      );
    case 'nested':
      return (
        <EdgePortal id={id} mode={mode}>
          <button type="button">Outer tool</button>
          <EdgePortal id={`${id} inner`} mode={mode}>
            <button type="button">Inner tool</button>
          </EdgePortal>
          <button type="button">Outer end</button>
        </EdgePortal>
      );
    default:
      return <EdgePortal id={id} mode={mode} />;
  }
}

/**
 * A control before and after a portal, which a browser test isolates as the whole page to compare
 * the kept order at the document's ends with the same content in place.
 */
function EdgeCaseDemo({ edge, mode }: { edge: EdgeCase; mode: EdgeMode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const id = `${edge} ${mode}`;
  const content = (
    <>
      <button type="button">Before</button> <EdgeContent id={id} mode={mode} edge={edge} />{' '}
      <button type="button">After</button>
    </>
  );
  const demo = (body: ReactNode) => (
    <div data-lab-demo={id} style={{ position: 'relative', minHeight: 40 }}>
      {body}
    </div>
  );
  if (edge === 'document body') return demo(content);
  if (edge === 'container before') {
    return demo(
      <>
        <div ref={setContainer} />
        <PortalContainerProvider container={container}>{content}</PortalContainerProvider>
      </>,
    );
  }
  return demo(<PortalHost>{content}</PortalHost>);
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
      title="Tab order at the edges"
      description="Each case with focus guards (kept) and in place. Radio groups take one stop, their checked radio; at the end of the page focus leaves the document and comes back to its first control, as it would in place. The browser test makes each case the whole page."
    >
      <StateMatrix
        axes={{
          edge: [
            'checked radios',
            'unchecked radios',
            'empty',
            'two portals',
            'nested',
            'container before',
            'document body',
          ],
          mode: ['kept', 'in place'],
        }}
        render={({ edge, mode }) => <EdgeCaseDemo edge={edge} mode={mode} />}
      />
    </LabSection>
    <LabSection
      title="Overlays in a host"
      description="A menu and a dialog, React Aria overlays both, open into the portal host's container like every Portal below it."
    >
      <HostedOverlays />
    </LabSection>
    <LabSection
      title="Document body"
      description="Without a provider, a portal renders at the end of the document body."
    >
      <BodyNotice />
    </LabSection>
    <LabSection
      title="With a modal"
      description="A dropdown-layer portal opened from a modal stays usable: choosing a colour keeps the dialog open."
    >
      <ColourDialog />
    </LabSection>
  </>,
);
