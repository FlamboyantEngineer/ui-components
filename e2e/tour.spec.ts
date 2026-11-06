import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function getPositionTransitions(spotlight: Locator) {
  return spotlight.evaluate((element) =>
    element.getAnimations().flatMap((animation) => {
      const property =
        'transitionProperty' in animation ? String(animation.transitionProperty) : '';
      return ['top', 'left', 'width', 'height'].includes(property) ? [property] : [];
    }),
  );
}

test.describe('Tour lab', () => {
  test('UIC-TOUR-3.2 keeps a non-modal step against its target as its pane scrolls', async ({
    page,
    lab,
  }) => {
    await lab.open('tour');
    const pane = page.locator('[data-lab-pane="scrolling"]');
    const opener = pane.getByRole('button', { name: 'Tour in a pane' });
    await pane.scrollIntoViewIfNeeded();
    await opener.click();
    const panel = page.locator('[data-lab-tour="pane"]');
    await expect(panel.getByRole('dialog', { name: 'In a pane' })).toBeVisible();
    const offset = async () => {
      const [target, box] = [await opener.boundingBox(), await panel.boundingBox()];
      return { x: (box?.x ?? 0) - (target?.x ?? 0), y: (box?.y ?? 0) - (target?.y ?? 0) };
    };
    const before = await offset();
    await pane.evaluate((element) => element.scrollBy(0, 40));
    await expect.poll(async () => (await offset()).y).toBe(before.y);
    expect(await offset()).toEqual(before);
    await expect(panel.getByRole('dialog', { name: 'In a pane' })).toBeVisible();
  });

  test('UIC-TOUR-1.3 shows the first highlight in place without a position transition', async ({
    page,
    lab,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await lab.open('tour');
    // Long transitions make an accidental movement observable without racing its duration.
    await page.addStyleTag({ content: '.ui-tour__spotlight { transition-duration: 60s; }' });
    await page.locator('[data-lab-start="page"]').click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeFocused();
    const spotlight = page.locator('.ui-tour__spotlight');
    expect(await getPositionTransitions(spotlight)).toEqual([]);
    const target = page.locator('[data-lab-page="guided"] [data-lab-target="search"]');
    expect(await spotlight.boundingBox()).toEqual(await target.boundingBox());
  });

  test('UIC-TOUR-1.2 UIC-TOUR-1.3 skips position transitions when either highlight is missing', async ({
    page,
    lab,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await lab.open('tour');
    await page.addStyleTag({ content: '.ui-tour__spotlight { transition-duration: 60s; }' });
    const start = page.getByRole('button', { name: 'Preview highlight transitions' });
    await start.click();
    const spotlight = page.locator('.ui-tour__spotlight');
    await expect(page.getByRole('dialog', { name: 'Overview' })).toBeFocused();
    expect(await getPositionTransitions(spotlight)).toEqual([]);

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'First highlight' })).toBeFocused();
    expect(await getPositionTransitions(spotlight)).toEqual([]);
    const first = page.getByRole('button', { name: 'First highlight', includeHidden: true });
    expect(await spotlight.boundingBox()).toEqual(await first.boundingBox());

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Second highlight' })).toBeFocused();
    expect(await getPositionTransitions(spotlight)).toContain('left');
    await spotlight.evaluate((element) => {
      for (const animation of element.getAnimations()) animation.finish();
    });

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Summary' })).toBeFocused();
    await expect(spotlight).toHaveAttribute('data-target-missing', 'true');
    await expect(page.locator('.ui-tour__arrow')).toHaveCount(0);
    expect(await getPositionTransitions(spotlight)).toEqual([]);
    expect(await spotlight.boundingBox()).toMatchObject({ width: 0, height: 0 });

    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Second highlight' })).toBeFocused();
    expect(await getPositionTransitions(spotlight)).toEqual([]);
    const second = page.getByRole('button', { name: 'Second highlight', includeHidden: true });
    expect(await spotlight.boundingBox()).toEqual(await second.boundingBox());
    await page.keyboard.press('Escape');
    await expect(start).toBeFocused();
  });

  test('UIC-TOUR-1.1 UIC-TOUR-1.3 UIC-TOUR-2.1 walks the page with a spotlight over each target', async ({
    page,
    lab,
  }) => {
    await lab.open('tour');
    await page.locator('[data-lab-start="page"]').click();
    const step = page.getByRole('dialog', { name: 'Search' });
    await expect(step).toContainText('1 of 5');
    const spotlight = page.locator('.ui-tour__spotlight');
    const target = page.locator('[data-lab-page="guided"] [data-lab-target="search"]');
    await expect(async () => {
      const [spot, box] = [await spotlight.boundingBox(), await target.boundingBox()];
      expect(spot).toEqual(box);
    }).toPass();
    // The panel opens below its target.
    const panel = page.locator('[data-lab-tour="page"]');
    await expect(panel).toHaveAttribute('data-placement', 'bottom');
    expect((await panel.boundingBox())?.y).toBeGreaterThan((await target.boundingBox())?.y ?? 0);

    await step.getByRole('button', { name: 'Next' }).click();
    const filters = page.getByRole('dialog', { name: 'Filters' });
    await expect(filters).toContainText('2 of 5');
    await expect(page.locator('[data-lab-output="step"]')).toHaveText('2');
    const filtersTarget = page.locator('[data-lab-page="guided"] [data-lab-target="filters"]');
    await expect(async () => {
      expect(await spotlight.boundingBox()).toEqual(await filtersTarget.boundingBox());
    }).toPass();
    await filters.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  test('UIC-TOUR-1.2 UIC-TOUR-2.5 finishes on a centred step and returns focus', async ({
    page,
    lab,
  }) => {
    await lab.open('tour');
    const start = page.locator('[data-lab-start="page"]');
    await start.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeFocused();
    for (const title of ['Filters', 'Your recipes', 'Share', 'All set']) {
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('dialog', { name: title })).toBeFocused();
    }
    await expect(page.locator('.ui-tour__spotlight')).toHaveAttribute(
      'data-target-missing',
      'true',
    );
    await expect(page.locator('.ui-tour__arrow')).toHaveCount(0);
    const last = page.getByRole('dialog', { name: 'All set' });
    await expect(last.getByRole('button', { name: 'Skip' })).toHaveCount(0);
    await last.getByRole('button', { name: 'Finish' }).click();
    await expect(last).toHaveCount(0);
    await expect(page.locator('.ui-tour__spotlight')).toHaveCount(0);
    await expect(page.locator('[data-lab-output="outcome"]')).toHaveText('finished');
    await expect(start).toBeFocused();
  });

  test('UIC-TOUR-2.2 UIC-TOUR-3.2 skips with Escape and keeps a modal page inert', async ({
    page,
    lab,
  }) => {
    await lab.open('tour');
    await page.getByRole('button', { name: 'Tour bottom' }).first().click();
    const modal = page.getByRole('dialog', { name: 'This button' });
    await expect(modal).toBeFocused();
    await expect(page.locator('[data-lab-tour="bottom-modal"]')).not.toHaveAttribute(
      'data-non-modal',
    );
    // Outside the tour, the page is inert.
    const outside = page.locator('[data-lab-start="page"]');
    await expect
      .poll(() => outside.evaluate((element) => element.closest('[inert]') !== null))
      .toBe(true);
    await page.mouse.click(5, 5);
    await expect(modal).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(modal.locator(':focus')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tour bottom' }).first()).toBeFocused();

    await page.getByRole('button', { name: 'Tour end' }).last().click();
    const nonModal = page.locator('[data-lab-tour="end-non-modal"]');
    await expect(nonModal).toHaveAttribute('data-non-modal', 'true');
    await expect
      .poll(() => outside.evaluate((element) => element.closest('[inert]') !== null))
      .toBe(false);
    await expect(page.getByRole('button', { name: 'Take the tour' })).toBeVisible();
    await page.getByRole('button', { name: 'Take the tour' }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  test('UIC-TOUR-2.3 UIC-TOUR-3.1 remembers completion through the provider storage', async ({
    page,
    lab,
  }) => {
    await lab.open('tour');
    const completed = page.locator('[data-lab-output="remembered"]');
    await expect(completed).toHaveText('no');
    await page.getByRole('button', { name: 'Reload' }).click();
    const step = page.getByRole('dialog', { name: 'Search' });
    await expect(step).toBeVisible();
    await step.getByRole('button', { name: 'Skip' }).click();
    await expect(step).toHaveCount(0);
    await expect(completed).toHaveText('yes');
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Forget completion' }).click();
    await expect(completed).toHaveText('no');
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  test('UIC-TOUR-1.1 passes axe with a step open', async ({ page, lab }) => {
    await lab.open('tour');
    await page.locator('[data-lab-start="page"]').click();
    const panel = page.locator('[data-lab-tour="page"]');
    await expect(panel).toBeVisible();
    await expect(panel).not.toHaveAttribute('data-entering');
    await lab.expectAccessible('[data-lab-tour="page"]');
  });

  test('UIC-TOUR-2.2 UIC-TOUR-2.5 passes axe after closing the tour', async ({ page, lab }) => {
    await lab.open('tour');
    const start = page.locator('[data-lab-start="page"]');
    await start.click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(start).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-TOUR-2.2 leaves Escape to a field of the step that handles it', async ({
    page,
    lab,
  }) => {
    await lab.open('tour');
    const demo = page.locator('[data-lab-demo="escape-in-content"]');
    await demo.getByRole('button', { name: 'Open the note tour' }).click();
    const note = page.getByRole('dialog', { name: 'Quick note' }).getByRole('textbox', {
      name: 'Note',
    });
    await note.click();
    await page.keyboard.press('Escape');
    await expect(note).toHaveValue('');
    await expect(page.getByRole('dialog', { name: 'Quick note' })).toBeVisible();
    await expect(demo.locator('[data-lab-output="escape outcome"]')).toHaveText('open');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Quick note' })).toHaveCount(0);
    await expect(demo.locator('[data-lab-output="escape outcome"]')).toHaveText('skipped');
  });
});

test('UIC-TOUR-1.2 follows a target replaced or removed while its step shows', async ({
  page,
  lab,
}) => {
  await lab.open('tour');
  const demo = page.locator('[data-lab-replaced]');
  const spotlight = page.locator('.ui-tour__spotlight');
  const top = async (locator: Locator) => Math.round((await locator.boundingBox())?.y ?? -1);
  await demo.getByRole('button', { name: 'Point at the newest order' }).click();
  await expect(page.getByRole('dialog', { name: 'Newest order' })).toBeVisible();
  const newest = demo.locator('[data-lab-newest]');
  await expect.poll(() => top(spotlight)).toBe(await top(newest));
  await demo.getByRole('button', { name: 'Refresh the list' }).click();
  await expect(newest).toHaveText('Order 2 (newest)');
  await expect.poll(async () => (await top(spotlight)) === (await top(newest))).toBe(true);
  await demo.getByRole('button', { name: 'Clear the list' }).click();
  await expect(spotlight).toHaveAttribute('data-target-missing', 'true');
  await expect(page.getByRole('dialog', { name: 'Newest order' })).toBeVisible();
  await demo.getByRole('button', { name: 'Refresh the list' }).click();
  await expect(spotlight).not.toHaveAttribute('data-target-missing');
});

test('UIC-TOUR-1.4 shows a step as pending while it opens its section, then points at the target', async ({
  page,
  lab,
}) => {
  await lab.open('tour');
  const demo = page.locator('[data-lab-demo="prepared"]');
  const panel = page.locator('.ui-tour');
  await demo.getByRole('button', { name: 'Start the tour' }).click();
  await expect(page.getByRole('dialog', { name: 'Orders' })).toBeFocused();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('dialog', { name: 'Shipping options' })).toBeVisible();
  await expect(panel).toHaveAttribute('data-status', 'pending');
  await expect(
    page.getByRole('status').filter({ hasText: 'Getting this step ready…' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  await expect(panel).toHaveAttribute('data-status', 'ready');
  const options = demo.locator('[data-lab-prepared="shipping"]');
  await expect(options).toBeVisible();
  const spotlight = page.locator('.ui-tour__spotlight');
  // The section's opening moves the options; the spotlight measures them once they are shown.
  await expect(async () => {
    const [ring, target] = await Promise.all([spotlight.boundingBox(), options.boundingBox()]);
    expect(Math.abs((ring?.y ?? 0) - (target?.y ?? 0))).toBeLessThanOrEqual(8);
  }).toPass();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('dialog', { name: 'Notes' })).toBeVisible();
  await expect(panel).toHaveAttribute('data-status', 'ready');
  await expect(spotlight).not.toHaveAttribute('data-target-missing');
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('UIC-TOUR-1.4 retries a failed step and aborts a load on Back', async ({ page, lab }) => {
  await lab.open('tour');
  const demo = page.locator('[data-lab-demo="prepared"]');
  await demo.getByRole('switch', { name: 'Fail loading the options' }).press('Space');
  await demo.getByRole('button', { name: 'Start the tour' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('dialog', { name: 'Orders' })).toBeVisible();
  await expect(demo.locator('[data-lab-output="prepared"]')).toHaveText('shipping aborted');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('.ui-tour')).toHaveAttribute('data-status', 'failed');
  await expect(page.getByText('This step could not be shown.')).toBeVisible();
  await demo.getByRole('switch', { name: 'Fail loading the options' }).press('Space');
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.locator('.ui-tour')).toHaveAttribute('data-status', 'ready');
  await expect(demo.locator('[data-lab-prepared="shipping"]')).toBeVisible();
});
