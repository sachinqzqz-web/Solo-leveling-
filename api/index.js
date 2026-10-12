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

const apiUrl = new URL(
  "https://search.pingora.fyi/collections/post/documents/search"
);

apiUrl.searchParams.set("q", movie);
apiUrl.searchParams.set(
  "query_by",
  "post_title,category,stars,director,imdb_id"
);
apiUrl.searchParams.set("query_by_weights", "4,2,2,2,4");
apiUrl.searchParams.set("sort_by", "sort_by_date:desc");
apiUrl.searchParams.set("limit", "15");
apiUrl.searchParams.set("highlight_fields", "none");
apiUrl.searchParams.set("use_cache", "true");
apiUrl.searchParams.set("page", "1");

const apiResponse = await axios.get(apiUrl.toString(), {
  timeout: 10000
});

return res.status(200).json({
  ok: true,
  movie,
  found: apiResponse.data.found,
  hits: (apiResponse.data.hits || []).slice(0, 3).map(hit => ({
    title: hit.document?.post_title,
    thumbnail: hit.document?.post_thumbnail,
    permalink: hit.document?.permalink
  })),
  message: "Search API test successful"
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