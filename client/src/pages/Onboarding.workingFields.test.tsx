// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { name: "Staff Candidate", email: "staff@example.com" } }),
}));

vi.mock("@/components/CampusFixBrand", () => ({ CampusFixBrand: () => <div>CampusFix</div> }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/components/ui/input", () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} /> }));
vi.mock("@/components/ui/label", () => ({ Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props}>{children}</label> }));
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) => <select value={value} onChange={event => onValueChange(event.target.value)}>{children}</select>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}));
vi.mock("@/lib/trpc", () => ({ trpc: { profile: { update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));
vi.mock("wouter", () => ({ useLocation: () => ["/onboarding", vi.fn()], useSearch: () => "" }));

import Onboarding from "./Onboarding";

describe("CampusFix staff working-fields onboarding", () => {
  afterEach(cleanup);

  it("keeps working fields staff-only and permits multiple category selections", () => {
    render(<Onboarding />);

    expect(screen.queryByRole("group", { name: /working fields/i })).toBeNull();
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "staff" } });

    const workingFields = screen.getByRole("group", { name: /working fields/i });
    expect(within(workingFields).getAllByRole("checkbox")).toHaveLength(12);

    const electrical = within(workingFields).getByRole("checkbox", { name: "Electrical" }) as HTMLInputElement;
    const pestControl = within(workingFields).getByRole("checkbox", { name: "Pest Control" }) as HTMLInputElement;
    fireEvent.click(electrical);
    fireEvent.click(pestControl);

    expect(electrical.checked).toBe(true);
    expect(pestControl.checked).toBe(true);
  });
});
