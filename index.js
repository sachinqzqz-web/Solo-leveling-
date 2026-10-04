import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {
  let browser;

  try {
    // =========================
    // MOVIE NAME
    // /Toxic
    // =========================

    const requestUrl = new URL(
      req.url,
      `https://${req.headers.host || "localhost"}`
    );

    const movie = decodeURIComponent(
      requestUrl.pathname
        .replace(/^\/+|\/+$/g, "")
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
    // LAUNCH CHROMIUM
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
    // SEARCH PAGE
    // =========================

    await page.goto(
      "https://new1.hdhub4u.free/search.html",
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    // =========================
    // SEARCH BOX
    // =========================

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

    await searchBox.type(movie);

    // =========================
    // SEARCH BUTTON
    // =========================

    const searchButton = await page.$("button");

    if (!searchButton) {
      return res.status(404).json({
        ok: false,
        movie,
        error: "Search button not found"
      });
    }

    await searchButton.click();

    await new Promise(resolve =>
      setTimeout(resolve, 1500)
    );

    // =========================
    // GET RESULTS
    // =========================

    const results = await page.evaluate(() => {
      return [...document.querySelectorAll("a")]
        .map(a => ({
          title: (a.innerText || "").trim(),
          url: a.href
        }))
        .filter(item =>
          item.title &&
          item.url
        );
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
        const title =
          item.title.toLowerCase();

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

    await page.goto(
      matched.url,
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    await new Promise(resolve =>
      setTimeout(resolve, 1500)
    );

    // =========================
    // SAVE CURRENT PAGES
    // =========================

    const pagesBefore =
      await browser.pages();

    // =========================
    // CLICK 720P
    // =========================

    const clicked720p =
      await page.evaluate(() => {

        const elements = [
          ...document.querySelectorAll(
            "a, button"
          )
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
    // WAIT
    // =========================

    await new Promise(resolve =>
      setTimeout(resolve, 3000)
    );

    // =========================
    // CHECK NEW PAGE
    // =========================

    const pagesAfter =
      await browser.pages();

    const newPages =
      pagesAfter.filter(
        p => !pagesBefore.includes(p)
      );

    let activePage = page;

    if (newPages.length > 0) {
      activePage =
        newPages[newPages.length - 1];

      await new Promise(resolve =>
        setTimeout(resolve, 1500)
      );
    }

    // =========================
// AFTER 720P
// FIND AUTHORIZED SERVER
// =========================

await new Promise(resolve =>
  setTimeout(resolve, 2000)
);

let serverPage = activePage;

const clickedServer = await serverPage.evaluate(() => {
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

    // Apne authorized server button ka text yahan rakho
    return /Your Server/i.test(text);
  });

  if (!target) {
    return false;
  }

  target.click();
  return true;
});

if (!clickedServer) {
  return res.status(404).json({
    ok: false,
    movie,
    error: "Authorized server option not found"
  });
}

// =========================
// WAIT FOR SERVER PAGE
// =========================

await new Promise(resolve =>
  setTimeout(resolve, 3000)
);

const pagesAfterServer =
  await browser.pages();

const serverNewPages =
  pagesAfterServer.filter(
    p => !pagesAfter.includes(p)
  );

let finalPage = serverPage;

if (serverNewPages.length > 0) {
  finalPage =
    serverNewPages[serverNewPages.length - 1];

  await new Promise(resolve =>
    setTimeout(resolve, 1500)
  );
}

// =========================
// GENERATE
// =========================

const clickedGenerate =
  await finalPage.evaluate(() => {

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

      return /Generate/i.test(text);
    });

    if (!target) {
      return false;
    }

    target.click();
    return true;
  });

if (!clickedGenerate) {
  return res.status(404).json({
    ok: false,
    movie,
    error: "Generate option not found"
  });
}

// =========================
// WAIT AFTER GENERATE
// =========================

await new Promise(resolve =>
  setTimeout(resolve, 3000)
);

const pagesAfterGenerate =
  await browser.pages();

const generateNewPages =
  pagesAfterGenerate.filter(
    p => !pagesAfterServer.includes(p)
  );

let generatePage = finalPage;

if (generateNewPages.length > 0) {
  generatePage =
    generateNewPages[generateNewPages.length - 1];

  await new Promise(resolve =>
    setTimeout(resolve, 1500)
  );
}

// =========================
// FINAL PAGE STATE
// =========================

const finalState =
  await generatePage.evaluate(() => {

    const elements = [
      ...document.querySelectorAll("a, button")
    ];

    return {
      url: location.href,
      title: document.title,

      options: elements
        .map(el => ({
          tag: el.tagName,
          text: (
            el.innerText ||
            el.textContent ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim(),
          href:
            el.tagName === "A"
              ? el.href || null
              : null
        }))
        .filter(x => x.text)
        .slice(0, 100)
    };
  });// =========================
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
          .filter(item =>
            item.text
          )
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
        newPageOpened:
          newPages.length > 0
      },

      page: state
    });

  } catch (error) {

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        String(error)
    });

  } finally {

    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
}