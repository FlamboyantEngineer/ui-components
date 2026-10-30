import {
  CalendarGlyph,
  EditGlyph,
  FolderGlyph,
  InfoGlyph,
  LockGlyph,
  UsersGlyph,
  WarningGlyph,
} from '../../src/core/glyphs.js';
import { useState } from 'react';
import {
  NavigationRail,
  type NavigationRailProps,
} from '../../src/components/navigation-rail/navigation-rail.js';
import {
  NavigationRailGroup,
  NavigationRailItem,
  NavigationRailSection,
} from '../../src/components/navigation-rail/navigation-rail-items.js';

/** The pages of the sample kitchen workspace, by key. */
export const kitchenPages = {
  menu: 'Weekly menu',
  pantry: 'Pantry',
  inbox: 'Inbox',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  cakes: 'Cakes',
  tarts: 'Tarts',
  team: 'Team',
  profile: 'Profile',
  alerts: 'Alerts',
} as const;

export type KitchenPage = keyof typeof kitchenPages;

interface KitchenRailProps extends Omit<NavigationRailProps, 'children'> {
  current: KitchenPage;
  onNavigate: (page: KitchenPage) => void;
}

/** The sample rail: pinned pages, a workspace with counts and nested groups, and settings. */
export function KitchenRail({ current, onNavigate, ...rest }: KitchenRailProps) {
  const item = (page: KitchenPage) => ({
    label: kitchenPages[page],
    href: `#${page}`,
    isCurrent: current === page,
    onPress: () => onNavigate(page),
  });
  return (
    <NavigationRail {...rest}>
      <NavigationRailSection title="Pinned">
        <NavigationRailItem {...item('menu')} icon={CalendarGlyph} />
        <NavigationRailItem {...item('pantry')} icon={FolderGlyph} />
      </NavigationRailSection>
      <NavigationRailSection title="Workspace">
        <NavigationRailItem {...item('inbox')} icon={InfoGlyph} count={4} countLabel="4 unread" />
        <NavigationRailGroup label="Recipes" icon={EditGlyph}>
          <NavigationRailItem {...item('breakfast')} />
          <NavigationRailItem {...item('lunch')} />
          <NavigationRailGroup label="Desserts">
            <NavigationRailItem {...item('cakes')} />
            <NavigationRailItem {...item('tarts')} count={120} countLabel="120 recipes" />
          </NavigationRailGroup>
        </NavigationRailGroup>
        <NavigationRailItem {...item('team')} icon={UsersGlyph} />
      </NavigationRailSection>
      <NavigationRailSection title="Settings">
        <NavigationRailItem {...item('profile')} icon={LockGlyph} />
        <NavigationRailItem {...item('alerts')} icon={WarningGlyph} count={0} />
      </NavigationRailSection>
    </NavigationRail>
  );
}

/** A sample rail that tracks its own current page. */
export function NavigatingKitchenRail(props: Omit<KitchenRailProps, 'current' | 'onNavigate'>) {
  const [current, setCurrent] = useState<KitchenPage>('inbox');
  return <KitchenRail {...props} current={current} onNavigate={setCurrent} />;
}
