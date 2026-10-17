import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { overlayLayers } from '../../src/components/portal/layers.js';
import { Portal, PortalHost } from '../../src/components/portal/portal.js';
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

const colours = ['Teal', 'Plum', 'Amber'] as const;

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
