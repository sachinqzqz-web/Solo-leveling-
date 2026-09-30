import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // HEALTH CHECK
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

        await page.close();

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
    // TEST PAGE
    // =========================
    if (url.pathname === "/test-page") {
      let browser;

      try {
        browser = await puppeteer.launch(env.BROWSER);

        const page = await browser.newPage();

        await page.goto("https://example.com", {
          waitUntil: "domcontentloaded"
        });

        const data = await page.evaluate(() => ({
          heading: document.querySelector("h1")?.innerText || null,

          links: [...document.querySelectorAll("a")].map(a => ({
            text: a.innerText.trim(),
            href: a.href
          }))
        }));

        await page.close();

        return Response.json({
          ok: true,
          data
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
    // SEARCH
    // =========================
    if (url.pathname === "/search") {
      let browser;

      try {
        const query = url.searchParams.get("q");

        if (!query) {
          return Response.json({
            ok: false,
            error: "Missing q parameter"
          }, { status: 400 });
        }

        browser = await puppeteer.launch(env.BROWSER);

        const page = await browser.newPage();

        await page.goto("https://new1.hdhub4u.free/search.html", {
          waitUntil: "domcontentloaded"
        });

        const searchBox = await page.locator(
          'input[placeholder*="Search"]'
        );

        await searchBox.fill(query);

        await page.locator("button").click();

        await new Promise(resolve => setTimeout(resolve, 1500));

        const results = await page.evaluate(() => {
          return [...document.querySelectorAll("a")]
            .map(a => ({
              title: (a.innerText || "").trim(),
              url: a.href
            }))
            .filter(x => x.title && x.url);
        });

        await page.close();

        return Response.json({
          ok: true,
          query,
          results
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

      // =========================
      // 2. FIND MATCHING MOVIE
      // =========================

      const tokens = movieTokens(movie);

      const results = await searchPage.evaluate(() => {
        return [...document.querySelectorAll("a")]
          .map(a => ({
            title: (a.innerText || a.textContent || "")
              .replace(/\s+/g, " ")
              .trim(),

            url: a.href
          }))
          .filter(x => x.title && x.url);
      });

      let matched = null;

      let bestScore = -1;

      for (const result of results) {
        const title = normalize(result.title);

        let score = 0;

        for (const token of tokens) {
          if (title.includes(token)) {
            score++;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          matched = result;
        }
      }

      if (!matched || bestScore <= 0) {
        throw new Error(
          `Movie not found: ${movie}`
        );
      }

      // =========================
      // 3. OPEN MOVIE
      // =========================

      await searchPage.goto(matched.url, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      await sleep(1500);

      // =========================
      // 4. CLICK 720P
      // =========================

      const pagesBefore720 = await browser.pages();

      const clicked720 = await clickText(
        searchPage,
        /^720p\b/
      );

      if (!clicked720) {
        throw new Error(
          "720p option not found"
        );
      }

      await sleep(3000);

      const pagesAfter720 = await browser.pages();

      let currentPage = searchPage;

      const newPages720 = pagesAfter720.filter(
        p => !pagesBefore720.includes(p)
      );

      if (newPages720.length) {
        currentPage =
          newPages720[newPages720.length - 1];
      }

      // =========================
      // 5. FIND HUBCLOUD PAGE
      // =========================

      await sleep(2000);

      let hubPage = await findPageContaining(
        browser,
        /HubCloud\s*Server/i
      );

      if (!hubPage) {
        hubPage = currentPage;
      }

      // =========================
      // 6. CLICK HUBCLOUD SERVER
      // =========================

      const clickedHubCloud = await clickText(
        hubPage,
        /HubCloud\s*Server/i
      );

      if (!clickedHubCloud) {
        throw new Error(
          "HubCloud Server option not found"
        );
      }

      await sleep(2000);

      // =========================
      // 7. FIND GENERATE PAGE
      // =========================

      let generatePage = await findPageContaining(
        browser,
        /Generate\s*Direct\s*Download\s*Link/i
      );

      if (!generatePage) {
        generatePage = hubPage;
      }

      // =========================
      // 8. CLICK GENERATE
      // =========================

      const clickedGenerate = await clickText(
        generatePage,
        /Generate\s*Direct\s*Download\s*Link/i
      );

      if (!clickedGenerate) {
        throw new Error(
          "Generate Direct Download Link button not found"
        );
      }

      await sleep(2500);

      // =========================
      // 9. DETECT SERVER OPTIONS
      // =========================

      const optionPage =
        await findPageContaining(
          browser,
          /Download\s*\[(?:FSLv2|FSL|Server\s*:\s*10Gbps)/i
        ) || generatePage;

      const options = await optionPage.evaluate(() => {
        const elements = [
          ...document.querySelectorAll(
            "a, button"
          )
        ];

        return elements
          .map(el => ({
            text: (
              el.innerText ||
              el.textContent ||
              ""
            )
              .replace(/\s+/g, " ")
              .trim()
          }))
          .filter(x => x.text);
      });

      const hasFSLv2 = options.some(x =>
        /^Download\s*\[\s*FSLv2\s*Server\s*\]$/i
          .test(x.text)
      );

      const hasFSL = options.some(x =>
        /^Download\s*\[\s*FSL\s*Server\s*\]$/i
          .test(x.text)
      );

      const has10Gbps = options.some(x =>
        /^Download\s*\[\s*Server\s*:\s*10Gbps\s*\]$/i
          .test(x.text)
      );

      // =========================
      // 10Gbps FALLBACK
      // =========================

      let selectedServer = null;
      let downloadHereFound = false;

      if (hasFSLv2) {
        selectedServer = "FSLv2";
      } else if (hasFSL) {
        selectedServer = "FSL";
      } else if (has10Gbps) {
        selectedServer = "10Gbps";

        const clicked10Gbps = await clickText(
          optionPage,
          /^Download\s*\[\s*Server\s*:\s*10Gbps\s*\]$/
        );

        if (clicked10Gbps) {
          await sleep(2000);

          const downloadPage =
            await findPageContaining(
              browser,
              /^Download\s*Here$/im
            );

          if (downloadPage) {
            const bodyText =
              await downloadPage.evaluate(
                () => document.body?.innerText || ""
              );

            downloadHereFound =
              /Download\s*Here/i.test(bodyText);
          }
        }
      }

      // =========================
      // RESULT
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
          quality: "720p",
          hubCloudServer: clickedHubCloud,
          generateDirectDownloadLink:
            clickedGenerate
        },

        servers: {
          fslv2: hasFSLv2,
          fsl: hasFSL,
          server10Gbps: has10Gbps
        },

        selectedServer,

        downloadHereFound,

        page: {
          url: optionPage.url(),
          title: await optionPage.title()
        }
      });

    } catch (error) {

      return Response.json({
        ok: false,
        error: error.message,
        movie: movie || null
      }, { status: 500 });

    } finally {

      if (browser) {
        try {
          await browser.close();
        } catch {}
      }

    }
  }
};