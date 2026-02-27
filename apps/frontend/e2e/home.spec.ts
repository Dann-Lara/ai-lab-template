import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('should display the AI Lab title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /AI Lab Template/i })).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Open Dashboard/i }).click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/AI Lab Dashboard/i)).toBeVisible();
  });
});

test.describe('Dashboard - AI Generator', () => {
  test('should render AI generator form', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByPlaceholder(/Write your prompt here/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate/i })).toBeVisible();
  });
});
