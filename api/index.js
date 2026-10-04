import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export default async function handler(req, res) {
  let browser;

  try {
    const path = req.url || "/";
    const movie = decodeURIComponent(
      path.replace(/^\/+|\/+$/g, "")
    )
      .replace(/[-_]+/g, " ")
      .trim();

    // =========================
    // HOME
    // =========================

    if (!movie) {
      return res.status(200).json({
        ok: true,
        service: "AnimePlex Vercel Browser API",
        status: "running"
      });
    }

    // =========================
    // LAUNCH BROWSER
    // =========================

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ],
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: {
        width: 1280,
        height: 720
      }
    });

    const page = await browser.newPage();

    // =========================
    // SEARCH
    // =========================

    await page.goto(
      "https://new1.hdhub4u.free/search.html",
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    const searchBox = await page.$(
      'input[placeholder*="Search"]'
    );

    if (!searchBox) {
      return res.status(404).json({
        ok: false,
        movie,
        error: "Search box not found"
      });
    }

    await searchBox.fill(movie);

    const buttons = await page.$$("button");

    if (!buttons.length) {
      return res.status(404).json({
        ok: false,
        movie,
        error: "Search button not found"
      });
    }

    await buttons[0].click();

    await new Promise(resolve =>
      setTimeout(resolve, 1500)
    );

    // =========================
    // RESULTS
    // =========================

    const results = await page.evaluate(() => {
      return [...document.querySelectorAll("a")]
        .map(a => ({
          title: (a.innerText || "").trim(),
          url: a.href
        }))
        .filter(x => x.title && x.url);
    });

    // =========================
    // MATCH RESULT
    // =========================

    const wanted = movie.toLowerCase();

    const words = wanted
      .split(/\s+/)
      .filter(Boolean);

    let matched = results.find(item =>
      item.title
        .toLowerCase()
        .includes(wanted)
    );

    if (!matched) {
      matched = results.find(item => {
        const title = item.title.toLowerCase();

        return words.every(word =>
          title.includes(word)
        );
      });
    }

    if (!matched) {
      return res.status(404).json({
        ok: false,
        movie,
        error: "Matching result not found",
        results
      });
    }

    // =========================
    // OPEN RESULT
    // =========================

    await page.goto(matched.url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await new Promise(resolve =>
      setTimeout(resolve, 1500)
    );

    // =========================
    // EXISTING PAGES
    // =========================

    const pagesBefore =
      await browser.pages();

    // =========================
    // CLICK 720P
    // =========================

    const clicked720p =
      await page.evaluate(() => {
        const elements = [
          ...document.querySelectorAll("a, button")
        ];

        const target = elements.find(el => {
          const text = (
            el.innerText ||
            el.textContent ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim();

          return /^720p\b/i.test(text);
        });

        if (!target) {
          return false;
        }

        target.click();
        return true;
      });

    if (!clicked720p) {
      return res.status(404).json({
        ok: false,
        movie,
        result: matched,
        error: "720p option not found"
      });
    }

    // =========================
    // WAIT FOR NEW PAGE
    // =========================

    await new Promise(resolve =>
      setTimeout(resolve, 3000)
    );

    const pagesAfter =
      await browser.pages();

    const newPages =
      pagesAfter.filter(
        p => !pagesBefore.includes(p)
      );

    let activePage = page;

    if (newPages.length) {
      activePage =
        newPages[newPages.length - 1];

      await new Promise(resolve =>
        setTimeout(resolve, 1500)
      );
    }

    // =========================
    // PAGE STATE
    // =========================

    const state =
      await activePage.evaluate(() => {
        const options = [
          ...document.querySelectorAll(
            "a, button"
          )
        ]
          .map(el => ({
            tag: el.tagName,
            text: (
              el.innerText ||
              el.textContent ||
              ""
            )
              .replace(/\s+/g, " ")
              .trim()
          }))
          .filter(x => x.text)
          .slice(0, 100);

        return {
          url: location.href,
          title: document.title,
          options
        };
      });

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      ok: true,

      movie,

      result: {
        title: matched.title,
        url: matched.url
      },

      flow: {
        search: true,
        resultFound: true,
        quality: "720p",
        clicked720p: true,
        newPageOpened: newPages.length > 0
      },

      page: state
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || String(error)
    });

  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
}