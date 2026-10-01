import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // HOME
    // =========================
    if (url.pathname === "/") {
      return Response.json({
        ok: true,
        service: "AnimePlex Browser Worker",
        status: "running"
      });
    }

    // =========================
    // TEST BROWSER
    // =========================
    if (url.pathname === "/test-browser") {
      let browser;

      try {
        browser = await puppeteer.launch(env.BROWSER);

        const page = await browser.newPage();

        await page.goto("https://example.com", {
          waitUntil: "domcontentloaded"
        });

        const title = await page.title();
        const currentUrl = page.url();

        return Response.json({
          ok: true,
          browser: "running",
          title,
          url: currentUrl
        });

      } catch (error) {
        return Response.json({
          ok: false,
          error: error.message
        }, { status: 500 });

      } finally {
        if (browser) {
          try {
            await browser.close();
          } catch {}
        }
      }
    }

    // =========================
    // MOVIE NAME
    // Example: /Toxic
    // =========================
    if (
      url.pathname !== "/" &&
      url.pathname !== "/test-browser"
    ) {
      let browser;

      try {
        const movie = decodeURIComponent(
          url.pathname
            .replace(/^\/+|\/+$/g, "")
        )
          .replace(/[-_]+/g, " ")
          .trim();

        if (!movie) {
          return Response.json({
            ok: false,
            error: "Movie name missing"
          }, { status: 400 });
        }

        browser = await puppeteer.launch(env.BROWSER);

        const page = await browser.newPage();

        // =========================
        // SEARCH
        // =========================

        await page.goto(
          "https://new1.hdhub4u.free/search.html",
          {
            waitUntil: "domcontentloaded"
          }
        );

        const searchBox = await page.locator(
          'input[placeholder*="Search"]'
        );

        await searchBox.fill(movie);

        await page.locator("button").click();

        await new Promise(resolve =>
          setTimeout(resolve, 1500)
        );

        // =========================
        // RESULTS
        // =========================

        const results = await page.evaluate(() => {
          return [
            ...document.querySelectorAll("a")
          ]
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
            const title =
              item.title.toLowerCase();

            return words.every(word =>
              title.includes(word)
            );
          });
        }

        if (!matched) {
          return Response.json({
            ok: false,
            movie,
            error: "Matching result not found",
            results
          }, { status: 404 });
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
        // SAVE OLD PAGES
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
          return Response.json({
            ok: false,
            movie,
            result: matched,
            error: "720p option not found"
          }, { status: 404 });
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

        if (newPages.length > 0) {
          activePage =
            newPages[newPages.length - 1];

          await new Promise(resolve =>
            setTimeout(resolve, 1500)
          );
        }

        // =========================
       // =========================
// AFTER 720P CLICK
// FIND HUBCLOUD SERVER
// =========================

await new Promise(resolve =>
  setTimeout(resolve, 2000)
);

let hubPage = activePage;

// Agar new page nahi mili, current page hi use hoga
const clickedHubCloud = await hubPage.evaluate(() => {
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

    return /HubCloud\s*Server/i.test(text);
  });

  if (!target) {
    return false;
  }

  target.click();

  return true;
});

if (!clickedHubCloud) {
  return Response.json({
    ok: false,
    movie,
    error: "HubCloud Server option not found"
  }, { status: 404 });
}

// New tab/page/navigation ke liye wait
await new Promise(resolve =>
  setTimeout(resolve, 3000)
);

const pagesAfterHub =
  await browser.pages();

const hubNewPages =
  pagesAfterHub.filter(
    p => !pagesAfter.includes(p)
  );

let finalPage = hubPage;

if (hubNewPages.length > 0) {
  finalPage =
    hubNewPages[hubNewPages.length - 1];

  await new Promise(resolve =>
    setTimeout(resolve, 1500)
  );
}
// =========================
// CLICK GENERATE LINK
// TEST ONLY
// =========================

const pagesBeforeGenerate =
  await browser.pages();

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

      return /Generate Direct Download Link/i.test(text);
    });

    if (!target) {
      return false;
    }

    target.click();

    return true;
  });

if (!clickedGenerate) {
  return Response.json({
    ok: false,
    movie,
    error: "Generate Direct Download Link option not found"
  }, { status: 404 });
}

// Wait for navigation / new tab
await new Promise(resolve =>
  setTimeout(resolve, 3000)
);

const pagesAfterGenerate =
  await browser.pages();

const generateNewPages =
  pagesAfterGenerate.filter(
    p => !pagesBeforeGenerate.includes(p)
  );

let generatePage = finalPage;

if (generateNewPages.length > 0) {
  generatePage =
    generateNewPages[generateNewPages.length - 1];

  await new Promise(resolve =>
    setTimeout(resolve, 1500)
  );
}

//// =========================
// PRIORITY CHECK
// FSLv2 → FSL → 10Gbps
// =========================

const priorityState = await generatePage.evaluate(() => {

  const elements = [
    ...document.querySelectorAll("a, button")
  ];

  const findOption = (pattern) => {
    const target = elements.find(el => {
      const text = (
        el.innerText ||
        el.textContent ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim();

      return pattern.test(text);
    });

    if (!target) {
      return null;
    }

    return {
      tag: target.tagName,
      text: (
        target.innerText ||
        target.textContent ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim()
    };
  };

  const fslv2 = findOption(
    /Download\s*\[FSLv2 Server\]/i
  );

  const fsl = findOption(
    /Download\s*\[FSL Server\]/i
  );

  const server10gbps = findOption(
    /Download\s*\[Server\s*:\s*10Gbps\]/i
  );

  let selected = null;

  if (fslv2) {
    selected = "FSLv2";
  } else if (fsl) {
    selected = "FSL";
  } else if (server10gbps) {
    selected = "10Gbps";
  }

  return {
    selected,
    available: {
      FSLv2: !!fslv2,
      FSL: !!fsl,
      "10Gbps": !!server10gbps
    }
  };
});
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

        return Response.json({
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
         priority: priorityState,
          page: state
        });

      } catch (error) {

        return Response.json({
          ok: false,
          error: error.message
        }, { status: 500 });

      } finally {

        if (browser) {
          try {
            await browser.close();
          } catch {}
        }
      }
    }

    // =========================
    // 404
    // =========================

    return Response.json({
      ok: false,
      error: "Endpoint not found"
    }, { status: 404 });
  }
};