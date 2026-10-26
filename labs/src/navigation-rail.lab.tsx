import { useState } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import { NavigationRail } from '../../src/components/navigation-rail/navigation-rail.js';
import {
  NavigationRailItem,
  NavigationRailSection,
} from '../../src/components/navigation-rail/navigation-rail-items.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  KitchenRail,
  NavigatingKitchenRail,
  kitchenPages,
  type KitchenPage,
} from './navigation-rail-cases.js';

/**
 * A rail with a header and a footer whose collapsed state and width persist across reloads, beside
 * the page it navigates to.
 */
function KitchenWorkspace() {
  const [current, setCurrent] = useState<KitchenPage>('inbox');
  const [width, setWidth] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', height: 520 }} data-lab-demo="workspace">
      <KitchenRail
        aria-label="Kitchen navigation"
        current={current}
        onNavigate={setCurrent}
        header={<span>Kitchen</span>}
        footer={<Avatar name="Maria Santos" size="sm" />}
        isResizable
        persistKey="lab-kitchen-rail"
        onWidthChange={setWidth}
      />
      <div style={{ padding: 16 }}>
        <p data-lab-page="">Showing {kitchenPages[current]}</p>
        <p data-lab-width="">{width === null ? 'Not resized yet' : `Resized to ${width}px`}</p>
      </div>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Expanded and collapsed rails, with a fixed width or a resize handle. Collapsed, items show their icon (or initials) and the label in a tooltip; groups open the rail."
    >
      <StateMatrix
        axes={{ rail: ['expanded', 'collapsed'], width: ['fixed', 'resizable'] }}
        render={({ rail, width }) => (
          <div style={{ display: 'flex', height: 480 }}>
            <NavigatingKitchenRail
              aria-label={`Navigation, ${rail}, ${width}`}
              defaultCollapsed={rail === 'collapsed'}
              isResizable={width === 'resizable'}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Items"
      description="Icons, initials for an item without one, counts capped at 99+, and the current page."
    >
      <StateMatrix
        axes={{ rail: ['expanded', 'collapsed'] }}
        render={({ rail }) => (
          <div style={{ display: 'flex', height: 260 }}>
            <NavigationRail aria-label={`Items, ${rail}`} defaultCollapsed={rail === 'collapsed'}>
              <NavigationRailSection title="Lists">
                <NavigationRailItem label="Groceries" href="#groceries" icon="folder" isCurrent />
                <NavigationRailItem label="Shared lists" href="#shared" icon="users" count={7} />
                <NavigationRailItem label="Market days" href="#market" count={250} />
              </NavigationRailSection>
            </NavigationRail>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Workspace"
      description="Press items to move the current page; groups open when the current page moves inside. Collapse the rail or drag its edge, then reload: both persist. Up and Down move between entries."
    >
      <KitchenWorkspace />
    </LabSection>
  </>,
);
