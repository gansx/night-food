import { expect, test } from "@playwright/test";

const hasBaseUrl = Boolean(process.env.PLAYWRIGHT_BASE_URL);

test.describe("household smoke", () => {
  test.skip(!hasBaseUrl, "Set PLAYWRIGHT_BASE_URL to run browser smoke tests.");

  test("member home renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Night Food|Home/i);
  });

  test("admin login renders", async ({ page }) => {
    const adminBaseUrl = process.env.PLAYWRIGHT_ADMIN_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
    await page.goto(`${adminBaseUrl}/login`);
    await expect(page).toHaveTitle(/Night Food|Admin/i);
  });
});
