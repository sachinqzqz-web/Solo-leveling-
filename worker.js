import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.json({
        ok: true,
        service: "AnimePlex Browser Worker",
        status: "running"
      });
    }

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
    return Response.json({
      ok: false,
      error: "Endpoint not found"
    }, { status: 404 });
  }
};
