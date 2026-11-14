import { expect, test } from './fixtures.js';

test('UIC-COMPOSITION-WORKFLOWS-1.1 supports compact and wide host compositions', async ({
  page,
  lab,
}) => {
  await lab.open('composition-workflows');
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('button', { name: 'Edit Item title' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Item location' })).toBeVisible();
    const header = page.locator('[data-lab-section="Header"] > .ui-stack');
    const identity = page.locator('[data-lab-section="Identity"] > .ui-cluster');
    await expect(async () => {
      const geometry = await header.evaluate((root) => {
        const children = Array.from(root.children, (child) => child.getBoundingClientRect());
        return {
          gap: getComputedStyle(root).rowGap,
          actualGap: (children[1]?.top ?? 0) - (children[0]?.bottom ?? 0),
        };
      });
      expect(geometry.gap).toBe('8px');
      expect(geometry.actualGap).toBeCloseTo(8, 0);
      const filter = await page
        .locator('[data-lab-section="Counted filters"] .ui-action-row')
        .evaluate((root) => {
          const lead = root.querySelector('.ui-action-row__lead')?.getBoundingClientRect();
          const actions = root.querySelector('.ui-action-row__actions')?.getBoundingClientRect();
          return {
            gap: (actions?.left ?? 0) - (lead?.right ?? 0),
            centers: Math.abs(
              ((lead?.top ?? 0) + (lead?.bottom ?? 0)) / 2 -
                ((actions?.top ?? 0) + (actions?.bottom ?? 0)) / 2,
            ),
            width: root.clientWidth,
            scrollWidth: root.scrollWidth,
          };
        });
      expect(filter.gap).toBeCloseTo(8, 0);
      expect(filter.centers).toBeLessThanOrEqual(1);
      expect(filter.scrollWidth).toBeLessThanOrEqual(filter.width + 1);
      const row = await identity.evaluate((root) => {
        const bounds = root.getBoundingClientRect();
        return {
          gap: getComputedStyle(root).columnGap,
          left: bounds.left,
          right: bounds.right,
          children: Array.from(root.children, (child) => {
            const box = child.getBoundingClientRect();
            return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
          }),
        };
      });
      expect(row.gap).toBe('6px');
      for (const [index, child] of row.children.entries()) {
        expect(child.left).toBeGreaterThanOrEqual(row.left - 1);
        expect(child.right).toBeLessThanOrEqual(row.right + 1);
        const previous = row.children[index - 1];
        if (!previous) continue;
        if (Math.min(previous.bottom, child.bottom) > Math.max(previous.top, child.top))
          expect(child.left - previous.right).toBeGreaterThanOrEqual(5);
        else expect(child.top - previous.bottom).toBeGreaterThanOrEqual(5);
      }
    }).toPass();
    await lab.expectAccessible();
  }
});

test('UIC-COMPOSITION-WORKFLOWS-1.2 composes a menu, required comment and modal confirmation', async ({
  page,
  lab,
}) => {
  await lab.open('composition-workflows');
  await page.getByRole('button', { name: 'Change availability' }).click();
  await page.getByRole('menuitem', { name: /^Archive/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Archive item' });
  await expect(dialog.getByRole('button', { name: 'Archive', exact: true })).toBeDisabled();
  await dialog.getByRole('textbox', { name: 'Reason' }).fill('No longer needed');
  await dialog.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Archived', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Change availability' })).toBeFocused();
});

