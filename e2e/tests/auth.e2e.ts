import { test, expect } from "@playwright/test";

test("user can login and access protected route", async ({ page }) => {
  // HashRouter → must include #
  await page.goto("/#/login");

  await page.getByLabel("Username").fill("mentor1");
  await page.getByLabel("Password").fill("password123");

  await page.getByRole("button", { name: /login/i }).click();

  // Token should be stored
  const token = await page.evaluate(() => localStorage.getItem("token"));
  expect(token).toBeTruthy();

  // Roles should be stored
  const roles = await page.evaluate(() => localStorage.getItem("roles"));
  expect(roles).toContain("Mentor");

  // Navigate to protected mentor route
  await page.goto("/#/manage/dashboard");

  await expect(page.getByText(/dashboard/i)).toBeVisible();
});
