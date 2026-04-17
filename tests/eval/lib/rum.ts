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
  const res = await fetch(`${apiBase()}/api/v2/rum/applications/${id}`, {
    method: "DELETE",
    headers: headers(),
  });

  if (!res.ok) throw new Error(`Failed to delete RUM app: ${res.status}`);
}
