const API_KEY = import.meta.env.VITE_LASTFM_API_KEY; // Your Last.fm API key

/**
 * Fetches the top artists for a given country.
 * @param country - The name of the country (e.g., "United States").
 * @param limit - The number of results to fetch (default is 50).
 * @param page - The page number to fetch (default is 1).
 * @returns A promise that resolves with the JSON response.
 */
export async function getTopArtistsByCountry(country: string, limit: number, page: number): Promise<any> {
  const url = `http://ws.audioscrobbler.com/2.0/?method=geo.gettopartists&country=${encodeURIComponent(country)}&api_key=${API_KEY}&format=json&limit=${limit}&page=${page}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching top artists by country: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetches the top tracks for a given country.
 * @param country - The name of the country (e.g., "United States").
 * @param limit - The number of results to fetch (default is 50).
 * @param page - The page number to fetch (default is 1).
 * @returns A promise that resolves with the JSON response.
 */
export async function getTopTracksByCountry(country: string, limit: number, page: number): Promise<any> {
  const url = `http://ws.audioscrobbler.com/2.0/?method=geo.gettoptracks&country=${encodeURIComponent(country)}&api_key=${API_KEY}&format=json&limit=${limit}&page=${page}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching top tracks by country: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetches the top artists chart.
 * @param limit - The number of results to fetch (default is 50).
 * @param page - The page number to fetch (default is 2).
 * @returns A promise that resolves with the JSON response.
 */
export async function getTopArtistsChart(limit: number, page: number): Promise<any> {
  const url = `http://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${API_KEY}&format=json&limit=${limit}&page=${page}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching top artists chart: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetches the top tracks chart.
 * @param limit - The number of results to fetch (default is 50).
 * @param page - The page number to fetch (default is 2).
 * @returns A promise that resolves with the JSON response.
 */
export async function getTopTracksChart(limit: number, page: number): Promise<any> {
  const url = `http://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${API_KEY}&format=json&limit=${limit}&page=${page}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching top tracks chart: ${response.statusText}`);
  }
  return await response.json();
}
