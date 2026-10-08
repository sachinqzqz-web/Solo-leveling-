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

    return res.status(200).json({
      ok: true,
      movie,

      axios: {
        status: searchResponse.status,
        contentType:
          searchResponse.headers["content-type"] || null,
        htmlLength:
          typeof html === "string"
            ? html.length
            : 0
      },

      timing: {
        total: Date.now() - t0,
        searchRequest: searchTime
      },

      message:
        "Axios successfully fetched search.html"
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