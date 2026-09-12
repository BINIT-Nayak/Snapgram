import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PostCard from "@/components/shared/PostCard";
import { makePost, makeUser } from "../utils/factories";
import { renderWithProviders } from "../utils/render";

const mockUseUserContext = vi.hoisted(() => vi.fn());

vi.mock("@/context/AuthContext", () => ({
  useUserContext: () => mockUseUserContext(),
}));

vi.mock("@/lib/appwrite/api", () => ({
  createUserAccount: vi.fn(),
  signInAccount: vi.fn(),
  getCurrentUser: vi.fn(() =>
    Promise.resolve({
      $id: "user-1",
      save: [],
    })
  ),
  signOutAccount: vi.fn(),
  getUsers: vi.fn(),
  createPost: vi.fn(),
  getPostById: vi.fn(),
  updatePost: vi.fn(),
  getUserPosts: vi.fn(),
  deletePost: vi.fn(),
  likePost: vi.fn(),
  unlikePost: vi.fn(),
  getUserById: vi.fn(),
  followUser: vi.fn(),
  getFollowByUsers: vi.fn(),
  updateUser: vi.fn(),
  unfollowUser: vi.fn(),
  getLikedPosts: vi.fn(),
  getRecentPosts: vi.fn(),
  getInfinitePosts: vi.fn(),
  searchPosts: vi.fn(),
  savePost: vi.fn(),
  deleteSavedPost: vi.fn(),
  getSavedPosts: vi.fn(),
  getLikeUserId: vi.fn((like: { userId?: string } | string) =>
    typeof like === "string" ? like : like.userId
  ),
  getFilePreview: vi.fn((fileId: string) => `/storage/${fileId}`),
}));

describe("PostCard", () => {
  beforeEach(() => {
    mockUseUserContext.mockReturnValue({
      user: makeUser({ $id: "user-1", id: "user-1" }),
    });
  });

  it("renders post content, creator, tags, and optimized image", () => {
    renderWithProviders(
      <PostCard
        post={makePost({
          caption: "Sunset from the test suite",
          tags: ["sunset", "travel"],
        })}
      />
    );

    expect(screen.getByText("Alex Morgan")).toBeInTheDocument();
    expect(screen.getByText("Sunset from the test suite")).toBeInTheDocument();
    expect(screen.getByText("#sunset")).toBeInTheDocument();
    expect(screen.getByAltText("post image")).toHaveAttribute(
      "loading",
      "lazy"
    );
  });

  it("shows the edit action only for the post owner", () => {
    const { rerender } = renderWithProviders(
      <PostCard post={makePost({ creator: makeUser({ $id: "user-1" }) })} />
    );

    expect(screen.getByAltText("edit").closest("a")).not.toHaveClass("hidden");

    mockUseUserContext.mockReturnValue({
      user: makeUser({ $id: "other-user", id: "other-user" }),
    });

    rerender(
      <PostCard post={makePost({ creator: makeUser({ $id: "user-1" }) })} />
    );

    expect(screen.getByAltText("edit").closest("a")).toHaveClass("hidden");
  });
});
