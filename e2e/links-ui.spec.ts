import { test, expect } from '@playwright/test';

const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

test('first load shows the form and a populated table', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('create-link-form')).toBeVisible();
  await expect(page.getByTestId('link-row').first()).toBeVisible();
  expect(await page.getByTestId('link-row').count()).toBeGreaterThanOrEqual(4);
});

test('creating a link adds it to the table', async ({ page }) => {
  const slug = `ui-${suffix}`;
  await page.goto('/');

  const form = page.getByTestId('create-link-form');
  await form.getByLabel('Destination URL').fill(`https://example.com/ui/${suffix}`);
  await form.getByLabel('Custom slug').fill(slug);
  await form.getByRole('button', { name: 'Shorten link' }).click();

  const row = page.getByTestId('link-row').filter({ hasText: `https://example.com/ui/${suffix}` });
  await expect(row).toHaveCount(1);
  await expect(row.getByTestId('short-url')).toContainText(`/r/${slug}`);
});

test('a duplicate slug shows an error instead of a row', async ({ page }) => {
  const slug = `dupe-${suffix}`;
  await page.goto('/');

  const form = page.getByTestId('create-link-form');
  await form.getByLabel('Destination URL').fill(`https://example.com/dupe/first/${suffix}`);
  await form.getByLabel('Custom slug').fill(slug);
  await form.getByRole('button', { name: 'Shorten link' }).click();
  // The form clears on success, so wait for it before typing the second link.
  await expect(page.getByTestId('link-row').filter({ hasText: slug })).toHaveCount(1);

  await form.getByLabel('Destination URL').fill(`https://example.com/dupe/second/${suffix}`);
  await form.getByLabel('Custom slug').fill(slug);
  await form.getByRole('button', { name: 'Shorten link' }).click();

  await expect(form.getByRole('alert')).toContainText('already taken');
  await expect(page.getByTestId('link-row').filter({ hasText: slug })).toHaveCount(1);
});

test('stats page renders the clicks chart for a demo link', async ({ page }) => {
  await page.goto('/links/next-docs');
  await expect(page.getByRole('heading', { name: 'Clicks per day' })).toBeVisible();
  await expect(page.locator('.recharts-bar-rectangle').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Top referrers' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Devices' })).toBeVisible();
});

test('stats page shows an error for an unknown slug', async ({ page }) => {
  await page.goto(`/links/missing-${suffix}`);
  await expect(page.getByText('No link named')).toBeVisible();
});
