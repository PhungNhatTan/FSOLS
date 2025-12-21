import { chromium } from "@playwright/test";

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto("http://localhost:5173/#/login");
  await page.fill("input[name=username]", "mentor1");
  await page.fill("input[name=password]", "password123");
  await page.click("button[type=submit]");

  await page.waitForFunction(() => localStorage.getItem("token"));

  await page.context().storageState({ path: "auth.json" });
  await browser.close();
}

export default globalSetup;