test('UIC-COMPOSITION-WORKFLOWS-1.3 retains async errors, retry and trigger focus in generic modals', async ({
  page,
  lab,
}) => {
  await lab.open('composition-workflows');
  const trigger = page.getByRole('button', { name: 'Add signature' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Sign sample item' });
  await dialog.getByRole('textbox', { name: 'Signature', exact: true }).fill('Alex Morgan');
  await dialog.getByLabel(/^Credential/).fill('wrong');
  await dialog.getByRole('button', { name: 'Save signature' }).click();
  await expect(dialog.getByRole('alert')).toContainText('not accepted');
  await dialog.getByLabel(/^Credential/).fill('orchard');
  await dialog.getByRole('button', { name: 'Save signature' }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByText('Signature saved', { exact: true })).toBeVisible();
});

test('UIC-COMPOSITION-WORKFLOWS-1.4 rolls back failed counted filters and retries without custom layout rules', async ({
  page,
  lab,
}) => {
  await lab.open('composition-workflows');
  const choice = page.getByRole('radiogroup', { name: 'Show items' });
  await choice.getByRole('radio', { name: 'Flagged items, 0' }).click();
  await expect(
    page.getByText('Filter request failed. Retry when ready.', { exact: true }),
  ).toBeVisible();
  await expect(choice.getByRole('radio', { name: 'All items, 12' })).toBeChecked();
  await page.getByRole('button', { name: 'Allow filter request' }).click();
  await choice.getByRole('radio', { name: 'Flagged items, 0' }).click();
  await expect(choice.getByRole('radio', { name: 'Flagged items, 0' })).toBeChecked();
  await expect(page.getByText('Showing flagged items', { exact: true })).toBeVisible();
});

test('UIC-COMPOSITION-WORKFLOWS-1.5 lets the host clear a selection with Escape and restores collection focus', async ({
  page,
  lab,
}) => {
  await lab.open('composition-workflows');
  await page.getByRole('button', { name: 'Remove selected', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('toolbar', { name: 'Selected item actions' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Select two items' })).toBeFocused();
});

test('UIC-COMPOSITION-WORKFLOWS-1.6 composes reviewer outcome, quorum and reminder retry in host state', async ({
  page,
  lab,
}) => {
  await lab.open('composition-workflows');
  await expect(page.getByText('1 of 2 accepted', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Send reminder' }).click();
  await expect(
    page.getByText('Delivery failed; retry the reminder.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Send reminder' }).click();
  await expect(page.getByText('Reminder sent', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Accept as Sam' }).click();
  await expect(page.getByText('2 of 2 accepted', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Request changes', exact: true }).click();
  await expect(page.getByText('1 of 2 accepted', { exact: true })).toBeVisible();
  const sam = page
    .getByRole('region', { name: 'Review sample item' })
    .getByRole('listitem')
    .filter({ hasText: 'Sam Rivera' });
  await expect(sam).toContainText('Changes requested');
  await expect(page.getByRole('button', { name: 'Send reminder' })).toHaveCount(0);
});

test('UIC-COMPOSITION-WORKFLOWS-1.4 keeps long counted filters scrollable beside three contained actions at 320 and 720 pixels', async ({
  page,
  lab,
}) => {
  await lab.open('composition-workflows');
  const demo = page.locator('[data-lab-section="Counted filters"]');
  const lead = demo.locator('.ui-action-row__lead');
  const choice = demo.getByRole('radiogroup', { name: 'Show items' });
  for (const width of [320, 720]) {
    await demo.evaluate((node, pixels) => {
      node.style.width = `${pixels}px`;
    }, width);
    await expect(async () => {
      const geometry = await demo.locator('.ui-action-row').evaluate((root) => {
        const bounds = root.getBoundingClientRect();
        const lead = root.querySelector('.ui-action-row__lead');
        const group = root.querySelector('.ui-segmented-choice');
        const actions = root.querySelector('.ui-action-row__actions');
        const leadBox = lead?.getBoundingClientRect();
        const groupBox = group?.getBoundingClientRect();
        const actionsBox = actions?.getBoundingClientRect();
        return {
          width: bounds.width,
          leadWidth: leadBox?.width ?? 0,
          leadScrollWidth: lead?.scrollWidth ?? 0,
          actionsRight: actionsBox?.right ?? 0,
          right: bounds.right,
          gap: (actionsBox?.left ?? 0) - (leadBox?.right ?? 0),
          labels: Array.from(root.querySelectorAll('.ui-segmented-choice__label'), (label) => ({
            visible: label.clientWidth,
            content: label.scrollWidth,
          })),
          groupHeight: groupBox?.height ?? 0,
          controlsCenterDifference: Math.abs(
            ((groupBox?.top ?? 0) + (groupBox?.bottom ?? 0)) / 2 -
              ((actionsBox?.top ?? 0) + (actionsBox?.bottom ?? 0)) / 2,
          ),
        };
      });
      expect(geometry.width).toBeCloseTo(width, 0);
      expect(geometry.leadWidth).toBeGreaterThan(width / 2);
      expect(geometry.actionsRight).toBeLessThanOrEqual(geometry.right + 1);
      expect(geometry.gap).toBeCloseTo(8, 0);
      expect(geometry.controlsCenterDifference).toBeLessThanOrEqual(1);
      for (const label of geometry.labels)
        expect(label.content).toBeLessThanOrEqual(label.visible + 1);
      if (width === 320) expect(geometry.leadScrollWidth).toBeGreaterThan(geometry.leadWidth);
    }).toPass();
    await expect(demo.locator('.ui-action-row__action')).toHaveCount(3);
    await expect(demo.getByRole('button', { name: 'Loading items' })).toHaveAttribute(
      'data-pending',
      'true',
    );
    await choice.getByRole('radio', { name: 'All items, 12' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const last = choice.getByRole('radio', { name: 'Waiting for another detailed response, 128' });
    await expect(last).toBeFocused();
    if (width === 320)
      await expect.poll(() => lead.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    await expect(async () => {
      const bounds = await lead.boundingBox();
      const count = await last.locator('.ui-badge').boundingBox();
      expect(count?.x ?? 0).toBeGreaterThanOrEqual((bounds?.x ?? 0) - 1);
      expect((count?.x ?? 0) + (count?.width ?? 0)).toBeLessThanOrEqual(
        (bounds?.x ?? 0) + (bounds?.width ?? 0) + 1,
      );
    }).toPass();
  }
});
