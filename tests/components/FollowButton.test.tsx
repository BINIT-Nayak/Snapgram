import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FollowButton from "@/components/shared/FollowButton";
import { makeFollow, makeUser } from "../utils/factories";
import { renderWithProviders } from "../utils/render";

const mockMutations = vi.hoisted(() => ({
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}));
const mockUseUserContext = vi.hoisted(() => vi.fn());
const mockUseGetFollowStatus = vi.hoisted(() => vi.fn());

vi.mock("@/context/AuthContext", () => ({
  useUserContext: () => mockUseUserContext(),
}));

vi.mock("@/lib/react-query/queries", () => ({
  useFollowUser: () => ({
    mutateAsync: mockMutations.followUser,
    isPending: false,
  }),
  useUnfollowUser: () => ({
    mutateAsync: mockMutations.unfollowUser,
    isPending: false,
  }),
  useGetFollowStatus: () => mockUseGetFollowStatus(),
}));

describe("FollowButton", () => {
  beforeEach(() => {
    mockMutations.followUser.mockResolvedValue({ status: "Ok" });
    mockMutations.unfollowUser.mockResolvedValue({ status: "Ok" });
    mockUseUserContext.mockReturnValue({
      user: makeUser({ $id: "user-1", id: "user-1" }),
    });
    mockUseGetFollowStatus.mockReturnValue({ data: null });
  });

  it("renders a disabled You button for the current user", () => {
    renderWithProviders(<FollowButton targetUser={makeUser({ $id: "user-1" })} />);

    expect(screen.getByRole("button", { name: "You" })).toBeDisabled();
  });

  it("follows another user", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <FollowButton targetUser={makeUser({ $id: "user-2" })} />
    );

    await user.click(screen.getByRole("button", { name: "Follow" }));

    expect(mockMutations.followUser).toHaveBeenCalledWith({
      currentUserId: "user-1",
      targetUserId: "user-2",
    });
    expect(screen.getByRole("button", { name: "Following" })).toBeInTheDocument();
  });

  it("unfollows a user that is already followed", async () => {
    const user = userEvent.setup();
    mockUseGetFollowStatus.mockReturnValue({
      data: makeFollow({ followerId: "user-1", followingId: "user-2" }),
    });

    renderWithProviders(
      <FollowButton targetUser={makeUser({ $id: "user-2" })} />
    );

    await user.click(screen.getByRole("button", { name: "Following" }));

    expect(mockMutations.unfollowUser).toHaveBeenCalledWith({
      currentUserId: "user-1",
      targetUserId: "user-2",
    });
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
  });
});
