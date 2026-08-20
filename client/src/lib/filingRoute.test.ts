import { describe, expect, it } from "vitest";
import { getFilingDestination } from "./filingRoute";

describe("first-time complaint filing route", () => {
  it("sends first-time filers through registration before the complaint form", () => {
    expect(getFilingDestination(false)).toBe("/onboarding?next=/report");
  });

  it("sends returning users with a completed profile directly to the complaint form", () => {
    expect(getFilingDestination(true)).toBe("/report");
  });
});
