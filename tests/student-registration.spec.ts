import { test, expect, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

async function registerAs(
  page: Page,
  role: "student" | "guardian",
  opts: { name: string; email: string; password: string }
) {
  await page.goto(`${BASE_URL}/register`);
  await page.getByLabel(/Full name/i).fill(opts.name);
  await page.getByLabel(/Email/i).first().fill(opts.email);
  await page.getByLabel(/^Password/i).fill(opts.password);
  await page.getByLabel(/Confirm password/i).fill(opts.password);
  await page.getByRole("button", { name: /Create account/i }).click();
  await page.waitForURL(`${BASE_URL}/register/complete`, { timeout: 15000 });

  if (role === "student") {
    await page.getByRole("button", { name: /I'm a student/i }).click();
    await page.waitForURL(`${BASE_URL}/student/dashboard`, { timeout: 15000 });
  } else {
    await page.getByRole("button", { name: /I'm a parent/i }).click();
    await page.waitForURL(`${BASE_URL}/guardian/dashboard`, { timeout: 15000 });
  }
}

test.describe("Student Registration Flow", () => {
  test("should register a student with email/password", async ({ page }) => {
    const timestamp = Date.now();
    const email = `student-${timestamp}@example.com`;
    const fullName = `Test Student ${timestamp}`;

    await registerAs(page, "student", { name: fullName, email, password: "TestPass123!" });

    await expect(page.getByRole("heading", { name: /My Classes/i })).toBeVisible();
    await expect(page.getByText(new RegExp(`Welcome, ${fullName}`))).toBeVisible();
    await expect(page.getByRole("button", { name: /Find classes/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign out/i })).toBeVisible();
    await expect(
      page.getByText("You haven't enrolled in any classes yet.")
    ).toBeVisible();

    console.log(`✅ Student registered successfully: ${email}`);
  });

  test("should block unauthorized access to student routes", async ({ page }) => {
    await page.goto(`${BASE_URL}/student/dashboard`);

    await page.waitForURL(`${BASE_URL}/login`);
    await expect(page.getByRole("heading", { name: /ClassSync/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();

    console.log("✅ Unauthorized access blocked correctly");
  });

  test("should login as student and redirect to student dashboard", async ({ page }) => {
    const timestamp = Date.now();
    const email = `login-student-${timestamp}@example.com`;
    const password = "LoginPass123!";
    const fullName = `Login Test ${timestamp}`;

    await registerAs(page, "student", { name: fullName, email, password });

    await page.getByRole("button", { name: /Sign out/i }).click();
    await page.waitForURL(`${BASE_URL}/login`);

    await page.getByLabel(/Email/i).first().fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByRole("button", { name: /Sign in/i }).click();

    await page.waitForURL(`${BASE_URL}/student/dashboard`, { timeout: 15000 });
    await expect(page.getByText(new RegExp(`Welcome, ${fullName}`))).toBeVisible();

    console.log(`✅ Student login successful: ${email}`);
  });

  test("should prevent guardian from accessing student routes", async ({ page }) => {
    const timestamp = Date.now();
    const email = `guardian-${timestamp}@example.com`;
    const password = "GuardianPass123!";

    await registerAs(page, "guardian", { name: `Guardian ${timestamp}`, email, password });

    await page.goto(`${BASE_URL}/student/dashboard`);

    // Guardian is redirected: /student/dashboard → / → /guardian/dashboard
    await page.waitForURL(`${BASE_URL}/guardian/dashboard`, { timeout: 10000 });

    console.log("✅ Role-based access control working");
  });
});
