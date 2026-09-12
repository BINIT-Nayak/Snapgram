import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PostForm from "@/components/forms/PostForm";
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";
import { makePost, makeUser } from "../utils/factories";
import { createTestQueryClient, renderWithProviders } from "../utils/render";

const mockUseUserContext = vi.hoisted(() => vi.fn());
const mockApi = vi.hoisted(() => ({
  createPost: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useUserContext: () => mockUseUserContext(),
}));

vi.mock("@/lib/appwrite/api", () => ({
  createUserAccount: vi.fn(),
  signInAccount: vi.fn(),
  getCurrentUser: vi.fn(),
  signOutAccount: vi.fn(),
  getUsers: vi.fn(),
  createPost: mockApi.createPost,
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
}));

describe("create post flow", () => {
  beforeEach(() => {
    mockUseUserContext.mockReturnValue({
      user: makeUser({ $id: "user-1", id: "user-1" }),
    });
    mockApi.createPost.mockResolvedValue(makePost());
  });

  it("submits image, caption, location, tags, invalidates caches, and redirects", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const file = new File(["image"], "post.png", { type: "image/png" });

    renderWithProviders(<PostForm action="Create" />, { queryClient });

    await user.upload(document.querySelector("input") as HTMLInputElement, file);
    await user.type(
      screen.getByPlaceholderText("Share what made this moment worth posting."),
      "A cache-tested post"
    );
    await user.type(screen.getByPlaceholderText("Ahmedabad, India"), "Mumbai");
    await user.type(screen.getByPlaceholderText("Art, Travel, Weekend"), "art,tests");
    await user.click(screen.getByRole("button", { name: "Create Post" }));

    await waitFor(() => {
      expect(mockApi.createPost).toHaveBeenCalledWith({
        caption: "A cache-tested post",
        file: [file],
        location: "Mumbai",
        tags: "art,tests",
        userId: "user-1",
      });
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.GET_USER_POSTS],
    });
  });
});
