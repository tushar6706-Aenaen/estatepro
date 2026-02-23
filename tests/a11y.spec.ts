import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type ScanOptions = {
  exclude?: string[];
  waitMs?: number;
};

async function waitForPageSettle(page: Page, waitMs = 700) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(waitMs);
}

async function expectNoAxeViolations(
  page: Page,
  label: string,
  options: ScanOptions = {},
) {
  await waitForPageSettle(page, options.waitMs);

  let builder = new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    // Decorative/interactive map internals often need component-specific tuning.
    .exclude(".leaflet-container");

  for (const selector of options.exclude ?? []) {
    builder = builder.exclude(selector);
  }

  const results = await builder.analyze();

  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.length,
    help: violation.help,
    targets: violation.nodes
      .slice(0, 3)
      .map((node) => node.target.join(" > ")),
  }));

  expect(summary, `${label} has axe violations`).toEqual([]);
}

async function maybeOpenFirstInternalLink(
  page: Page,
  selector: string,
) {
  const link = page.locator(selector).first();
  if ((await link.count()) === 0) {
    return false;
  }

  const href = await link.getAttribute("href");
  if (!href) {
    return false;
  }

  await page.goto(href);
  return true;
}

test.describe("Accessibility smoke checks", () => {
  test("scans redesigned public and fallback states", async ({ page }) => {
    await page.goto("/");
    await expectNoAxeViolations(page, "home page", {
      // Property card internals are legacy/interactive-heavy; baseline checks the redesigned shell.
      exclude: ["#listings"],
    });

    await page.goto("/auth");
    await expectNoAxeViolations(page, "auth page");

    await page.goto("/onboarding");
    await expectNoAxeViolations(page, "onboarding page");

    await page.goto("/profile");
    await expectNoAxeViolations(page, "profile page");

    await page.goto("/chats");
    await expectNoAxeViolations(page, "chat list page");
  });

  test("scans property detail page when a listing is available", async ({ page }) => {
    await page.goto("/");
    await waitForPageSettle(page, 1000);

    const opened = await maybeOpenFirstInternalLink(page, 'a[href^="/properties/"]');
    test.skip(!opened, "No property links available on the homepage to scan.");

    await expectNoAxeViolations(page, "property detail page");
  });

  test("scans chat thread page when an authenticated chat link is available", async ({ page }) => {
    await page.goto("/chats");
    await waitForPageSettle(page, 1000);

    const opened = await maybeOpenFirstInternalLink(page, 'a[href^="/chats/"]');
    test.skip(!opened, "No chat thread links available (likely unauthenticated state).");

    await expectNoAxeViolations(page, "chat thread page");
  });
});
