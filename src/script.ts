// Import functions from Last.fm module
import { getTopArtistsChart, getTopTracksChart} from "./lastfm.ts";
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID; // Replace with your client id
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

export let myArtists: string[] = [];
export let myTracks: string[] = [];
export let worldArtists: string[] = [];
export let worldTracks: string[] = [];

// Function to set the list of artists
async function main() {
    // Check if we have a valid access token already stored
    let accessToken = localStorage.getItem("access_token");
    const expiresAt = Number(localStorage.getItem("expires_at"));
    const now = Date.now();

    if (accessToken && now < expiresAt) {
        // Use the stored valid token
        accessToken = await getValidAccessToken(clientId);
    } else if (code) {
        // Exchange the authorization code for tokens if no valid token exists
        try {
            accessToken = await getAccessToken(clientId, code);
            // Store the access token (and tokens like refresh_token and expiry) in localStorage
            localStorage.setItem("access_token", accessToken);
            // Remove the code from the URL so it’s not used again on refresh
            window.history.replaceState({}, document.title, "/callback");
        } catch (err) {
            console.error("Error fetching access token:", err);
            // If exchange fails (e.g., code expired), force re-authentication
            redirectToAuthCodeFlow(clientId);
            return;
        }
    } else {
        // If no code and no valid token, start authentication
        redirectToAuthCodeFlow(clientId);
        return;
    }

    // With a valid access token, fetch data
    //const profile = await fetchProfile(accessToken);
    const topArtists = await fetchTopArtists(accessToken);
    const topTracks = await fetchTopTracks(accessToken);

    myArtists = topArtists.items.map((artist: any) => artist.name);
    myTracks = topTracks.items.map((track: any) => track.name);
}

// Export a promise that resolves when main() completes:
export const spotifyDataPromise = main().catch((error) => {
    console.error("Error in main function:", error);
});

// Function to fetch world artists and tracks
async function getWorldData() {
    await fetchWorldArtists();
    await fetchWorldTracks();
}

// Fetch world artists and tracks
async function fetchWorldArtists() {
    const response = await getTopArtistsChart(20, 2);
    worldArtists = response.artists.artist.map((artist: any) => artist.name);
}

// Fetch world tracks
async function fetchWorldTracks() {
    const response = await getTopTracksChart(20, 2);
    worldTracks = response.tracks.track.map((track: any) => track.name);
}

// Fetch world artists and tracks by country
export const lastfmDataPromise = getWorldData().catch((error) => {
    console.error("Error in getWorldData function:", error);
});

// Function to redirect to the authorization code flow
export async function redirectToAuthCodeFlow(clientId: string) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Function to generate a random code verifier
function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Function to generate a code challenge from the code verifier
async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Function to get a valid access token
async function getValidAccessToken(clientId: string): Promise<string> {
    const expiresAt = Number(localStorage.getItem("expires_at"));
    const now = Date.now();
    let accessToken = localStorage.getItem("access_token");

    // If the token is expired or nearly expired, refresh it.
    if (!accessToken || now >= expiresAt) {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
            throw new Error("No refresh token available. User needs to reauthenticate.");
        }
        accessToken = await refreshAccessToken(clientId, refreshToken);
        // Update access token and expiration time as needed (store in localStorage, state, etc.)
        localStorage.setItem("access_token", accessToken);
        // Assume new expiry (for example, 3600 seconds)
        localStorage.setItem("expires_at", (Date.now() + 3600 * 1000).toString());
    }
    return accessToken;
}

// Function to get an access token using the authorization code
export async function getAccessToken(clientId: string, code: string): Promise<string> {
    const verifier = localStorage.getItem("verifier");
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const data = await result.json();
    if (data.error) {
        console.error("Error fetching access token:", data);
        throw new Error(data.error);
    }
    // Store the refresh token for later use
    if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
    }
    // Optionally, store the expiry time: current time + data.expires_in (in seconds)
    localStorage.setItem("expires_at", (Date.now() + data.expires_in * 1000).toString());

    return data.access_token;
}

// Function to refresh the access token using the refresh token if the access token is expired
export async function refreshAccessToken(clientId: string, refreshToken: string): Promise<string> {
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const data = await result.json();
    if (data.error) {
        console.error("Error refreshing token:", data);
        throw new Error(data.error);
    }
    // Optionally, update your stored refresh token if a new one is provided:
    if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
    }
    return data.access_token;
}

// Function to fetch the user's top artists by access token from Spotify API
async function fetchTopArtists(token: string): Promise<any> {
    const result = await fetch("https://api.spotify.com/v1/me/top/artists", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

// Function to fetch the user's top tracks by access token from Spotify API
async function fetchTopTracks(token: string): Promise<any> {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}