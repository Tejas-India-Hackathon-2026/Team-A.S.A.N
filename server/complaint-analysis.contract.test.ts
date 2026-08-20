import { describe, expect, it } from "vitest";
import { complaintAnalysisSchema, createComplaintId } from "./routers/complaints";

describe("CampusFix AI analysis contract", () => {
  it("accepts the precise three-field analysis response", () => {
    expect(complaintAnalysisSchema.parse({
      departmentCategory: "Electrical",
      priorityLevel: "High",
      aiSummary: "A sparking outlet in Block B, Room 204 requires urgent electrical inspection.",
    })).toEqual({
      departmentCategory: "Electrical",
      priorityLevel: "High",
      aiSummary: "A sparking outlet in Block B, Room 204 requires urgent electrical inspection.",
    });
  });

  it("rejects priorities outside Low, Medium, and High", () => {
    expect(() => complaintAnalysisSchema.parse({
      departmentCategory: "Plumbing",
      priorityLevel: "Urgent",
      aiSummary: "A pipe is leaking and requires maintenance.",
    })).toThrow();
  });

  it("rejects additional AI response fields", () => {
    expect(() => complaintAnalysisSchema.parse({
      departmentCategory: "Housekeeping",
      priorityLevel: "Low",
      aiSummary: "Waste collection is required near the south residence entrance.",
      confidence: 0.98,
    })).toThrow();
  });

  it("generates concise, unique CampusFix ticket IDs", () => {
    const identifiers = new Set(Array.from({ length: 64 }, () => createComplaintId()));
    expect(identifiers).toHaveLength(64);
    for (const identifier of identifiers) expect(identifier).toMatch(/^CF-[A-Z0-9_-]{10}$/);
  });
});
