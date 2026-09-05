import { test, expect } from "@playwright/test";

const publicRoutes = [
  "/",
  "/auth",
  "/builder",
  "/analyzer",
  "/analysis",
  "/skills",
  "/suggestions",
  "/interview",
  "/compare",
  "/roadmap",
  "/profile",
];

test.describe("ResumeAI responsive smoke tests", () => {
  for (const route of publicRoutes) {
    test(`${route} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();

      const overflow = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));

      expect(
        overflow.scrollWidth,
        `${route} overflows horizontally at ${overflow.viewportWidth}px`
      ).toBeLessThanOrEqual(overflow.viewportWidth + 1);
    });
  }

  test("homepage renders without a horizontal scrollbar", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ResumeAI/i);

    const overflow = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  });
});
