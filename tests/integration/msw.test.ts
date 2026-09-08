import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../msw/server";

describe("MSW test server", () => {
  it("intercepts browser fetch requests for integration tests", async () => {
    server.use(
      http.get("/api/health", () => {
        return HttpResponse.json({ ok: true });
      })
    );

    const response = await fetch("/api/health");

    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
