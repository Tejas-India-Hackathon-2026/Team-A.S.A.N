import { describe, expect, it } from "vitest";
import { getOnboardingNextPath } from "./onboardingRoute";
import { shouldRetryTransientApiError } from "./transientApiError";

describe("onboarding preview route recovery", () => {
  it("preserves the complaint destination when the development preview parameter is present", () => {
    expect(getOnboardingNextPath("?next=%2Freport&from_webdev=1")).toBe("/report");
  });

  it("retries a transient HTML gateway response while onboarding loads authentication state", () => {
    expect(shouldRetryTransientApiError(0, new Error("Unexpected token '<', \"<html>…\" is not valid JSON"))).toBe(true);
  });
});
