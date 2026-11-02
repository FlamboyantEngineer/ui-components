import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AppFrame,
  AppFrameContent,
  type AppFrameRegion,
} from '../../src/components/app-frame/app-frame.js';
import {
  AppFrameBand,
  AppFrameBandContent,
  type AppFrameBandSlot,
} from '../../src/components/app-frame/index.js';
import { Button } from '../../src/components/button/button.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection } from './chrome/index.js';

/** A frame that is the whole page of its document, with its own region names. */
function PageFrame() {
  return (
    <AppFrame
      labels={{
        main: 'Recipe editor',
        'start-panel': 'Outline',
        'end-panel': 'Inspector',
        'bottom-panel': 'Console',
      }}
      topBar={
        <AppFrameBand
          aria-label="Recipe controls"
          leading="Lemon tart"
          toolsLabel="Recipe tools"
          actionsLabel="Recipe actions"
          actions={<Button size="sm">Share</Button>}
        >
          <Button size="sm">Bold</Button>
        </AppFrameBand>
      }
      startPanel="Steps"
      endPanel="Oven at 180 degrees"
      bottomPanel="No problems"
      statusBar="Saved"
    >
      <h1>Lemon tart</h1>
      <p>Zest two lemons.</p>
    </AppFrame>
  );
}

/**
 * Renders the page frame into a same-origin frame's document, with this page's stylesheets, so its
 * landmarks are the frame document's own.
 */
function FramedPage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument) return;
    for (const link of document.querySelectorAll('link[rel="stylesheet"], style')) {
      frameDocument.head.append(link.cloneNode(true));
    }
    const root = createRoot(frameDocument.body);
    root.render(<PageFrame />);
    return () => root.unmount();
  }, []);
  return (
    <iframe
      ref={frameRef}
      title="Page-level frame"
      data-lab-demo="page-frame"
      style={{ width: 760, height: 360, border: '1px dotted currentColor' }}
    />
  );
}

const regionNames: Record<AppFrameRegion, string> = {
  'top-bar': 'Top bar',
  navigation: 'Navigation',
  'start-panel': 'Start panel',
  'end-panel': 'End panel',
  'bottom-panel': 'Bottom panel',
  'status-bar': 'Status bar',
};
const slotNames: Record<AppFrameBandSlot, string> = {
  leading: 'Band leading',
  status: 'Band status',
  tools: 'Band tools',
  actions: 'Band actions',
};

/** A page deep in an embedded frame that fills whichever regions and band slots are switched on. */
function ProjectionSwitches() {
  const [regions, setRegions] = useState<ReadonlySet<string>>(new Set());
  const toggle = (name: string) => (isOn: boolean) =>
    setRegions((current) => {
      const next = new Set(current);
      if (isOn) next.add(name);
      else next.delete(name);
      return next;
    });
  const names = { ...regionNames, ...slotNames };
  return (
    <div data-lab-demo="projection">
      <div role="group" aria-label="Fill from the page">
        {Object.entries(names).map(([name, label]) => (
          <Switch key={name} isSelected={regions.has(name)} onChange={toggle(name)}>
            {label}
          </Switch>
        ))}
      </div>
      <div style={{ width: 760, height: 320 }}>
        <AppFrame
          isEmbedded
          label="Projection frame"
          topBar={
            <AppFrameBand
              aria-label="Projection band"
              leading="Own title"
              status="Own status"
              actions="Own actions"
              toolsLabel="Own tools"
            >
              Own tools
            </AppFrameBand>
          }
          navigation="Own navigation"
          startPanel="Own start panel"
          endPanel="Own end panel"
          bottomPanel="Own bottom panel"
          statusBar="Own status bar"
        >
          <p>Main content</p>
          {(Object.keys(regionNames) as AppFrameRegion[]).map((region) =>
            regions.has(region) && region !== 'top-bar' ? (
              <AppFrameContent key={region} region={region}>
                {`Page ${regionNames[region].toLowerCase()}`}
              </AppFrameContent>
            ) : null,
          )}
          {regions.has('top-bar') ? (
            <AppFrameContent region="top-bar">Page top bar</AppFrameContent>
          ) : null}
          {(Object.keys(slotNames) as AppFrameBandSlot[]).map((slot) =>
            regions.has(slot) ? (
              <AppFrameBandContent key={slot} slot={slot}>
                {`Page ${slotNames[slot].toLowerCase()}`}
              </AppFrameBandContent>
            ) : null,
          )}
        </AppFrame>
      </div>
    </div>
  );
}

export function AppFramePageCases() {
  return (
    <>
      <LabSection
        title="Page-level frame"
        description="A frame that is its document's page, shown in a frame of its own: the top bar is the banner, the main region and each panel are landmarks named by labels (Recipe editor, Outline, Inspector, Console) and the status bar is the content information. The band names its tools and actions with toolsLabel and actionsLabel."
      >
        <FramedPage />
      </LabSection>
      <LabSection
        title="Filling every region and band slot"
        description="Each switch mounts content deep in the frame that fills that region or band slot in place of the frame's own; switching it off unmounts it and the frame's own content returns. Filling the top bar replaces the whole band, so the band slots show again once it is off."
      >
        <ProjectionSwitches />
      </LabSection>
    </>
  );
}
