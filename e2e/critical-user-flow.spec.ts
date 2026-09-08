import { expect, test } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("critical Snapgram user flow", () => {
  test.skip(
    !email || !password,
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run the Appwrite-backed flow."
  );

  test("login, create post, like, save, and logout", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByPlaceholder("you@example.com").fill(email || "");
    await page.getByPlaceholder("Enter your password").fill(password || "");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByRole("heading", { name: "Home Feed" })).toBeVisible();

    await page.getByRole("link", { name: /Create/i }).first().click();
    await expect(page.getByRole("heading", { name: "Create Post" })).toBeVisible();

    await page
      .locator('input[type="file"]')
      .setInputFiles({
        name: "snapgram-e2e.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
          "base64"
        ),
      });
    await page
      .getByPlaceholder("Share what made this moment worth posting.")
      .fill(`E2E post ${Date.now()}`);
    await page.getByPlaceholder("Ahmedabad, India").fill("Test City");
    await page.getByPlaceholder("Art, Travel, Weekend").fill("e2e,test");
    await page.getByRole("button", { name: "Create Post" }).click();

    await expect(page.getByRole("heading", { name: "Home Feed" })).toBeVisible();

    const firstPost = page.locator(".post-card").first();
    await firstPost.getByRole("button", { name: /like post/i }).click();
    await firstPost.getByRole("button", { name: /save post/i }).click();

    await page.locator('button:has(img[alt="logout"])').first().click();
    await expect(page.getByRole("heading", { name: "Log in to Snapgram" })).toBeVisible();
  });
});
