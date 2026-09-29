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
    // OPEN RESULT
    // =========================
    if (url.pathname === "/open-result") {
      let browser;

      try {
        const target = url.searchParams.get("url");

        if (!target) {
          return Response.json({
            ok: false,
            error: "Missing url parameter"
          }, { status: 400 });
        }

        browser = await puppeteer.launch(env.BROWSER);

        const page = await browser.newPage();

        await page.goto(target, {
          waitUntil: "domcontentloaded",
          timeout: 30000
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        const pageInfo = await page.evaluate(() => {
          const elements = [...document.querySelectorAll("a, button")];

          const matches = elements
            .map(el => ({
              text: (el.innerText || "").trim(),
              tag: el.tagName
            }))
            .filter(x => /^480p\b/i.test(x.text));

          return {
            title: document.title,
            url: location.href,
            has480p: matches.length > 0,
            options: matches
          };
        });

        await page.close();

        return Response.json({
          ok: true,
          ...pageInfo
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
// CHECK NEW PAGE STATE
// =========================
if (url.pathname === "/check-new-page") {
  let browser;

  try {
    const target = url.searchParams.get("url");

    if (!target) {
      return Response.json({
        ok: false,
        error: "Missing url parameter"
      }, { status: 400 });
    }

    browser = await puppeteer.launch(env.BROWSER);

    const page = await browser.newPage();

    await page.goto(target, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    // Page ko thoda time do JS/content load karne ka
    await new Promise(resolve => setTimeout(resolve, 5000));

    const state = await page.evaluate(() => {
      return {
        url: location.href,
        title: document.title,
        bodyText: (document.body?.innerText || "")
          .trim()
          .slice(0, 3000),

        buttons: [...document.querySelectorAll("button")]
          .map(el => (el.innerText || "").trim())
          .filter(Boolean)
          .slice(0, 30),

        links: [...document.querySelectorAll("a")]
          .map(el => ({
            text: (el.innerText || "").trim(),
            href: el.href
          }))
          .filter(x => x.text)
          .slice(0, 30)
      };
    });

    await page.close();

    return Response.json({
      ok: true,
      state
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
// CLICK 480P + DETECT NEW TAB
// =========================
if (url.pathname === "/click-480p") {
  let browser;

  try {
    const target = url.searchParams.get("url");

    if (!target) {
      return Response.json({
        ok: false,
        error: "Missing url parameter"
      }, { status: 400 });
    }

    browser = await puppeteer.launch(env.BROWSER);

    const page = await browser.newPage();

    await page.goto(target, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    const pagesBefore = await browser.pages();

    const clicked = await page.evaluate(() => {
      const elements = [
        ...document.querySelectorAll("a, button")
      ];

      const element = elements.find(el => {
        const text = (el.innerText || "").trim();
        return /^480p\b/i.test(text);
      });

      if (!element) {
        return false;
      }

      element.click();
      return true;
    });

    if (!clicked) {
      await page.close();

      return Response.json({
        ok: false,
        clicked: false,
        error: "480p option not found"
      });
    }

    // New tab/page ke liye wait
    await new Promise(resolve => setTimeout(resolve, 3000));

    const pagesAfter = await browser.pages();

    const newPages = pagesAfter.filter(
      p => !pagesBefore.includes(p)
    );

    let result = {
      clicked: true,
      newPageOpened: newPages.length > 0,
      pagesFound: pagesAfter.length
    };

    if (newPages.length > 0) {
      const newPage = newPages[newPages.length - 1];

      try {
        await newPage.waitForLoadState?.("domcontentloaded");
      } catch {}

      await new Promise(resolve => setTimeout(resolve, 1500));

      result.newPage = {
        url: newPage.url(),
        title: await newPage.title()
      };
    }

    await page.close();

    return Response.json({
      ok: true,
      ...result
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