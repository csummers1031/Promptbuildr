import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "/tmp/claude-0/-home-user-Promptbuildr/6f0636c5-fec1-57d6-be33-6355f25b620e/scratchpad";

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});

async function shoot(name, viewport, fn) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await fn(page);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`saved ${name}.png`);
  await ctx.close();
}

// 1. Homepage — desktop
await shoot("01-home-desktop", { width: 1100, height: 900 }, async (page) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
});

// 2. Homepage — mobile
await shoot("02-home-mobile", { width: 390, height: 844 }, async (page) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
});

// 3. A generated business result (agent/automation -> shows CTA + tools)
await shoot("03-result-business", { width: 1100, height: 1400 }, async (page) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.fill("#task", "Build an agent that triages inbound support tickets by urgency and routes them to the right team");
  await page.selectOption("#role", "Founder/CEO");
  await page.selectOption("#aiTool", "Claude");
  await page.selectOption("#outputType", "Agent/Workflow");
  await page.click('button[type="submit"]');
  await page.waitForSelector("pre", { timeout: 60000 });
  await page.waitForTimeout(500);
});

// 4. A personal result (clean, no tools/CTA)
await shoot("04-result-personal", { width: 1100, height: 1400 }, async (page) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.fill("#task", "Plan a 7-day Italy trip on a budget for two people in October");
  await page.selectOption("#role", "Personal Use");
  await page.selectOption("#aiTool", "ChatGPT");
  await page.selectOption("#outputType", "Strategy/Plan");
  await page.click('button[type="submit"]');
  await page.waitForSelector("pre", { timeout: 60000 });
  await page.waitForTimeout(500);
});

await browser.close();
console.log("done");
