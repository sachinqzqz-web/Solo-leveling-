import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export default async function handler(req, res) {
  let browser;

  try {
    const targetUrl =
      req.query.url || "https://example.com";

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    });

    const page = await browser.newPage();

    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const title = await page.title();

    return res.status(200).json({
      ok: true,
      title,
      url: page.url(),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || String(error),
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
