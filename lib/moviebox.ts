import { HttpsProxyAgent } from 'https-proxy-agent';

const API_BASE = "https://h5-api.aoneroom.com/wefeed-h5api-bff";
let bearerToken: string | null = "guest_token_fallback";

// Agar aapne Vercel environment variables mein PROXY_URL set kiya hai (jaise http://username:password@proxy_ip:port)
const proxyUrl = process.env.PROXY_URL || "";
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

export const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  "Referer": "https://moviebox.ph/",
  "Origin": "https://moviebox.ph",
  "X-Client-Info": '{"timezone":"Asia/Dhaka"}',
  "X-Request-Lang": "en",
  "Accept": "application/json",
  "Content-Type": "application/json",
};

export const PLAYER_HEADERS: Record<string, string> = {
  ...DEFAULT_HEADERS,
  "X-Forwarded-For": "103.250.8.0", // Kisi valid Asian/Allowed region ka IP spoof karne ke liye
  "X-Client-Country": "US",
  "Accept-Language": "en-US,en;q=0.9",
};
export async function makeApiRequest(url: string, method = "GET", payload: any = null): Promise<any> {
  const headers: Record<string, string> = {
    ...DEFAULT_HEADERS,
  };

  const options: RequestInit & { agent?: any } = { 
    method, 
    headers,
    cache: "no-store",
    ...(agent ? { agent } : {}) // Agar proxy configured hai toh uske through jayega
  };
  
  if (payload && method === "POST") {
    options.body = JSON.stringify(payload);
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Proxy fetch error:", error);
    return null;
  }
}