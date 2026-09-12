import { Models } from "appwrite";

import {
  DocumentList,
  FollowDocument,
  LikeDocument,
  PostDocument,
  SaveDocument,
  UserDocument,
} from "@/types";

export const makeUser = (
  overrides: Partial<UserDocument> = {}
): UserDocument =>
  ({
    $id: "user-1",
    $createdAt: "2026-01-01T00:00:00.000Z",
    $updatedAt: "2026-01-01T00:00:00.000Z",
    $collectionId: "users",
    $databaseId: "database",
    $permissions: [],
    accountId: "account-1",
    name: "Alex Morgan",
    username: "alex",
    email: "alex@example.com",
    imageUrl: "/avatar.jpg",
    imageId: "avatar-file",
    bio: "Building Snapgram",
    followersCount: 0,
    followingCount: 0,
    save: [],
    ...overrides,
  }) as UserDocument;

export const makePost = (
  overrides: Partial<PostDocument> = {}
): PostDocument =>
  ({
    $id: "post-1",
    $createdAt: "2026-01-01T00:00:00.000Z",
    $updatedAt: "2026-01-01T00:00:00.000Z",
    $collectionId: "posts",
    $databaseId: "database",
    $permissions: [],
    creator: makeUser(),
    caption: "A beautiful test post",
    imageUrl: "/post.jpg",
    imageId: "post-file",
    location: "Ahmedabad, India",
    tags: ["test", "snapgram"],
    likeCount: 0,
    likes: [],
    ...overrides,
  }) as PostDocument;

export const makeSave = (
  overrides: Partial<SaveDocument> = {}
): SaveDocument =>
  ({
    $id: "save-1",
    $createdAt: "2026-01-01T00:00:00.000Z",
    $updatedAt: "2026-01-01T00:00:00.000Z",
    $collectionId: "saves",
    $databaseId: "database",
    $permissions: [],
    user: "user-1",
    post: "post-1",
    ...overrides,
  }) as SaveDocument;

export const makeLike = (
  overrides: Partial<LikeDocument> = {}
): LikeDocument =>
  ({
    $id: "like-1",
    $createdAt: "2026-01-01T00:00:00.000Z",
    $updatedAt: "2026-01-01T00:00:00.000Z",
    $collectionId: "likes",
    $databaseId: "database",
    $permissions: [],
    userId: "user-1",
    postId: "post-1",
    ...overrides,
  }) as LikeDocument;

export const makeFollow = (
  overrides: Partial<FollowDocument> = {}
): FollowDocument =>
  ({
    $id: "follow-1",
    $createdAt: "2026-01-01T00:00:00.000Z",
    $updatedAt: "2026-01-01T00:00:00.000Z",
    $collectionId: "follows",
    $databaseId: "database",
    $permissions: [],
    followerId: "user-1",
    followingId: "user-2",
    ...overrides,
  }) as FollowDocument;

export const makeDocumentList = <T extends Models.Document>(
  documents: T[]
): DocumentList<T> =>
  ({
    total: documents.length,
    documents,
  }) as DocumentList<T>;
