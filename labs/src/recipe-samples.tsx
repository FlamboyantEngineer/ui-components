// Sample recipes and a plain table that shows them as display options ask, shared by the view
// switcher and display options labs.

import type {
  DisplayOptionsProperty,
  DisplayOptionsValue,
} from '../../src/components/display-options/display-options.js';

interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  minutes: number;
  author: string;
}

export const recipes: Recipe[] = [
  {
    id: 'r1',
    title: 'Seeded rye loaf',
    cuisine: 'Nordic',
    minutes: 240,
    author: 'Maria Santos',
  },
  {
    id: 'r2',
    title: 'Miso soup',
    cuisine: 'Japanese',
    minutes: 15,
    author: 'Jon Berg',
  },
  {
    id: 'r3',
    title: 'Meatballs',
    cuisine: 'Nordic',
    minutes: 45,
    author: 'Lena Ortiz',
  },
  {
    id: 'r4',
    title: 'Risotto',
    cuisine: 'Italian',
    minutes: 35,
    author: 'Maria Santos',
  },
  {
    id: 'r5',
    title: 'Teriyaki salmon',
    cuisine: 'Japanese',
    minutes: 25,
    author: 'Jon Berg',
  },
  {
    id: 'r6',
    title: 'Focaccia',
    cuisine: 'Italian',
    minutes: 150,
    author: 'Lena Ortiz',
  },
];

export const recipeProperties: DisplayOptionsProperty[] = [
  { id: 'title', label: 'Title', allowsSorting: true },
  { id: 'cuisine', label: 'Cuisine', allowsGrouping: true, allowsSorting: true },
  { id: 'minutes', label: 'Cooking time', allowsSorting: true },
  { id: 'author', label: 'Author', allowsGrouping: true, allowsSorting: true },
];

type RecipeColumn = 'title' | 'cuisine' | 'minutes' | 'author';

const labels: Record<RecipeColumn, string> = {
  title: 'Title',
  cuisine: 'Cuisine',
  minutes: 'Cooking time',
  author: 'Author',
};

function formatCell(recipe: Recipe, column: RecipeColumn): string {
  return column === 'minutes' ? `${recipe.minutes} min` : recipe[column];
}

/** The recipes sorted as the value asks. */
function sortRecipes(rows: readonly Recipe[], value: DisplayOptionsValue): Recipe[] {
  const { sort } = value;
  if (!sort) return [...rows];
  const column = sort.column as RecipeColumn;
  const sign = sort.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((a, b) =>
    column === 'minutes'
      ? sign * (a.minutes - b.minutes)
      : sign * a[column].localeCompare(b[column]),
  );
}

/** The recipes in groups, as the value asks: one unnamed group without grouping. */
function groupRecipes(rows: readonly Recipe[], value: DisplayOptionsValue) {
  if (value.groupBy === null) return [{ name: '', rows: [...rows] }];
  const column = value.groupBy as RecipeColumn;
  const groups = new Map<string, Recipe[]>();
  for (const recipe of rows) {
    const name = formatCell(recipe, column);
    groups.set(name, [...(groups.get(name) ?? []), recipe]);
  }
  return [...groups].map(([name, grouped]) => ({ name, rows: grouped }));
}

/** A plain table of recipes shown, sorted, grouped and spaced as `value` asks. */
export function RecipeTable({
  rows,
  value,
  caption,
}: {
  rows: readonly Recipe[];
  value: DisplayOptionsValue;
  caption: string;
}) {
  const columns = value.properties as RecipeColumn[];
  const groups = groupRecipes(sortRecipes(rows, value), value);
  return (
    <table
      data-lab-output="table"
      data-density={value.density}
      cellPadding={value.density === 'compact' ? 2 : 6}
    >
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {labels[column]}
            </th>
          ))}
        </tr>
      </thead>
      {groups.map((group) => (
        <tbody key={group.name}>
          {group.name ? (
            <tr>
              <th scope="rowgroup" colSpan={columns.length}>
                {group.name}
              </th>
            </tr>
          ) : null}
          {group.rows.map((recipe) => (
            <tr key={recipe.id}>
              {columns.map((column) => (
                <td key={column}>{formatCell(recipe, column)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}
