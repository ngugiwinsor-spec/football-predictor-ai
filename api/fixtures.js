
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const token = process.env.FOOTBALL_DATA_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "Football data API token is not configured."
    });
  }

  try {
    const url = new URL(
      "https://api.football-data.org/v4/matches"
    );

    url.searchParams.set("status", "SCHEDULED");

    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": token
      }
    });

    if (!response.ok) {
      const messages = {
        400: "The football data request was invalid.",
        403: "This competition or data is not available on your plan.",
        429: "API rate limit reached. Try again shortly."
      };

      return res.status(response.status).json({
        error:
          messages[response.status] ||
          "Football data provider returned an error.",
        providerStatus: response.status
      });
    }

    const data = await response.json();

    const matches = (data.matches || []).map(match => ({
      id: match.id,
      competition: match.competition?.name || "Unknown",
      utcDate: match.utcDate,
      status: match.status,
      homeTeam: match.homeTeam?.name || "Home team",
      awayTeam: match.awayTeam?.name || "Away team"
    }));

    return res.status(200).json({
      count: matches.length,
      matches
    });
  } catch (error) {
    return res.status(502).json({
      error: "Could not connect to the football data provider."
    });
  }
}
  
