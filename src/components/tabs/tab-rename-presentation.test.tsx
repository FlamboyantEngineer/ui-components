import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Orientation } from '../../core/props.js';
import { Tabs, TabsContent, TabsList, type TabsListProps, TabsTrigger } from './tabs.js';

type Presentation = Pick<TabsListProps, 'scrollButtons' | 'overflow' | 'onAdd'> & {
  orientation?: Orientation;
};

const fruit = ['Apple', 'Banana', 'Cherry'];
const onAdd = () => {};

function list(onRename: TabsListProps['onRename'], { orientation, ...props }: Presentation) {
  return (
    <Tabs orientation={orientation}>
      <TabsList
        aria-label="Fruit"
        onRename={onRename}
        validateName={(_key, name) => (name === 'Taken' ? 'That name is taken.' : null)}
        {...props}
      >
        {fruit.map((name) => (
          <TabsTrigger key={name} id={name.toLowerCase()}>
            {name}
          </TabsTrigger>
        ))}
      </TabsList>
      {fruit.map((name) => (
        <TabsContent key={name} id={name.toLowerCase()}>
          About {name}
        </TabsContent>
      ))}
    </Tabs>
  );
}

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('Tab renaming across presentation changes', { timeout: 15_000 }, () => {
  it.each<[string, Presentation, Presentation]>([
    ['scroll buttons', {}, { scrollButtons: true }],
    ['an overflow menu', {}, { overflow: 'menu' }],
    ['an add button', {}, { onAdd }],
    ['a vertical list', {}, { orientation: 'vertical' }],
    ['no scroll buttons', { scrollButtons: true }, {}],
    ['no overflow menu', { overflow: 'menu' }, {}],
    ['no add button', { onAdd }, {}],
  ])(
    'UIC-TABS-3.10 keeps the draft, its message and focus when the list gains %s',
    async (_case, from, to) => {
      const user = userEvent.setup();
      const onRename = vi.fn();
      const { rerender } = render(list(onRename, from));
      await user.tab();
      await user.keyboard('{F2}{Control>}a{/Control}Taken');
      const field = screen.getByRole('textbox');
      expect(field).toHaveAccessibleDescription('That name is taken.');
      rerender(list(onRename, to));
      expect(screen.getByRole('textbox')).toBe(field);
      expect(field).toHaveValue('Taken');
      expect(field).toHaveFocus();
      expect(field).toHaveAccessibleDescription('That name is taken.');
      await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}Plum{Enter}');
      expect(onRename).toHaveBeenCalledWith('apple', 'Plum');
    },
  );
});
