import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Orientation } from '../../core/props.js';
import { Tab, TabList, type TabListProps, TabPanel, Tabs } from './tabs.js';

type Presentation = Pick<TabListProps, 'scrollButtons' | 'overflow' | 'onAdd'> & {
  orientation?: Orientation;
};

const fruit = ['Apple', 'Banana', 'Cherry'];
const onAdd = () => {};

function list(onRename: TabListProps['onRename'], { orientation, ...props }: Presentation) {
  return (
    <Tabs orientation={orientation}>
      <TabList
        aria-label="Fruit"
        onRename={onRename}
        validateName={(_key, name) => (name === 'Taken' ? 'That name is taken.' : null)}
        {...props}
      >
        {fruit.map((name) => (
          <Tab key={name} id={name.toLowerCase()}>
            {name}
          </Tab>
        ))}
      </TabList>
      {fruit.map((name) => (
        <TabPanel key={name} id={name.toLowerCase()}>
          About {name}
        </TabPanel>
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
