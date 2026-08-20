// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

vi.mock("@/components/CampusFixBrand", () => ({
  CampusFixBrand: () => <div>CampusFix</div>,
}));

vi.mock("@/const", () => ({ startLogin: vi.fn() }));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

import Home from "./Home";

describe("CampusFix landing hero", () => {
  afterEach(cleanup);

  it("keeps the campus image behind an opaque readability overlay and primary actions", () => {
    render(<Home />);

    expect(screen.getByTestId("campus-hero-background").getAttribute("style")).toContain("campusfix-college-hero_cbf3beee.jpg");
    expect(screen.getByTestId("campus-hero-overlay").className).toContain("from-[#f9fbff]/95");
    expect(screen.getAllByRole("button", { name: /raise a complaint/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /see how it works/i }).length).toBeGreaterThan(0);
  });
});
