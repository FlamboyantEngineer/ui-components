import { expect, matrixCell, test } from './fixtures.js';

test.describe('Constraint Editor lab', () => {
  test('UIC-CONSTRAINT-EDITOR-2.1 draws every kind in every state', async ({ page, lab }) => {
    await lab.open('constraint-editor');
    for (const kind of ['text', 'number', 'date', 'options']) {
      await expect(
        matrixCell(page, `kind=${kind} state=editable`).locator('.ui-constraint-editor'),
      ).toHaveAttribute('data-kind', kind);
    }
    await expect(
      matrixCell(page, 'kind=text state=read-only').getByRole('button', { name: /^Unset/ }),
    ).toHaveCount(0);
    await expect(
      matrixCell(page, 'kind=text state=disabled').getByRole('textbox', { name: 'Pattern' }),
    ).toBeDisabled();
    await lab.expectAccessible();
  });

  test('UIC-CONSTRAINT-EDITOR-2.2 UIC-CONSTRAINT-EDITOR-2.3 shows conflicts without repairing them', async ({
    page,
    lab,
  }) => {
    await lab.open('constraint-editor');
    const demo = page.locator('[data-lab-demo="schema-number"]');
    const minimum = demo.getByRole('textbox', { name: 'Minimum' });
    await minimum.fill('9007199254740994');
    await expect(demo.locator('[data-lab-output="number issues"]')).toHaveText(
      '[{"constraint":"maximum","reason":"boundsReversed"},{"constraint":"default","reason":"defaultBelowMinimum"}]',
    );
    await expect(demo.getByRole('textbox', { name: 'Maximum' })).toHaveAccessibleDescription(
      'The maximum is below the minimum.',
    );
    await expect(demo.locator('[data-lab-output="number constraints"]')).toContainText(
      '"maximum":"9007199254740993.5"',
    );
    await demo.getByRole('button', { name: 'Unset Default value' }).click();
    await expect(demo.locator('[data-lab-output="number constraints"]')).not.toContainText(
      '"default"',
    );
    const text = page.locator('[data-lab-demo="schema-text"]');
    await expect(text.locator('[data-lab-output="text constraints"]')).toContainText(
      '"default":""',
    );
    await expect(text.getByRole('textbox', { name: 'Shortest length' })).toHaveValue('0');
  });

  test('UIC-CONSTRAINT-EDITOR-2.3 UIC-CONSTRAINT-EDITOR-2.4 maps server errors and locks inherited constraints', async ({
    page,
    lab,
  }) => {
    await lab.open('constraint-editor');
    const demo = page.locator('[data-lab-demo="server"]');
    await expect(demo.getByRole('textbox', { name: 'Minimum' })).toHaveAttribute('readonly');
    await demo.getByRole('button', { name: 'Save with a server error' }).click();
    await expect(demo.getByRole('textbox', { name: 'Maximum' })).toHaveAccessibleDescription(
      'The server allows at most 50 here.',
    );
    await lab.expectAccessible('[data-lab-demo="server"]');
  });
});
