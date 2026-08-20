export const hostelOptions = [
  "Aryabhatta Bhawan",
  "C.V Raman Bhawan",
  "Vaishali Bhawan",
] as const;

export type HostelOption = (typeof hostelOptions)[number];

export function isCampusHostel(value: string): value is HostelOption {
  return hostelOptions.some(option => option === value);
}
