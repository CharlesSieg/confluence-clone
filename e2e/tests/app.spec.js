import { test, expect } from '@playwright/test';

test.describe('Knowledge Base App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads the app and shows sidebar', async ({ page }) => {
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await expect(page.getByText('Knowledge Base')).toBeVisible();
  });

  test('shows empty state initially', async ({ page }) => {
    await expect(page.locator('.main-empty')).toBeVisible();
  });

  test('creates a new page', async ({ page }) => {
    await page.getByTestId('new-page-btn').click();
    await expect(page.getByTestId('page-title-input')).toBeVisible();
    await expect(page.getByTestId('editor-toolbar')).toBeVisible();
  });

  test('edits page title', async ({ page }) => {
    await page.getByTestId('new-page-btn').click();
    const titleInput = page.getByTestId('page-title-input');
    await titleInput.fill('My Test Page');
    // Wait for auto-save
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('save-status')).toHaveText('Saved');
  });

  test('creates child page', async ({ page }) => {
    // Create parent page first
    await page.getByTestId('new-page-btn').click();
    const titleInput = page.getByTestId('page-title-input');
    await titleInput.fill('Parent Page');
    await page.waitForTimeout(1500);

    // Hover over the tree item and click add child
    const treeItem = page.locator('.tree-item').first();
    await treeItem.hover();
    await treeItem.locator('button[title="Add child page"]').click();

    // Should have a new page open
    await expect(page.getByTestId('page-title-input')).toBeVisible();
  });

  test('opens command palette with keyboard shortcut', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.getByTestId('command-palette')).toBeVisible();
    await expect(page.getByTestId('command-palette-input')).toBeFocused();
  });

  test('searches in command palette', async ({ page }) => {
    // Create a page first
    await page.getByTestId('new-page-btn').click();
    await page.getByTestId('page-title-input').fill('UniqueSearchPage');
    await page.waitForTimeout(1500);

    // Open command palette and search
    await page.keyboard.press('Meta+k');
    await page.getByTestId('command-palette-input').fill('UniqueSearch');
    // Look specifically inside the command palette
    const palette = page.getByTestId('command-palette');
    await expect(palette.locator('.command-palette-item .title', { hasText: 'UniqueSearchPage' })).toBeVisible();
  });

  test('sidebar filter works', async ({ page }) => {
    // Create pages
    await page.getByTestId('new-page-btn').click();
    await page.getByTestId('page-title-input').fill('FilterAlpha');
    await page.waitForTimeout(1500);

    await page.getByTestId('new-page-btn').click();
    await page.getByTestId('page-title-input').fill('FilterBeta');
    await page.waitForTimeout(1500);

    // Filter
    await page.getByTestId('sidebar-search').fill('FilterAlpha');
    await expect(page.locator('.tree-item', { hasText: 'FilterAlpha' })).toBeVisible();
  });

  test('deletes a page', async ({ page }) => {
    // Set up dialog handler for confirm BEFORE creating
    page.on('dialog', (dialog) => dialog.accept());

    await page.getByTestId('new-page-btn').click();
    await page.getByTestId('page-title-input').fill('ToDelete');
    await page.waitForTimeout(1500);

    // Find the specific tree item for "ToDelete"
    const treeItem = page.locator('.tree-item', { hasText: 'ToDelete' });
    await treeItem.hover();
    await treeItem.locator('button[title="Delete page"]').click();

    // Verify the item is gone from the tree
    await expect(page.locator('.tree-item', { hasText: 'ToDelete' })).toHaveCount(0);
  });

  test('editor toolbar has formatting buttons', async ({ page }) => {
    await page.getByTestId('new-page-btn').click();
    await expect(page.getByTestId('editor-toolbar')).toBeVisible();
    // Check some toolbar buttons exist
    await expect(page.locator('.toolbar-btn').first()).toBeVisible();
  });

  test('navigates between pages', async ({ page }) => {
    // Create two pages
    await page.getByTestId('new-page-btn').click();
    await page.getByTestId('page-title-input').fill('NavPageOne');
    await page.waitForTimeout(1500);

    await page.getByTestId('new-page-btn').click();
    await page.getByTestId('page-title-input').fill('NavPageTwo');
    await page.waitForTimeout(1500);

    // Click on NavPageOne in sidebar
    await page.locator('.tree-item').filter({ hasText: 'NavPageOne' }).click();
    await expect(page.getByTestId('page-title-input')).toHaveValue('NavPageOne');
  });
});
