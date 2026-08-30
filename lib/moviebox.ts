// lib/moviebox.ts

const API_BASE = "https://h5-api.aoneroom.com/wefeed-h5api-bff";
let bearerToken: string | null = null;

export const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  "Referer": "https://moviebox.ph/",
  "Origin": "https://moviebox.ph",
  "X-Client-Info": '{"timezone":"Asia/Dhaka"}',
  "X-Request-Lang": "en",
  "Accept": "application/json",
  "Content-Type": "application/json",
  "sec-ch-ua": '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "cross-site",
};

export const PLAYER_HEADERS: Record<string, string> = {
  ...DEFAULT_HEADERS,
  "sec-fetch-site": "same-origin",
};

export async function getBearerToken(): Promise<string> {
  if (bearerToken) return bearerToken;
  
  try {
    const res = await fetch(`${API_BASE}/home?host=moviebox.ph`, { 
      headers: DEFAULT_HEADERS,
      cache: "no-store" // Next.js caching issue se bachne ke liye
    });
    
    const xUser = res.headers.get("x-user");
    if (xUser) {
      try {
        bearerToken = JSON.parse(xUser).token;
      } catch (err) {}
    }
    
    if (!bearerToken) {
      const setCookie = res.headers.get("set-cookie") || "";
      const match = setCookie.match(/token=([^;]+)/);
      if (match) bearerToken = match[1];
    }
  } catch (e) {
    console.error("Token generation error:", e);
  }

  // Fallback: Agar live server par header se token na mile, toh kam se kam empty string ki jagah request fail na ho
  return bearerToken || "";
}

export async function makeApiRequest(url: string, method = "GET", payload: any = null): Promise<any> {
  const token = await getBearerToken();
  const headers: Record<string, string> = {
    ...DEFAULT_HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const options: RequestInit = { 
    method, 
    headers,
    cache: "no-store" // Live environment par old cached response na utaye
  };
  
  if (payload && method === "POST") {
    options.body = JSON.stringify(payload);
  }

  try {
    const res = await fetch(url, options);
    
    const xUser = res.headers.get("x-user");
    if (xUser) {
      try {
        const newToken = JSON.parse(xUser).token;
        if (newToken) bearerToken = newToken;
      } catch (e) {}
    }

    if (!res.ok) {
      console.error(`API Error [${res.status}] for URL: ${url}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("makeApiRequest failed:", error);
    return null;
  }
}