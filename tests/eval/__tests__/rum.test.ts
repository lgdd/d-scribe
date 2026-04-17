import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRumApp, deleteRumApp } from "../lib/rum.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.stubEnv("DD_API_KEY", "test-api-key");
  vi.stubEnv("DD_APP_KEY", "test-app-key");
  vi.stubEnv("DD_SITE", "datadoghq.com");
  mockFetch.mockReset();
});

describe("createRumApp", () => {
  it("sends POST to Datadog API and returns app credentials", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: "rum-123",
          attributes: {
            application_id: "app-id-456",
            client_token: "pub-token-789",
          },
        },
      }),
    });

    const result = await createRumApp("d-scribe-eval");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.datadoghq.com/api/v2/rum/applications");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({
      data: {
        type: "rum_application_create",
        attributes: { name: "d-scribe-eval", type: "browser" },
      },
    });
    expect(opts.headers["DD-API-KEY"]).toBe("test-api-key");
    expect(opts.headers["DD-APPLICATION-KEY"]).toBe("test-app-key");

    expect(result).toEqual({
      id: "rum-123",
      applicationId: "app-id-456",
      clientToken: "pub-token-789",
    });
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, statusText: "Forbidden" });
    await expect(createRumApp("test")).rejects.toThrow("Failed to create RUM app: 403");
  });
});

describe("deleteRumApp", () => {
  it("sends DELETE to Datadog API", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteRumApp("rum-123");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.datadoghq.com/api/v2/rum/applications/rum-123");
    expect(opts.method).toBe("DELETE");
    expect(opts.headers["DD-API-KEY"]).toBe("test-api-key");
    expect(opts.headers["DD-APPLICATION-KEY"]).toBe("test-app-key");
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: "Not Found" });
    await expect(deleteRumApp("bad-id")).rejects.toThrow("Failed to delete RUM app: 404");
  });
});
