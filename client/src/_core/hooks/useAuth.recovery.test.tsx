// @vitest-environment jsdom
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import superjson from "superjson";
import { afterEach, describe, expect, it, vi } from "vitest";
import { trpc } from "@/lib/trpc";
import { useAuth } from "./useAuth";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const client = trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://campusfix.test/api/trpc",
        transformer: superjson,
      }),
    ],
  });

  return function TestProviders({ children }: { children: ReactNode }) {
    return (
      <trpc.Provider client={client} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </trpc.Provider>
    );
  };
}

describe("useAuth transient gateway recovery", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("recovers from a transient HTML 504 response so onboarding can render for the authenticated user", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("<html><h1>504 Gateway Time-out</h1></html>", {
          status: 504,
          headers: { "content-type": "text/html" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              result: {
                data: {
                  json: {
                    id: 1,
                    openId: "preview-user",
                    name: "Campus Student",
                    email: "student@example.test",
                    role: "user",
                  },
                },
              },
            },
          ]),
          { headers: { "content-type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.email).toBe("student@example.test");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
