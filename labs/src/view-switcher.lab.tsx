import {
  ClockGlyph,
  FilterGlyph,
  FolderGlyph,
  StarGlyph,
  UsersGlyph,
} from '../../src/core/glyphs.js';
import { useState } from 'react';
import {
  DisplayOptions,
  type DisplayOptionsValue,
} from '../../src/components/display-options/display-options.js';
import {
  ViewSwitcher,
  type ViewSwitcherView,
} from '../../src/components/view-switcher/view-switcher.js';
import type { Key } from '../../src/core/props.js';
import { requireDefined } from './require-defined.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { RecipeTable, recipeProperties, recipes } from './recipe-samples.js';

const noop = () => undefined;

const matrixViews: ViewSwitcherView[] = [
  { id: 'all', label: 'All recipes', icon: FolderGlyph },
  { id: 'quick', label: 'Quick meals', icon: ClockGlyph },
  { id: 'mine', label: 'My recipes', icon: UsersGlyph },
];

interface SavedView extends ViewSwitcherView {
  settings: DisplayOptionsValue;
}

const startingViews: SavedView[] = [
  {
    id: 'all',
    label: 'All recipes',
    icon: FolderGlyph,
    settings: {
      groupBy: null,
      sort: { column: 'title', direction: 'ascending' },
      properties: ['title', 'cuisine', 'minutes'],
      density: 'default',
    },
  },
  {
    id: 'cuisine',
    label: 'By cuisine',
    icon: FilterGlyph,
    settings: {
      groupBy: 'cuisine',
      sort: { column: 'minutes', direction: 'ascending' },
      properties: ['title', 'minutes', 'author'],
      density: 'compact',
    },
  },
];

const isSame = (a: DisplayOptionsValue, b: DisplayOptionsValue) =>
  JSON.stringify(a) === JSON.stringify(b);

/** Saved views of a recipe table: change the display, then save, save as, reset or manage views. */
function RecipeViews({ variant }: { variant: 'tabs' | 'menu' }) {
  const [views, setViews] = useState(startingViews);
  const [selectedKey, setSelectedKey] = useState<Key>('all');
  const [defaultViewKey, setDefaultViewKey] = useState<Key>('all');
  const [drafts, setDrafts] = useState<Record<string, DisplayOptionsValue>>({});
  const selected = views.find((view) => view.id === selectedKey) ?? requireDefined(views[0]);
  const current = drafts[String(selected.id)] ?? selected.settings;
  const setCurrent = (settings: DisplayOptionsValue) =>
    setDrafts((all) => ({ ...all, [String(selected.id)]: settings }));
  const dropDraft = (key: Key) => setDrafts(({ [String(key)]: _dropped, ...rest }) => rest);
  // The menu of views is named by the heading above it; the tabs by their own label.
  const naming =
    variant === 'menu'
      ? { 'aria-labelledby': 'menu-views-heading' }
      : { 'aria-label': 'Recipe views' };
  return (
    <div data-lab-demo={`views-${variant}`}>
      {variant === 'menu' ? <h3 id="menu-views-heading">Recipe views</h3> : null}
      <ViewSwitcher
        {...naming}
        variant={variant}
        views={views}
        selectedKey={selected.id}
        onSelectionChange={setSelectedKey}
        defaultViewKey={defaultViewKey}
        onDefaultViewChange={setDefaultViewKey}
        isDirty={!isSame(current, selected.settings)}
        onSave={(key) => {
          setViews((all) =>
            all.map((view) => (view.id === key ? { ...view, settings: current } : view)),
          );
          dropDraft(key);
        }}
        onReset={dropDraft}
        onSaveAs={(label) => {
          const id = `view-${views.length + 1}`;
          setViews((all) => [...all, { id, label, icon: StarGlyph, settings: current }]);
          dropDraft(selected.id);
          setSelectedKey(id);
        }}
        onRename={(key, label) =>
          setViews((all) => all.map((view) => (view.id === key ? { ...view, label } : view)))
        }
        onDelete={(key) => {
          const rest = views.filter((view) => view.id !== key);
          setViews(rest);
          if (key === selected.id) setSelectedKey(requireDefined(rest[0]).id);
        }}
      >
        <DisplayOptions
          properties={recipeProperties}
          value={current}
          onChange={setCurrent}
          densities={['compact', 'default']}
        />
        <RecipeTable rows={recipes} value={current} caption={`Recipes, ${selected.label}`} />
      </ViewSwitcher>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Views as tabs and in a menu, saved or modified; the first view is the default one."
    >
      <StateMatrix
        axes={{ state: ['saved', 'modified'], variant: ['tabs', 'menu'] }}
        render={({ state, variant }) => (
          <ViewSwitcher
            aria-label={`Views, ${variant}, ${state}`}
            variant={variant}
            views={matrixViews}
            defaultViewKey="all"
            isDirty={state === 'modified'}
            onSave={noop}
            onSaveAs={noop}
            onReset={noop}
            onRename={noop}
            onDelete={noop}
            onDefaultViewChange={noop}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Saved views of a recipe table"
      description="Change the display options to modify a view, then save it, save it as a new view or reset it; rename, delete or make a view the default from its actions or its tab's menu (Shift+F10)."
    >
      <RecipeViews variant="tabs" />
    </LabSection>
    <LabSection
      title="In a menu"
      description="The same views in a menu, for many views or little room; the heading above names the menu."
    >
      <RecipeViews variant="menu" />
    </LabSection>
  </>,
);
