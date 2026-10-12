
import axios from "axios";

export default async function handler(req, res) {
  const t0 = Date.now();

  try {
    const requestUrl = new URL(
      req.url,
      `https://${req.headers.host || "localhost"}`
    );

    const movie = decodeURIComponent(
      requestUrl.pathname.replace(/^\/+|\/+$/g, "")
    )
      .replace(/[-_]+/g, " ")
      .trim();

    // Health check
    if (!movie) {
      return res.status(200).json({
        ok: true,
        service: "AnimePlex Axios API",
        status: "running"
      });
    }

    const searchStart = Date.now();

    // Replace this with your own authorized search API.
    const apiUrl = new URL(
      process.env.SEARCH_API_URL || ""
    );

    apiUrl.searchParams.set("q", movie);
    apiUrl.searchParams.set("page", "1");

    const response = await axios.get(apiUrl.toString(), {
      timeout: 10000,
      headers: {
        Accept: "application/json"
      }
    });

    const searchTime = Date.now() - searchStart;
    const data = response.data;

    if (!data || !Array.isArray(data.hits)) {
      return res.status(502).json({
        ok: false,
        error: "Unexpected search API response",
        timing: {
          total: Date.now() - t0,
          searchRequest: searchTime
        }
      });
    }

    const words = movie.toLowerCase().split(/\s+/);

    const results = data.hits.map(hit => {
      const item = hit.document || hit;

      return {
        title: item.title || item.post_title || "",
        thumbnail: item.thumbnail || item.post_thumbnail || null,
        url: item.url || item.permalink || null
      };
    });

    const matched = results.find(item => {
      const title = item.title.toLowerCase();
      return title.includes(movie.toLowerCase());
    }) || results.find(item => {
      const title = item.title.toLowerCase();
      return words.every(word => title.includes(word));
    }) || null;

    return res.status(200).json({
      ok: true,
      movie,
      found: data.found ?? results.length,
      matched,
      results: results.slice(0, 5),
      timing: {
        total: Date.now() - t0,
        searchRequest: searchTime
      }
    });

  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: error.code || error.message || "Request failed",
      timing: {
        total: Date.now() - t0
      }
    });
  }
}
