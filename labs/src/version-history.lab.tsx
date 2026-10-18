import { useState } from 'react';
import { ChangeList, type ChangeListChange } from '../../src/components/change-list/change-list.js';
import {
  VersionHistory,
  type VersionHistoryVersion,
} from '../../src/components/version-history/version-history.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

/** A fixed clock, so every time in the matrices reads the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', src: samplePicture, colorKey: 'jon' };
const lena = { name: 'Lena Ortiz', colorKey: 'lena' };

const versions: VersionHistoryVersion[] = [
  { id: 'v6', time: '2026-04-20T10:24:00', person: maria },
  {
    id: 'v5',
    label: 'Ready for review',
    time: '2026-04-20T09:10:00',
    person: jon,
    summary: 'Added the cooling step',
  },
  { id: 'v4', time: '2026-04-19T16:42:00', person: jon },
  { id: 'v3', time: '2026-04-19T11:05:00', person: lena },
  { id: 'v2', label: 'First draft', time: '2026-04-14T15:00:00', person: maria },
  { id: 'v1', time: '2026-04-14T14:20:00', person: maria, isDisabled: true },
];

type MatrixState = 'versions' | 'two selected' | 'loading more' | 'loading' | 'error' | 'empty';

function stateProps(state: MatrixState) {
  if (state === 'two selected') return { versions, defaultSelectedKeys: ['v5', 'v2'] };
  if (state === 'loading more') return { versions, isLoading: true, onLoadMore: () => {} };
  if (state === 'loading') return { versions: [], isLoading: true };
  if (state === 'error') {
    return { versions, error: 'The versions could not be loaded.', onRetry: () => {} };
  }
  if (state === 'empty') return { versions: [] };
  return { versions };
}

interface Recipe {
  title: string;
  method: string;
  tags: string[];
}

const firstRecipe: Recipe = {
  title: 'Rye loaf',
  method: 'Mix the flours, add the starter and water, and rest for an hour.',
  tags: ['bread', 'rye'],
};

/** A moment this many minutes before the real clock, so the demo's times read relative to now. */
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

interface SavedVersion extends VersionHistoryVersion {
  recipe: Recipe;
}

const startingVersions: SavedVersion[] = [
  {
    id: 3,
    time: minutesAgo(50),
    person: jon,
    recipe: {
      title: 'Seeded rye loaf',
      method: 'Mix the flours and seeds, add the starter and water, and rest overnight.',
      tags: ['bread', 'rye', 'seeds'],
    },
  },
  {
    id: 2,
    label: 'Tested once',
    time: minutesAgo(60 * 40),
    person: lena,
    recipe: { ...firstRecipe, method: firstRecipe.method.replace('an hour', 'two hours') },
  },
  { id: 1, label: 'Original', time: minutesAgo(60 * 24 * 5), person: maria, recipe: firstRecipe },
];

function compareRecipes(before: Recipe, after: Recipe): ChangeListChange[] {
  const changes: ChangeListChange[] = [
    { id: 'title', label: 'Title', before: before.title, after: after.title },
    { id: 'method', label: 'Method', type: 'text', before: before.method, after: after.method },
    { id: 'tags', label: 'Tags', type: 'list', before: before.tags, after: after.tags },
  ];
  return changes.filter((change) => String(change.before) !== String(change.after));
}

/** What the lab shows beside the history: the viewed version, or a comparison. */
function Preview({ saved, view }: { saved: SavedVersion[]; view: Key[] }) {
  const find = (key: Key | undefined) => saved.find((version) => version.id === key);
  if (view.length === 2) {
    const [older, newer] = [find(view[0]), find(view[1])];
    if (!older || !newer) return null;
    return (
      <ChangeList
        aria-label="Comparison"
        changes={compareRecipes(older.recipe, newer.recipe)}
        variant="detailed"
      />
    );
  }
  const shown = find(view[0]) ?? saved[0]!;
  return (
    <p data-lab-output="viewed">
      <strong>{shown.recipe.title}</strong>: {shown.recipe.method}
    </p>
  );
}

/** A recipe's history: view, compare, restore and rename versions. */
function RecipeHistory() {
  const [saved, setSaved] = useState(startingVersions);
  const [selected, setSelected] = useState<Set<Key>>(new Set());
  const [compared, setCompared] = useState<Key[] | null>(null);
  const current = saved[0]!;
  const restore = (key: Key) =>
    new Promise<void>((resolve) => {
      window.setTimeout(() => {
        const source = saved.find((version) => version.id === key)!;
        const id = Math.max(...saved.map((version) => Number(version.id))) + 1;
        setSaved([
          {
            id,
            time: new Date().toISOString(),
            person: maria,
            summary: `Restored from ${source.label ?? 'an earlier version'}`,
            recipe: source.recipe,
          },
          ...saved,
        ]);
        resolve();
      }, 300);
    });
  return (
    <div data-lab-demo="recipe">
      <VersionHistory
        aria-label="Recipe versions"
        versions={saved}
        currentKey={current.id}
        selectedKeys={selected}
        onSelectionChange={(keys) => {
          setSelected(keys);
          setCompared(null);
        }}
        onCompare={setCompared}
        onRestore={restore}
        onRename={(key, label) =>
          setSaved((list) =>
            list.map((version) => (version.id === key ? { ...version, label } : version)),
          )
        }
        showAvatar
      />
      <Preview saved={saved} view={compared ?? [...selected].slice(-1)} />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Named and automatic versions with the current one marked, two selected for a comparison, loading more, loading, an error and no versions, with and without the filters. The clock is fixed at 20 April 2026, 10:30."
    >
      <StateMatrix
        axes={{
          state: ['versions', 'two selected', 'loading more', 'loading', 'error', 'empty'],
          filters: ['shown', 'hidden'],
        }}
        render={({ state, filters }) => (
          <VersionHistory
            aria-label={`Versions, ${state}, filters ${filters}`}
            currentKey="v6"
            showFilters={filters === 'shown'}
            onCompare={() => {}}
            onRestore={() => {}}
            onRename={() => {}}
            getNow={getNow}
            {...stateProps(state)}
          />
        )}
      />
    </LabSection>
    <LabSection title="Filtered" description="Named versions only, and one person's versions.">
      <StateMatrix
        axes={{ filter: ['named only', 'Jon Berg'] }}
        render={({ filter }) => (
          <VersionHistory
            aria-label={`Versions, ${filter}`}
            versions={versions}
            currentKey="v6"
            defaultFilter={
              filter === 'named only'
                ? { namedOnly: true, person: null }
                : { namedOnly: false, person: 'Jon Berg' }
            }
            getNow={getNow}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="A recipe's history"
      description="Select a version to view it, two to compare them; restore one (a new current version) or rename it from its menu."
    >
      <RecipeHistory />
    </LabSection>
  </>,
);
