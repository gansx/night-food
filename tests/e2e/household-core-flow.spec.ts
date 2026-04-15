import { expect, test, type Page } from "@playwright/test";

const webBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const adminBaseUrl = process.env.PLAYWRIGHT_ADMIN_BASE_URL;
const hasLiveTargets = Boolean(webBaseUrl && adminBaseUrl);

function url(baseUrl: string, path: string) {
  return new URL(path, baseUrl).toString();
}

function futureDateTimeLocal(minutesFromNow = 60) {
  const date = new Date(Date.now() + minutesFromNow * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

async function registerAdminOwner(page: Page, input: { username: string; displayName: string; password: string }) {
  await page.goto(url(adminBaseUrl!, "/register"));
  await page.getByTestId("admin-register-username").fill(input.username);
  await page.getByTestId("admin-register-display-name").fill(input.displayName);
  await page.getByTestId("admin-register-password").fill(input.password);
  await Promise.all([
    page.waitForURL(/\/setup\/owner/, { timeout: 45_000 }),
    page.getByTestId("admin-register-submit").click()
  ]);
}

async function createHousehold(page: Page, input: { householdName: string; ownerDisplayName: string }) {
  await page.getByTestId("owner-household-name").fill(input.householdName);
  await page.getByTestId("owner-display-name").fill(input.ownerDisplayName);
  await Promise.all([
    page.waitForURL(/\/members/, { timeout: 45_000 }),
    page.getByTestId("owner-bootstrap-submit").click()
  ]);

  const familyCode = (await page.getByTestId("family-code").innerText()).trim();
  expect(familyCode).toMatch(/^[A-Z0-9]{6,12}$/);
  return familyCode;
}

async function createMenuItem(page: Page, input: { categoryName: string; itemName: string }) {
  await page.goto(url(adminBaseUrl!, "/menu"));
  await page.getByTestId("create-category-name").fill(input.categoryName);
  await page.getByTestId("create-category-submit").click();
  await expect(page.getByTestId("create-menu-item-category")).toBeEnabled({ timeout: 30_000 });
  await page.getByTestId("create-menu-item-category").click();
  await expect(page.getByRole("option", { name: input.categoryName })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("option", { name: input.categoryName }).click();

  await page.getByTestId("create-menu-item-name").fill(input.itemName);
  await page.getByTestId("create-menu-item-description").fill("E2E 家庭点餐回归菜品");
  await page.getByTestId("create-menu-item-price").fill("0");
  await page.getByTestId("create-menu-item-submit").click();
  await expect(page.getByText(input.itemName).first()).toBeVisible({ timeout: 30_000 });
}

async function registerMemberAndJoin(page: Page, input: {
  username: string;
  displayName: string;
  password: string;
  familyCode: string;
}) {
  await page.goto(url(webBaseUrl!, "/register"));
  await page.getByTestId("web-register-username").fill(input.username);
  await page.getByTestId("web-register-display-name").fill(input.displayName);
  await page.getByTestId("web-register-password").fill(input.password);
  await Promise.all([
    page.waitForURL(/\/family/, { timeout: 45_000 }),
    page.getByTestId("web-register-submit").click()
  ]);

  await page.getByTestId("join-family-code").fill(input.familyCode);
  await Promise.all([
    page.waitForURL(url(webBaseUrl!, "/"), { timeout: 45_000 }),
    page.getByTestId("join-household-submit").click()
  ]);
}

async function submitAndCancelOrder(page: Page, itemName: string) {
  await page.goto(url(webBaseUrl!, "/order"));
  const itemCard = page.getByTestId("menu-item-card").filter({ hasText: itemName });
  await expect(itemCard).toBeVisible({ timeout: 30_000 });
  await itemCard.getByTestId("add-menu-item").click();
  const orderResponsePromise = page.waitForResponse(
    (response) => response.url() === url(webBaseUrl!, "/api/orders") && response.request().method() === "POST"
  );
  await Promise.all([orderResponsePromise, page.getByTestId("order-submit").click()]);
  const orderResponse = await orderResponsePromise;
  expect(orderResponse.ok()).toBeTruthy();
  await expect(page.getByTestId("order-message")).toContainText(/成功|鎴愬姛/, { timeout: 30_000 });

  page.once("dialog", (dialog) => dialog.accept());
  await page.goto(url(webBaseUrl!, "/orders"));
  await expect(page.getByTestId("cancel-order-button").first()).toBeVisible({ timeout: 30_000 });
  const cancelResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/orders/") && response.url().endsWith("/cancel")
  );
  await Promise.all([cancelResponsePromise, page.getByTestId("cancel-order-button").first().click()]);
  const cancelResponse = await cancelResponsePromise;
  expect(cancelResponse.ok()).toBeTruthy();
  await expect(page.getByTestId("cancel-order-button")).toHaveCount(0, { timeout: 30_000 });
}

async function createAssignedTask(adminPage: Page, input: { taskTitle: string; memberDisplayName: string }) {
  await adminPage.goto(url(adminBaseUrl!, "/tasks"));
  await adminPage.getByTestId("create-task-title").fill(input.taskTitle);
  await adminPage.getByTestId("create-task-description").fill("E2E 指派任务回归");
  await adminPage.getByTestId("create-task-assignee").click();
  await adminPage.getByRole("option", { name: input.memberDisplayName }).click();
  await adminPage.getByTestId("create-task-reward").fill("3");
  await adminPage.getByTestId("create-task-due-at").fill(futureDateTimeLocal(120));
  await adminPage.getByTestId("create-task-submit").click();
  await expect(adminPage.getByText(input.taskTitle).first()).toBeVisible({ timeout: 30_000 });
}

async function submitAssignedTask(memberPage: Page, taskTitle: string) {
  await memberPage.goto(url(webBaseUrl!, "/tasks"));
  const taskCard = memberPage.locator("article").filter({ hasText: taskTitle }).first();
  await expect(taskCard).toBeVisible({ timeout: 30_000 });
  await taskCard.getByTestId("submit-task-button").click();
  await expect(taskCard.getByTestId("submit-task-button")).toHaveCount(0, { timeout: 30_000 });
}

async function approveTask(adminPage: Page, taskTitle: string) {
  await adminPage.goto(url(adminBaseUrl!, "/tasks?status=submitted"));
  const taskCard = adminPage.locator("article").filter({ hasText: taskTitle }).first();
  await expect(taskCard).toBeVisible({ timeout: 30_000 });
  await taskCard.getByTestId("approve-task-button").click();
  await expect(taskCard.getByTestId("approve-task-button")).toHaveCount(0, { timeout: 30_000 });
}

test.describe("household core flow", () => {
  test.skip(!hasLiveTargets, "Set PLAYWRIGHT_BASE_URL and PLAYWRIGHT_ADMIN_BASE_URL to run the full browser regression.");

  test("owner and member can complete menu, order, cancellation and task workflows", async ({ browser }) => {
    test.setTimeout(300_000);

    const suffix = Date.now().toString(36);
    const password = "test123456";
    const ownerUsername = `owner_${suffix}`.slice(0, 24);
    const memberUsername = `member_${suffix}`.slice(0, 24);
    const ownerDisplayName = `家主${suffix}`;
    const memberDisplayName = `成员${suffix}`;
    const householdName = `回归家庭${suffix}`;
    const categoryName = `回归分类${suffix}`;
    const itemName = `回归菜${suffix}`;
    const taskTitle = `回归任务${suffix}`;

    const adminContext = await browser.newContext();
    const memberContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    const memberPage = await memberContext.newPage();

    await registerAdminOwner(adminPage, { username: ownerUsername, displayName: ownerDisplayName, password });
    const familyCode = await createHousehold(adminPage, { householdName, ownerDisplayName });
    await createMenuItem(adminPage, { categoryName, itemName });

    await registerMemberAndJoin(memberPage, {
      username: memberUsername,
      displayName: memberDisplayName,
      password,
      familyCode
    });

    await submitAndCancelOrder(memberPage, itemName);
    await createAssignedTask(adminPage, { taskTitle, memberDisplayName });
    await submitAssignedTask(memberPage, taskTitle);
    await approveTask(adminPage, taskTitle);

    await memberContext.close();
    await adminContext.close();
  });
});
