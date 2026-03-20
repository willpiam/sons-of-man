function getConfiguredBaseUrl() {
  if (typeof window !== "undefined" && typeof window.SOM_API_BASE_URL === "string") {
    return window.SOM_API_BASE_URL.trim().replace(/\/+$/, "");
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:3000/api";
  }
  return "https://sons-of-man.onrender.com/api";
}

const API_BASE_URL = getConfiguredBaseUrl();

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(payload?.error || "API request failed.");
  }
  return payload;
}

export async function createOathEvent(body) {
  return requestJson("/oath-events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listOathEvents({ page = 1, limit = 20, networkMode = "mainnet" } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    network_mode: String(networkMode),
  });
  return requestJson(`/oath-events?${params.toString()}`);
}

export async function verifyOathEvent(id) {
  return requestJson(`/oath-events/${id}/verify`, {
    method: "POST",
  });
}

export { API_BASE_URL };
