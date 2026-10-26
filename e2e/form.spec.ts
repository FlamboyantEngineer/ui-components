import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

function mode(page: Page, name: string): Locator {
  return page.locator(`[data-lab-cell="mode=${name}"]`);
}

test.describe('Form lab', () => {
  test('UIC-FORM-1.1 UIC-FORM-1.2 blocks a submit with errors and focuses the first invalid field', async ({
    page,
    lab,
  }) => {
    await lab.open('form');
    const booking = page.locator('[data-lab-form="booking"]');
    const name = booking.getByRole('textbox', { name: 'Name' });
    await expect(booking).toHaveClass(/ui-form/);
    await expect(name).not.toHaveAttribute('aria-invalid');
    await booking.getByRole('button', { name: 'Book' }).click();
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(booking.getByRole('group', { name: 'Courses' })).toHaveAccessibleDescription(
      'A value is required.',
    );
    await expect(output(page, 'Booking')).toHaveText('none');
    await name.fill('Ada');
    await booking.getByRole('button', { name: 'Book' }).click();
    const guests = booking.getByRole('textbox', { name: 'Guests' });
    await expect(guests).toBeFocused();
    await guests.fill('3');
    await booking.getByText('Main', { exact: true }).click();
    await booking.getByText('Accept the house rules', { exact: true }).click();
    await booking.getByRole('button', { name: 'Book' }).click();
    await expect(output(page, 'Booking')).toHaveText(
      'name=Ada, guests=3, courses=main, rules=true',
    );
    await lab.expectAccessible();
  });

  test('UIC-FORM-1.4 shows a required field message in each validation mode', async ({
    page,
    lab,
  }) => {
    await lab.open('form');
    await expect(mode(page, 'immediate').getByRole('textbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    for (const name of ['change', 'blur', 'submit']) {
      await expect(mode(page, name).getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    }
    const change = mode(page, 'change').getByRole('textbox');
    await change.fill('a');
    await change.fill('');
    await expect(change).toHaveAttribute('aria-invalid', 'true');

    const blur = mode(page, 'blur').getByRole('textbox');
    await blur.focus();
    await expect(blur).not.toHaveAttribute('aria-invalid');
    await blur.press('Tab');
    await expect(blur).toHaveAttribute('aria-invalid', 'true');

    const submit = mode(page, 'submit').getByRole('textbox');
    await submit.focus();
    await submit.press('Tab');
    await expect(submit).not.toHaveAttribute('aria-invalid');
    await mode(page, 'submit').getByRole('button', { name: 'Check' }).click();
    await expect(submit).toHaveAttribute('aria-invalid', 'true');
    await expect(submit).toBeFocused();
  });

  test('UIC-FORM-1.3 shows a server error until the value changes', async ({ page, lab }) => {
    await lab.open('form');
    const field = page.locator('[data-lab-field="username"]');
    const username = field.getByRole('textbox', { name: 'Username' });
    await username.fill('ada');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(output(page, 'Sign up')).toHaveText('rejected');
    await expect(username).toHaveAttribute('aria-invalid', 'true');
    await expect(field.locator('.ui-field__message')).toHaveText('This username is taken.');
    await username.press('End');
    await username.pressSequentially('x');
    await expect(username).not.toHaveAttribute('aria-invalid');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(output(page, 'Sign up')).toHaveText('created adax');
  });

  test('UIC-FORM-1.5 blocks a native submit through the field custom validity', async ({
    page,
    lab,
  }) => {
    await lab.open('form');
    const field = page.locator('[data-lab-field="email"]');
    const email = field.getByRole('textbox', { name: 'Email' });
    expect(await email.evaluate((input: HTMLInputElement) => input.validationMessage)).toBe(
      'A value is required.',
    );
    await page.getByRole('button', { name: 'Subscribe' }).click();
    await expect(email).toBeFocused();
    await expect(field).toHaveAttribute('data-validation', 'invalid');
    await expect(output(page, 'Newsletter')).toHaveText('none');
    await email.fill('ada');
    expect(await email.evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Subscribe' }).click();
    await expect(output(page, 'Newsletter')).toHaveText('none');
    await email.fill('ada@example.com');
    await page.getByRole('button', { name: 'Subscribe' }).click();
    await expect(output(page, 'Newsletter')).toHaveText('email=ada@example.com');
  });

  test('UIC-FIELD-10.1 UIC-FIELD-10.2 disables a fieldset whose fields then never block', async ({
    page,
    lab,
  }) => {
    await lab.open('form');
    const address = page.getByRole('group', { name: 'Delivery address' });
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(address.getByRole('textbox', { name: 'Street' })).toBeFocused();
    await expect(output(page, 'Delivery')).toHaveText('none');
    await page.getByText('Pick up in store').click();
    await expect(address).toHaveAttribute('data-disabled', 'true');
    await expect(address.getByRole('textbox', { name: 'Street' })).toBeDisabled();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(output(page, 'Delivery')).toHaveText('nothing');
    await lab.expectAccessible();
  });
});
