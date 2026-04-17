export interface RumApp {
  id: string;
  applicationId: string;
  clientToken: string;
}

function apiBase(): string {
  const site = process.env.DD_SITE || "datadoghq.com";
  return `https://api.${site}`;
}

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "DD-API-KEY": process.env.DD_API_KEY!,
    "DD-APPLICATION-KEY": process.env.DD_APP_KEY!,
  };
}

export async function createRumApp(name: string): Promise<RumApp> {
  const res = await fetch(`${apiBase()}/api/v2/rum/applications`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: {
        type: "rum_application_create",
        attributes: { name, type: "browser" },
      },
    }),
  });

  if (!res.ok) throw new Error(`Failed to create RUM app: ${res.status}`);

  const json = await res.json();
  const attrs = json.data.attributes;
  return {
    id: json.data.id,
    applicationId: attrs.application_id,
    clientToken: attrs.client_token,
  };
}

export async function deleteRumApp(id: string): Promise<void> {
  const url = `${apiBase()}/api/v2/rum/applications/${id}`;

  // Retry once on network-level failure. Node's native fetch keeps connections
  // alive in a pool; after a long idle window (the eval can take 10+ min) the
  // pooled socket is often closed by the server, and the next write gets
  // EPIPE / ECONNRESET. DELETE is idempotent, so a single retry is safe.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { ...headers(), Connection: "close" },
      });
      if (!res.ok) throw new Error(`Failed to delete RUM app: ${res.status}`);
      return;
    } catch (err) {
      const isNetworkError =
        err instanceof TypeError && /fetch failed/i.test(err.message);
      if (attempt === 2 || !isNetworkError) throw err;
    }
  }
}
