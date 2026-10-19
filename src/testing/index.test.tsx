import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { UiProvider } from '../core/provider.js';
import { Tab, TabList, TabPanel, Tabs } from '../components/tabs/tabs.js';
import { createMemoryStorage } from './index.js';

const testingDir = join(process.cwd(), 'src', 'testing');
// Value imports and re-exports; `import type` and `export type` load nothing at run time.
const MODULE_REFERENCE = /^(?:import|export) (type )?[^;]*?'([^']+)';/gms;

function Fruit() {
  return (
    <Tabs persistKey="fruit">
      <TabList aria-label="Fruit">
        <Tab id="apple">Apple</Tab>
        <Tab id="pear">Pear</Tab>
      </TabList>
      <TabPanel id="apple">Crisp.</TabPanel>
      <TabPanel id="pear">Soft.</TabPanel>
    </Tabs>
  );
}

describe('testing entry point', () => {
  it('UIC-TESTING-1.1 loads only the DOM Testing Library besides its own modules and storage', () => {
    const sources = readdirSync(testingDir).filter(
      (name) => name.endsWith('.ts') && !name.includes('.test.'),
    );
    const loaded = sources.flatMap((name) =>
      [...readFileSync(join(testingDir, name), 'utf8').matchAll(MODULE_REFERENCE)]
        .filter((match) => !match[1])
        .map((match) => match[2] ?? ''),
    );
    expect(new Set(loaded.filter((source) => !source.startsWith('./')))).toEqual(
      new Set(['@testing-library/dom', '../core/storage.js']),
    );
    expect(readFileSync(join(process.cwd(), 'src', 'index.ts'), 'utf8')).not.toMatch(
      /from '\.\/testing\//,
    );
  });

  it('UIC-TESTING-1.2 hands UiProvider a memory storage the test can read', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ fruit: '"pear"' });
    const { unmount } = render(
      <UiProvider storage={storage}>
        <Fruit />
      </UiProvider>,
    );
    expect(screen.getByRole('tab', { name: 'Pear' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'Apple' }));
    expect(storage.getItem('fruit')).toBe('"apple"');
    unmount();
    render(
      <UiProvider storage={createMemoryStorage()}>
        <Fruit />
      </UiProvider>,
    );
    expect(screen.getByRole('tab', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
  });
});
