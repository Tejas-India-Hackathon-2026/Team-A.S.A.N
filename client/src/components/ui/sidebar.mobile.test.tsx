// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useMobile", () => ({
  useIsMobile: () => true,
}));

import { Sidebar, SidebarProvider, useSidebar } from "./sidebar";

function MobileSidebarHarness() {
  const { setOpenMobile } = useSidebar();

  return (
    <>
      <button onClick={() => setOpenMobile(true)}>Open navigation</button>
      <Sidebar className="border-r border-blue-200 bg-[#f8fbff] shadow-2xl">
        <div>Private navigation content</div>
      </Sidebar>
    </>
  );
}

describe("mobile sidebar surface", () => {
  afterEach(cleanup);

  it("applies an opaque CampusFix surface to the opened sliding panel", async () => {
    render(
      <SidebarProvider>
        <MobileSidebarHarness />
      </SidebarProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    const content = await screen.findByText("Private navigation content");
    const panel = content.closest('[data-sidebar="sidebar"]');

    expect(panel?.className).toContain("bg-[#f8fbff]");
    expect(panel?.className).toContain("border-blue-200");
    expect(panel?.className).toContain("shadow-2xl");
  });
});
