// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    loading: false,
    user: {
      id: 7,
      name: "Campus Administrator",
      email: "admin@campusfix.test",
      role: "admin",
    },
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/useMobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/dashboard", vi.fn()],
}));

vi.mock("./CampusFixBrand", () => ({
  CampusFixBrand: () => <div>CampusFix</div>,
}));

import DashboardLayout from "./DashboardLayout";

describe("DashboardLayout navigation control", () => {
  afterEach(cleanup);

  it("renders an opaque high-contrast sidebar control for an authenticated administrator", () => {
    render(
      <DashboardLayout>
        <div>Workspace content</div>
      </DashboardLayout>,
    );

    const menuControl = screen.getByRole("button", { name: "Toggle navigation" });
    expect(menuControl.className).toContain("bg-[#082962]");
    expect(menuControl.className).toContain("text-white");
    expect(menuControl.className).toContain("border-[#082962]");
    expect(menuControl.className).toContain("focus-visible:ring-2");
  });
});
