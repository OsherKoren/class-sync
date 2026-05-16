import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Student Registration Flow", () => {
  test("should register a student with email/password", async ({ page }) => {
    // Navigate to register page
    await page.goto(`${BASE_URL}/register`);

    // Verify page loads with student toggle
    await expect(page.getByRole("heading", { name: /Create account/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Parent/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Student/i })).toBeVisible();

    // Click Student toggle
    await page.getByRole("button", { name: /Student/i }).click();

    // Verify description changed
    const description = page.locator("text=Sign up to manage your tutoring schedule");
    await expect(description).toBeVisible({ timeout: 5000 });

    // Fill registration form using labels
    const timestamp = Date.now();
    const email = `student-${timestamp}@example.com`;
    const fullName = `Test Student ${timestamp}`;

    await page.getByLabel(/Full name/i).fill(fullName);
    await page.getByLabel(/Email/i).first().fill(email);
    await page.getByLabel(/^Password/i).fill("TestPass123!");
    await page.getByLabel(/Confirm password/i).fill("TestPass123!");

    // Submit form by clicking the button with role
    await page.getByRole("button", { name: /Create account/i }).click();

    // Wait for redirect to student dashboard
    await page.waitForURL(`${BASE_URL}/student/dashboard`, { timeout: 15000 });

    // Verify student dashboard loaded
    await expect(page.getByRole("heading", { name: /My Classes/i })).toBeVisible();
    await expect(page.getByText(new RegExp(`Welcome, ${fullName}`))).toBeVisible();
    await expect(page.getByRole("button", { name: /Find classes/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign out/i })).toBeVisible();

    // Verify empty state message
    await expect(
      page.getByText("You haven't enrolled in any classes yet.")
    ).toBeVisible();

    console.log(`✅ Student registered successfully: ${email}`);
  });

  test("should block unauthorized access to student routes", async ({
    page,
  }) => {
    // Try to access student dashboard without logging in
    await page.goto(`${BASE_URL}/student/dashboard`);

    // Should redirect to login
    await page.waitForURL(`${BASE_URL}/login`);
    await expect(page.getByRole("heading", { name: /ClassSync/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();

    console.log("✅ Unauthorized access blocked correctly");
  });

  test("should login as student and redirect to student dashboard", async ({
    page,
  }) => {
    // First register a student
    const timestamp = Date.now();
    const email = `login-student-${timestamp}@example.com`;
    const password = "LoginPass123!";
    const fullName = `Login Test ${timestamp}`;

    await page.goto(`${BASE_URL}/register`);
    await page.getByRole("button", { name: /Student/i }).click();
    await page.getByLabel(/Full name/i).fill(fullName);
    await page.getByLabel(/Email/i).first().fill(email);
    await page.getByLabel(/^Password/i).fill(password);
    await page.getByLabel(/Confirm password/i).fill(password);
    await page.getByRole("button", { name: /Create account/i }).click();
    await page.waitForURL(`${BASE_URL}/student/dashboard`, { timeout: 15000 });

    // Sign out
    await page.getByRole("button", { name: /Sign out/i }).click();
    await page.waitForURL(`${BASE_URL}/login`);

    // Log back in
    await page.getByLabel(/Email/i).first().fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByRole("button", { name: /Sign in/i }).click();

    // Should redirect to student dashboard (not family dashboard)
    await page.waitForURL(`${BASE_URL}/student/dashboard`, { timeout: 15000 });
    await expect(page.getByText(new RegExp(`Welcome, ${fullName}`))).toBeVisible();

    console.log(`✅ Student login successful: ${email}`);
  });

  test("should prevent different role from accessing student routes", async ({
    page,
  }) => {
    // Register as parent
    const timestamp = Date.now();
    const parentEmail = `parent-${timestamp}@example.com`;
    const password = "ParentPass123!";

    await page.goto(`${BASE_URL}/register`);
    // Parent is default
    await page.getByLabel(/Full name/i).fill(`Parent ${timestamp}`);
    await page.getByLabel(/Email/i).first().fill(parentEmail);
    await page.getByLabel(/^Password/i).fill(password);
    await page.getByLabel(/Confirm password/i).fill(password);
    await page.getByRole("button", { name: /Create account/i }).click();

    // Should redirect to family dashboard
    await page.waitForURL(`${BASE_URL}/family/dashboard`, { timeout: 15000 });

    // Try to access student dashboard
    await page.goto(`${BASE_URL}/student/dashboard`);

    // Should redirect to login (unauthorized)
    await page.waitForURL(`${BASE_URL}/login`);
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();

    console.log("✅ Role-based access control working");
  });
});
