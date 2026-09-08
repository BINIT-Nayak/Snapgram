import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthLayout from "@/_auth/AuthLayout";
import RootLayout from "@/_root/RootLayout";

const mockUseUserContext = vi.hoisted(() => vi.fn());

vi.mock("@/context/AuthContext", () => ({
  useUserContext: () => mockUseUserContext(),
}));

vi.mock("@/components/shared/Topbar", () => ({
  default: () => <div>Topbar</div>,
}));

vi.mock("@/components/shared/Bottombar", () => ({
  default: () => <div>Bottombar</div>,
}));

vi.mock("@/components/shared/LeftSidebar", () => ({
  default: () => <div>LeftSidebar</div>,
}));

describe("auth route guards", () => {
  beforeEach(() => {
    mockUseUserContext.mockReset();
  });

  it("redirects protected routes to sign-in when logged out", () => {
    mockUseUserContext.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<div>Protected Home</div>} />
          </Route>
          <Route path="/sign-in" element={<div>Sign In Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Sign In Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Home")).not.toBeInTheDocument();
  });

  it("renders protected content when authenticated", () => {
    mockUseUserContext.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<div>Protected Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Home")).toBeInTheDocument();
    expect(screen.getByText("LeftSidebar")).toBeInTheDocument();
  });

  it("redirects authenticated users away from auth pages", () => {
    mockUseUserContext.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/sign-in"]}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/sign-in" element={<div>Sign In Form</div>} />
          </Route>
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("Sign In Form")).not.toBeInTheDocument();
  });
});
