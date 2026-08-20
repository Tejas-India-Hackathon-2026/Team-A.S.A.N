import { describe, expect, it } from "vitest";
import { hostelOptions, isCampusHostel } from "./hostelOptions";

describe("CampusFix hostel options", () => {
  it("exposes exactly the three approved student residences", () => {
    expect(hostelOptions).toEqual(["Aryabhatta Bhawan", "C.V Raman Bhawan", "Vaishali Bhawan"]);
  });

  it("accepts approved residences and rejects free-form alternatives", () => {
    expect(isCampusHostel("C.V Raman Bhawan")).toBe(true);
    expect(isCampusHostel("Aster Hall")).toBe(false);
  });
});
