import { describe, expect, it } from "vitest";
import { hostelOptions } from "@shared/hostels";
import { reportSchema } from "./routers/complaints";
import { profileSchema } from "./routers/profile";

describe("CampusFix hostel validation", () => {
  it("accepts each approved hostel in profile and complaint inputs", () => {
    for (const hostel of hostelOptions) {
      expect(profileSchema.safeParse({
        name: "Campus Student",
        hostel,
        gender: "Female",
        role: "student",
        mobileNumber: null,
        rollNumber: "24CSE101",
        registrationNumber: "REG/2026/001",
      }).success).toBe(true);

      expect(reportSchema.safeParse({
        description: "The ceiling fan in my room is not working.",
        hostel,
        block: "A",
        room: "204",
        attachmentIds: [],
      }).success).toBe(true);
    }
  });

  it("rejects unapproved free-form hostel values in profile and complaint inputs", () => {
    expect(profileSchema.safeParse({
      name: "Campus Student",
      hostel: "Aster Hall",
      gender: "Female",
      role: "student",
      mobileNumber: null,
    }).success).toBe(false);

    expect(reportSchema.safeParse({
      description: "The ceiling fan in my room is not working.",
      hostel: "Aster Hall",
      block: "A",
      room: "204",
      attachmentIds: [],
    }).success).toBe(false);
  });
});
