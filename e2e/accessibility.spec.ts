import { readdirSync } from 'node:fs';
import { test } from './fixtures.js';

const labNames = readdirSync('labs')
  .filter((file) => file.endsWith('.html') && file !== 'index.html')
  .map((file) => file.slice(0, -'.html'.length))
  .sort();

test.describe('every lab', () => {
  // A whole-lab axe scan of the largest labs can outlast the default budget on a loaded machine.
  test.slow();
  for (const name of labNames) {
    for (const theme of ['light', 'dark']) {
      test(`UIC-LABS-3.4 ${name} passes axe in the ${theme} theme`, async ({ lab }) => {
        await lab.open(name, theme === 'dark' ? { theme } : {});
        await lab.expectAccessible();
      });
    }
  }
});
