import { describe, expect, it } from "vitest";
import { shouldRetryTransientApiError } from "./transientApiError";

describe("transient API retry policy", () => {
  it("retries a gateway HTML response that tRPC could not parse as JSON", () => {
    expect(shouldRetryTransientApiError(0, new Error("Unexpected token '<', \"<html>…\" is not valid JSON"))).toBe(true);
    expect(shouldRetryTransientApiError(1, new Error("504 Gateway Time-out"))).toBe(true);
  });

  it("does not retry permanent API failures or exceed the retry limit", () => {
    expect(shouldRetryTransientApiError(0, new Error("Profile data is invalid."))).toBe(false);
    expect(shouldRetryTransientApiError(2, new Error("Unexpected token '<'"))).toBe(false);
  });
});
