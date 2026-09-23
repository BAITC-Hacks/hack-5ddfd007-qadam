import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
const artifacts = "artifacts";
test.beforeAll(() => mkdirSync(artifacts, { recursive: true }));
test("desktop: all six scenarios, stable IDs, calendar changes and offline labels", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  const cards = page.getByTestId("contractor-card");
  const ids = () =>
    cards.evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-contractor-id")),
    );
  const preset = async (name: string) => {
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/recommend") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name, exact: true }).click();
    expect((await response).status()).toBe(200);
    await expect(
      page.getByRole("button", { name: "Подобрать подрядчиков", exact: true }),
    ).toBeEnabled();
  };
  await expect(
    page.getByRole("heading", { name: /Ваше событие.*Подходящие люди/ }),
  ).toBeVisible();
  await expect(cards).toHaveCount(3);
  const denseIds = await ids();
  for (const id of denseIds)
    expect(["HK-88430", "HK-77838", "HK-27222", "HK-29829"]).toContain(id);
  await expect(
    page.getByText("Объяснение по правилам", { exact: true }),
  ).toHaveCount(3);
  await page.screenshot({
    path: `${artifacts}/desktop-dense.png`,
    fullPage: true,
  });
  await preset("Много вариантов ↗");
  expect(await ids()).toEqual(denseIds);
  await preset("Редкая категория ↗");
  await expect(cards).toHaveCount(1);
  expect(await ids()).toEqual(["HK-39372"]);
  await expect(
    page.getByText(
      "На 2026-10-05 исключено по календарю: 1 из 2 профилей города и категории.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Цена восстановлена", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `${artifacts}/desktop-sparse.png`,
    fullPage: true,
  });
  await preset("Нет результата ↗");
  await expect(cards).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /Категории пока нет/ }),
  ).toBeVisible();
  await page.screenshot({
    path: `${artifacts}/desktop-empty.png`,
    fullPage: true,
  });
  await preset("Пример: занятый банкетный зал");
  await expect(cards).toHaveCount(0);
  await expect(
    page.getByText(
      "На 2026-11-14 исключено по календарю: 1 из 1 профилей города и категории.",
    ),
  ).toBeVisible();
  await preset("Проверить 10 октября →");
  expect((await ids()).sort()).toEqual(
    ["HK-30583", "HK-53108", "HK-16628"].sort(),
  );
  await preset("Проверить 11 октября →");
  expect((await ids()).sort()).toEqual(["HK-76268", "HK-68220"].sort());
  await page.screenshot({
    path: `${artifacts}/desktop-date-change.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
  console.log("Browser dense IDs:", denseIds);
});
test("mobile: responsive form, client validation, network retry and no overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByLabel("Город", { exact: true })).toBeVisible();
  await page.getByLabel("Дата мероприятия").fill("2027-01-01");
  await expect(
    page.getByText("Дата должна быть между 2026-09-23 и 2026-12-31", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Дата мероприятия").fill("2026-10-10");
  await page.route("**/api/recommend", (route) => route.abort("failed"));
  await page
    .getByRole("button", { name: "Подобрать подрядчиков", exact: true })
    .click();
  await expect(page.locator('.network-error[role="alert"]')).toContainText(
    "Нет связи с сервером",
  );
  await page.unroute("**/api/recommend");
  await page.getByRole("button", { name: "Повторить запрос" }).click();
  await expect(page.locator('.network-error[role="alert"]')).toHaveCount(0);
  await expect(page.getByTestId("contractor-card")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `${artifacts}/mobile-dense.png`,
    fullPage: true,
  });
});
test("HTTP: server validation and raw dataset remains inaccessible", async ({
  request,
}) => {
  const invalid = await request.post("/api/recommend", {
    data: {
      city: "Алматы",
      eventDate: "2027-01-01",
      eventFormat: "корпоратив",
      category: "Ведущий",
      budgetKzt: 1200000,
    },
  });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).error.fields.eventDate).toBeTruthy();
  for (const path of [
    "/hackathon%20dataset%20anonymized.csv",
    "/data/hackathon-dataset-anonymized.csv",
    "/.env.local",
  ])
    expect((await request.get(path)).status()).toBe(404);
});
test("accessibility: desktop and mobile have no automated WCAG A/AA violations", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      report.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
});
