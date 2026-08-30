const API_BASE =
  "https://h5-api.aoneroom.com/wefeed-h5api-bff";

let bearerToken: string | null = null;

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/148.0.0.0 Safari/537.36",
  Referer: "https://moviebox.ph/",
  Origin: "https://moviebox.ph",
  "X-Client-Info": '{"timezone":"Asia/Dhaka"}',
  "X-Request-Lang": "en",
  Accept: "application/json",
  "Content-Type": "application/json",
};

async function getBearerToken() {
  if (bearerToken) return bearerToken;

  const response = await fetch(
    `${API_BASE}/home?host=moviebox.ph`,
    {
      headers: DEFAULT_HEADERS,
      cache: "no-store",
    }
  );

  const xUser = response.headers.get("x-user");

  if (xUser) {
    try {
      const parsed = JSON.parse(xUser);
      bearerToken = parsed.token ?? null;
    } catch {
      console.error("Invalid x-user header");
    }
  }

  return bearerToken ?? "";
}

type ServerApiOptions = {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
};

export async function serverApi<T>(
  path: string,
  options: ServerApiOptions = {}
): Promise<T> {
  const token = await getBearerToken();

  const headers = {
    ...DEFAULT_HEADERS,
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };

  const response = await fetch(
    `${API_BASE}${path}`,
    {
      method: options.method ?? "GET",
      headers,
      ...(options.body
        ? {
            body: JSON.stringify(options.body),
          }
        : {}),
      cache: "no-store",
    }
  );

  const text = await response.text();

  console.log(
    "UPSTREAM:",
    response.status,
    path,
    text.slice(0, 500)
  );

  if (!response.ok) {
    throw new Error(
      `Upstream API ${response.status}: ${text.slice(0, 300)}`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Upstream returned invalid JSON");
  }
}