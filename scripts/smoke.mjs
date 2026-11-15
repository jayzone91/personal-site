import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

await mkdir("work", { recursive: true });
const base = process.env.PREVIEW_URL || "http://localhost:4173";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const errors = [];
const checks = [];
const monitor = (page) =>
  page.on("pageerror", (error) => errors.push(error.message));

async function inspectJourney(page, prefix) {
  await page.goto(base, { waitUntil: "networkidle" });
  await expect(page.locator(".world-canvas canvas")).toBeVisible();
  await page.waitForTimeout(1500);
  const canvas = await page.locator("canvas").elementHandle();
  for (const [progress, phase] of [
    [0, "arrival"],
    [0.2, "enclosure"],
    [0.46, "workshop"],
    [0.71, "kevin"],
    [0.94, "modules"],
  ]) {
    await page.evaluate((progress) => {
      const journey = document.querySelector(".journey");
      window.scrollTo({
        top:
          journey.offsetTop + (journey.offsetHeight - innerHeight) * progress,
        behavior: "instant",
      });
    }, progress);
    await expect(page.locator(".journey")).toHaveAttribute("data-phase", phase);
    await page.waitForTimeout(400);
    if (!(await canvas.evaluate((node) => node.isConnected)))
      throw Error("Canvas was replaced between chapters");
    await page.screenshot({ path: `work/${prefix}-${phase}.png` });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    if (overflow) throw Error(`Horizontal overflow in ${prefix}/${phase}`);
  }
  checks.push(`${prefix} continuous canvas and five journey phases`);
}

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  monitor(page);
  await inspectJourney(page, "desktop");
  await page.getByRole("button", { name: /Kunden & CRM/ }).click();
  await expect(
    page.getByRole("region", { name: "Moduldetails" }),
  ).toContainText("Kundensuche");
  await page
    .getByRole("button", { name: "↔ Geschäftsbetrieb", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Krümelverwaltung/ }),
  ).toBeVisible();
  checks.push("module selection and breakfast mode");
  await page.getByRole("button", { name: /\/02.*links.nvim/ }).click();
  await expect(
    page.getByRole("link", { name: "Repository ansehen", exact: true }),
  ).toBeVisible();
  const beforeLegal = await page.evaluate(() => scrollY);
  await page
    .locator(".footer-bottom")
    .getByRole("link", { name: "Impressum", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Impressum." })).toBeVisible();
  await page
    .getByRole("link", { name: "Zurück zur Werkstatt", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(beforeLegal - 200);
  checks.push("project expansion and return scroll position");
  for (const [path, heading] of [
    ["/impressum", "Impressum."],
    ["/datenschutz", "Datenschutz."],
    ["/missing", "404."],
  ]) {
    await page.goto(base + path);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page.goto(base + "/#kevin", { waitUntil: "networkidle" });
  await expect(page.locator("#kevin .display")).toBeInViewport();
  checks.push("direct hash, legal routes, reload and 404");
  await page.locator(".journey-tools button").click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator(".journey")).toHaveClass(/quiet-journey/);
  checks.push("visible reduced-motion switch");

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  monitor(mobile);
  await inspectJourney(mobile, "mobile");
  await mobile.getByRole("button", { name: /Lizenzen/ }).click();
  await expect(
    mobile.getByRole("region", { name: "Moduldetails" }),
  ).toContainText("Softwarelizenzen");
  await mobile.emulateMedia({ reducedMotion: "reduce" });
  await mobile.reload({ waitUntil: "networkidle" });
  await expect(mobile.locator("html")).toHaveAttribute(
    "data-motion",
    "reduced",
  );
  await mobile.screenshot({ path: "work/mobile-reduced.png" });
  checks.push("mobile module selection and system reduced motion");

  const fallback = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  monitor(fallback);
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.call(this, type, ...args);
    };
  });
  await fallback.goto(base, { waitUntil: "networkidle" });
  await expect(fallback.locator(".world-fallback")).toBeVisible();
  await fallback.getByRole("link", { name: "Direkt zu KEVIN ↓" }).click();
  await expect(
    fallback.getByRole("button", { name: /Kunden & CRM/ }),
  ).toBeVisible();
  await fallback.screenshot({ path: "work/mobile-fallback.png" });
  checks.push("WebGL fallback and accessible module controls");
  console.log(JSON.stringify({ checks, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
