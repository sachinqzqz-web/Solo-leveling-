import axios from "axios";

export default async function handler(req, res) {
  const t0 = Date.now();

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
      requestUrl.pathname.replace(/^\/+|\/+$/g, "")
    )
      .replace(/[-_]+/g, " ")
      .trim();

    // =========================
    // HOME
    // =========================

    if (!movie) {
      return res.status(200).json({
        ok: true,
        service: "AnimePlex Axios Test API",
        status: "running"
      });
    }

    // =========================
    // SEARCH PAGE
    // =========================

    const searchStart = Date.now();

    const searchResponse = await axios.get(
      "https://new1.hdhub4u.free/search.html",
      {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      }
    );

    const searchTime = Date.now() - searchStart;

    // =========================
    // SEARCH HTML TEST
    // =========================

    const html = searchResponse.data;

const formInfo = [
  ...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)
].map(match => ({
  html: match[0].slice(0, 3000)
}));

const scripts = [
  ...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)
].map(match => match[1]);

return res.status(200).json({
  ok: true,
  movie,
  formsFound: formInfo.length,
  forms: formInfo,
  scripts
});

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error:
        error?.code ||
        error?.message ||
        String(error),

      timing: {
        total: Date.now() - t0
      }
    });
  }
}