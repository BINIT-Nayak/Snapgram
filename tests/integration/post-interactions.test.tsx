import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PostStats from "@/components/shared/PostStats";
import { useGetPostById } from "@/lib/react-query/queries";
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";
import {
  makeDocumentList,
  makeLike,
  makePost,
  makeSave,
  makeUser,
} from "../utils/factories";
import { createTestQueryClient, renderWithProviders } from "../utils/render";

const mockApi = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getPostById: vi.fn(),
  likePost: vi.fn(),
  unlikePost: vi.fn(),
  savePost: vi.fn(),
  deleteSavedPost: vi.fn(),
}));

vi.mock("@/lib/appwrite/api", () => ({
  createUserAccount: vi.fn(),
  signInAccount: vi.fn(),
  getCurrentUser: mockApi.getCurrentUser,
  signOutAccount: vi.fn(),
  getUsers: vi.fn(),
  createPost: vi.fn(),
  getPostById: mockApi.getPostById,
  updatePost: vi.fn(),
  getUserPosts: vi.fn(),
  deletePost: vi.fn(),
  likePost: mockApi.likePost,
  unlikePost: mockApi.unlikePost,
  getUserById: vi.fn(),
  followUser: vi.fn(),
  updateUser: vi.fn(),
  unfollowUser: vi.fn(),
  getFollowByUsers: vi.fn(),
  getLikedPosts: vi.fn(),
  getMostLikedPosts: vi.fn(),
  getRecentPosts: vi.fn(),
  getInfinitePosts: vi.fn(),
  searchPosts: vi.fn(),
  savePost: mockApi.savePost,
  deleteSavedPost: mockApi.deleteSavedPost,
  getSavedPosts: vi.fn(),
  getLikeUserId: vi.fn((like: { userId?: string } | string) =>
    typeof like === "string" ? like : like.userId
  ),
}));

const PostStatsFromCache = ({ postId }: { postId: string }) => {
  const { data: post } = useGetPostById(postId);

  if (!post) return null;

  return <PostStats post={post} userId="user-1" />;
};

const setupCache = (queryClient: QueryClient) => {
  const currentUser = makeUser({ $id: "user-1" });
  const post = makePost({
    $id: "post-1",
    likes: [],
    creator: makeUser({ $id: "creator-1" }),
  });

  queryClient.setQueryData([QUERY_KEYS.GET_CURRENT_USER], currentUser);
  queryClient.setQueryData([QUERY_KEYS.GET_POST_BY_ID, post.$id], post);
  queryClient.setQueryData(
    [QUERY_KEYS.GET_RECENT_POSTS],
    makeDocumentList([post])
  );

  return { currentUser, post };
};

describe("post interaction optimistic cache updates", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockApi.getCurrentUser.mockResolvedValue(makeUser({ $id: "user-1" }));
    mockApi.getPostById.mockResolvedValue(makePost({ $id: "post-1" }));
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("updates the like count immediately and rolls back when the API fails", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    setupCache(queryClient);
    let rejectLike!: (error: Error) => void;
    mockApi.likePost.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectLike = reject;
      })
    );

    renderWithProviders(<PostStatsFromCache postId="post-1" />, { queryClient });

    await user.click(screen.getByRole("button", { name: "Like post" }));

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlike post" })).toBeInTheDocument();

    rejectLike(new Error("Like failed"));

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Like post" })).toBeInTheDocument();
  });

  it("removes a like immediately and rolls back when the API fails", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    const existingLike = makeLike({
      $id: "like-1",
      userId: "user-1",
      postId: "post-1",
    });
    const post = makePost({
      $id: "post-1",
      likes: [existingLike],
      creator: makeUser({ $id: "creator-1" }),
    });
    let rejectUnlike!: (error: Error) => void;

    queryClient.setQueryData(
      [QUERY_KEYS.GET_CURRENT_USER],
      makeUser({ $id: "user-1" })
    );
    queryClient.setQueryData([QUERY_KEYS.GET_POST_BY_ID, post.$id], post);
    mockApi.getPostById.mockResolvedValue(post);
    mockApi.unlikePost.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectUnlike = reject;
      })
    );

    renderWithProviders(<PostStatsFromCache postId="post-1" />, { queryClient });

    await user.click(screen.getByRole("button", { name: "Unlike post" }));

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Like post" })).toBeInTheDocument();

    rejectUnlike(new Error("Unlike failed"));

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Unlike post" })).toBeInTheDocument();
  });

  it("saves immediately and rolls back when save creation fails", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    setupCache(queryClient);
    let rejectSave!: (error: Error) => void;
    mockApi.savePost.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectSave = reject;
      })
    );

    renderWithProviders(<PostStatsFromCache postId="post-1" />, { queryClient });

    await user.click(screen.getByRole("button", { name: "Save post" }));

    expect(
      screen.getByRole("button", { name: "Remove saved post" })
    ).toBeInTheDocument();

    rejectSave(new Error("Save failed"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save post" })).toBeInTheDocument();
    });
  });

  it("removes a saved post immediately and rolls back when deletion fails", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    const saveRecord = makeSave({
      $id: "save-1",
      user: "user-1",
      post: makePost({ $id: "post-1" }),
    });
    const currentUser = makeUser({ $id: "user-1", save: [saveRecord] });
    const post = makePost({ $id: "post-1" });
    let rejectDelete!: (error: Error) => void;

    queryClient.setQueryData([QUERY_KEYS.GET_CURRENT_USER], currentUser);
    queryClient.setQueryData([QUERY_KEYS.GET_POST_BY_ID, post.$id], post);
    mockApi.getCurrentUser.mockResolvedValue(currentUser);
    mockApi.getPostById.mockResolvedValue(post);
    mockApi.deleteSavedPost.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectDelete = reject;
      })
    );

    renderWithProviders(<PostStatsFromCache postId="post-1" />, { queryClient });

    await user.click(screen.getByRole("button", { name: "Remove saved post" }));

    expect(screen.getByRole("button", { name: "Save post" })).toBeInTheDocument();

    rejectDelete(new Error("Delete failed"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Remove saved post" })
      ).toBeInTheDocument();
    });
  });
});
