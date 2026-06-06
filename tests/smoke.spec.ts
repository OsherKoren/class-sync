import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

const enLocale = { name: "locale", value: "en", domain: "localhost", path: "/" };

test.describe("Smoke Tests", () => {
  test("register page should load", async ({ page, context }) => {
    await context.addCookies([enLocale]);
    await page.goto(`${BASE_URL}/register`);

    // Check page title
    await expect(page).toHaveTitle(/ClassSync/i);

    // Check for key elements
    const studentButton = page.getByRole("button", { name: /Student/i });
    await expect(studentButton).toBeVisible();

    console.log("✅ Register page loads successfully");
  });

  test("login page should load", async ({ page, context }) => {
    await context.addCookies([enLocale]);
    await page.goto(`${BASE_URL}/login`);

    // Check page title
    await expect(page).toHaveTitle(/ClassSync/i);

    // Check for sign in button
    const signInButton = page.getByRole("button", { name: /Sign in/i });
    await expect(signInButton).toBeVisible();

    console.log("✅ Login page loads successfully");
  });

  test("unauthenticated users should be redirected to login from student routes", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/student/dashboard`);

    // Should redirect to login
    expect(page.url()).toContain("/login");

    console.log("✅ Student routes are protected");
  });

  test("home page should load", async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for ClassSync heading
    const heading = page.getByText(/ClassSync/i);
    await expect(heading).toBeVisible();

    console.log("✅ Home page loads successfully");
  });
});
