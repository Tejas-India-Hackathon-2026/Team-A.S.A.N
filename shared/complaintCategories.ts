export const complaintCategoryNames = [
  "Electrical",
  "Plumbing",
  "Housekeeping",
  "Civil Maintenance",
  "IT Services",
  "Security",
  "Internet & Wi-Fi",
  "Furniture & Fixtures",
  "Water Supply",
  "Pest Control",
  "Waste Management",
  "Grounds & Facilities",
] as const;

export type ComplaintCategoryName = (typeof complaintCategoryNames)[number];
