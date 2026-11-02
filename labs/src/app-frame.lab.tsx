import {
  CopyGlyph,
  DeleteGlyph,
  EditGlyph,
  FilterGlyph,
  RedoGlyph,
  RefreshGlyph,
  SearchGlyph,
  UndoGlyph,
  UsersGlyph,
} from '../../src/core/glyphs.js';
import { useState, type ReactNode } from 'react';
import { AppFrame, AppFrameContent } from '../../src/components/app-frame/app-frame.js';
import { AppFrameBand, AppFrameBandContent } from '../../src/components/app-frame/index.js';
import { Button } from '../../src/components/button/button.js';
import { ToolbarRowGroup } from '../../src/components/layout/index.js';
import { NavigationRail } from '../../src/components/navigation-rail/navigation-rail.js';
import {
  NavigationRailItem,
  NavigationRailSection,
} from '../../src/components/navigation-rail/index.js';
import { SaveStatus } from '../../src/components/save-status/save-status.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { AppFramePageCases } from './app-frame-page-cases.js';
import { KitchenRail, kitchenPages, type KitchenPage } from './navigation-rail-cases.js';

const panelSets = ['none', 'start', 'end', 'bottom', 'all'] as const;

function Tools() {
  return (
    <>
      <ToolbarRowGroup aria-label="History">
        <Button icon={UndoGlyph} label="Undo" size="sm" />
        <Button icon={RedoGlyph} label="Redo" size="sm" />
      </ToolbarRowGroup>
      <ToolbarRowGroup aria-label="Edit" attached>
        <Button icon={EditGlyph} label="Edit" size="sm" />
        <Button icon={CopyGlyph} label="Copy" size="sm" />
        <Button icon={DeleteGlyph} label="Delete" size="sm" />
      </ToolbarRowGroup>
      <ToolbarRowGroup aria-label="View">
        <Button icon={SearchGlyph} label="Find" size="sm" />
        <Button icon={FilterGlyph} label="Filter" size="sm" />
        <Button icon={RefreshGlyph} label="Refresh" size="sm" />
      </ToolbarRowGroup>
    </>
  );
}

function RegionsCell({ label, rail, panels }: { label: string; rail: boolean; panels: string }) {
  const has = (panel: string) => panels === 'all' || panels === panel;
  return (
    <div style={{ width: 760, height: 300 }}>
      <AppFrame
        isEmbedded
        label={label}
        topBar={<AppFrameBand aria-label={`${label} controls`} leading="Notes" actions="Share" />}
        navigation={
          rail ? (
            <NavigationRail aria-label={`${label} navigation`} defaultCollapsed>
              <NavigationRailSection>
                <NavigationRailItem label="Notes" href="#notes" icon={EditGlyph} isCurrent />
                <NavigationRailItem label="People" href="#people" icon={UsersGlyph} />
              </NavigationRailSection>
            </NavigationRail>
          ) : null
        }
        startPanel={has('start') ? 'Outline' : null}
        endPanel={has('end') ? 'Details' : null}
        bottomPanel={has('bottom') ? 'Console' : null}
        statusBar="Ready"
      >
        Main content
      </AppFrame>
    </div>
  );
}

function PantryPage() {
  const [jars, setJars] = useState(3);
  return (
    <>
      <h2>Pantry</h2>
      <p data-lab-jars="">{jars} jars on the shelf.</p>
      <AppFrameBandContent slot="leading">Pantry</AppFrameBandContent>
      <AppFrameBandContent slot="status">
        <SaveStatus phase={jars > 3 ? 'dirty' : 'idle'} />
      </AppFrameBandContent>
      <AppFrameBandContent slot="actions">
        <Button size="sm" variant="primary" onPress={() => setJars(jars + 1)}>
          Add jar
        </Button>
      </AppFrameBandContent>
      <AppFrameContent region="end-panel">
        <h3>Shelf</h3>
        <p>
          {jars} jars: honey, jam{jars > 3 ? ` and ${jars - 2} more` : ' and pickles'}.
        </p>
      </AppFrameContent>
    </>
  );
}

function PageContent({ page }: { page: KitchenPage }): ReactNode {
  if (page === 'pantry') return <PantryPage />;
  return (
    <>
      <h2>{kitchenPages[page]}</h2>
      <p>Open the Pantry: its page fills the band and the end panel while it shows.</p>
    </>
  );
}

/** A full workspace: the band, the rail, an end panel and a status bar around the current page. */
function KitchenWorkspace() {
  const [page, setPage] = useState<KitchenPage>('inbox');
  return (
    <div style={{ height: 560 }} data-lab-demo="workspace">
      <AppFrame
        isEmbedded
        label="Kitchen workspace"
        topBar={
          <AppFrameBand
            aria-label="Kitchen controls"
            leading="Kitchen"
            status={<SaveStatus phase="saved" />}
            actions={<Button size="sm">Share</Button>}
          >
            <Tools />
          </AppFrameBand>
        }
        navigation={
          <KitchenRail aria-label="Kitchen navigation" current={page} onNavigate={setPage} />
        }
        endPanel={<p>Pick a page to see its details.</p>}
        statusBar={<span>Synced</span>}
      >
        <PageContent page={page} />
      </AppFrame>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Regions"
      description="Embedded frames with and without navigation and each panel; empty regions render nothing. On a page, the regions are landmarks."
    >
      <StateMatrix
        axes={{ navigation: ['none', 'rail'], panels: panelSets }}
        render={({ navigation, panels }) => (
          <RegionsCell
            label={`Frame, ${navigation} navigation, ${panels} panels`}
            rail={navigation === 'rail'}
            panels={panels}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Band"
      description="Leading title, save status, tools and actions; in a narrow band the tools scroll instead of wrapping."
    >
      <StateMatrix
        axes={{ width: ['wide', 'narrow'] }}
        render={({ width }) => (
          <div style={{ width: width === 'wide' ? 760 : 420 }}>
            <AppFrameBand
              aria-label={`Band, ${width}`}
              leading="Lemon tart"
              status={<SaveStatus phase="saved" />}
              actions={<Button size="sm">Share</Button>}
            >
              <Tools />
            </AppFrameBand>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Workspace"
      description="Tab once to reveal the skip link, which moves focus to the main content. The Pantry page fills the band's title, status and actions and the end panel from deep in the frame."
    >
      <KitchenWorkspace />
    </LabSection>
    <AppFramePageCases />
  </>,
);
