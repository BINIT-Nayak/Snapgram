import { ID, Query } from "appwrite";

import { FollowDocument, LikeDocument, PostDocument } from "@/types";
import { appwriteConfig, databases } from "./config";
import { assertResult } from "./utils";

const isLikesCollectionConfigured = () => !!appwriteConfig.likesCollectionId;
const isFollowsCollectionConfigured = () => !!appwriteConfig.followsCollectionId;

const relationshipId = (prefix: string, ...parts: string[]) => {
  const value = parts.join(":");
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return ID.custom(`${prefix}_${(hash >>> 0).toString(36)}`);
};

const likeId = (userId: string, postId: string) =>
  relationshipId("like", userId, postId);

const followId = (followerId: string, followingId: string) =>
  relationshipId("follow", followerId, followingId);

export const getLikeUserId = (like: LikeDocument | string) =>
  typeof like === "string" ? like : like.userId;

async function syncPostLikeCount(postId: string) {
  const likes = await getLikesByPostId(postId);

  await databases.updateDocument<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    postId,
    { likeCount: likes.total }
  );

  return likes.total;
}

async function syncPostLikeCountSafely(postId: string) {
  try {
    await syncPostLikeCount(postId);
  } catch {
    // Like relationship writes should not fail just because denormalized counters
    // are not writable from the client. In production, move this to a Function.
  }
}

export async function getLikesByPostId(postId: string) {
  if (!isLikesCollectionConfigured()) {
    return {
      total: 0,
      documents: [],
    };
  }

  return databases.listDocuments<LikeDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.likesCollectionId,
    [Query.equal("postId", postId), Query.orderDesc("$createdAt")]
  );
}

export async function getLikesByPostIds(postIds: string[]) {
  if (!isLikesCollectionConfigured() || postIds.length === 0) {
    return {
      total: 0,
      documents: [],
    };
  }

  const documents: LikeDocument[] = [];
  let offset = 0;
  let total = 0;

  do {
    const page = await databases.listDocuments<LikeDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.likesCollectionId,
      [Query.equal("postId", postIds), Query.limit(100), Query.offset(offset)]
    );

    total = page.total;
    documents.push(...page.documents);
    offset += page.documents.length;
  } while (documents.length < total);

  return {
    total,
    documents,
  };
}

export async function getLikeByUserAndPost(userId: string, postId: string) {
  if (!isLikesCollectionConfigured()) return null;

  const likes = await databases.listDocuments<LikeDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.likesCollectionId,
    [
      Query.equal("userId", userId),
      Query.equal("postId", postId),
      Query.limit(1),
    ]
  );

  return likes.documents[0] || null;
}

export async function likePost(userId: string, postId: string) {
  if (!isLikesCollectionConfigured()) {
    throw new Error("Likes collection is not configured.");
  }

  try {
    const like = await databases.createDocument<LikeDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.likesCollectionId,
      likeId(userId, postId),
      {
        userId,
        postId,
      }
    );

    await syncPostLikeCountSafely(postId);

    return like;
  } catch {
    const like = await getLikeByUserAndPost(userId, postId);

    if (like) {
      await syncPostLikeCountSafely(postId);
    }

    return assertResult(like, "Post like failed.");
  }
}

export async function unlikePost(likeRecordId: string, postId?: string) {
  if (!isLikesCollectionConfigured()) {
    throw new Error("Likes collection is not configured.");
  }

  const statusCode = await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.likesCollectionId,
    likeRecordId
  );

  assertResult(statusCode, "Post unlike failed.");

  if (postId) {
    await syncPostLikeCountSafely(postId);
  }

  return { status: "Ok" };
}

export async function getLikedPosts(userId?: string) {
  if (!userId || !isLikesCollectionConfigured()) return [];

  try {
    const likes = await databases.listDocuments<LikeDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.likesCollectionId,
      [Query.equal("userId", userId), Query.orderDesc("$createdAt")]
    );

    const postIds = likes.documents.map((like) => like.postId).filter(Boolean);

    const posts = await Promise.all(
      postIds.map((postId) =>
        databases.getDocument<PostDocument>(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          postId
        )
      )
    );

    return Promise.all(posts.map((post) => hydratePostLikes(post)));
  } catch {
    return [];
  }
}

export const withLikes = (
  post: PostDocument,
  likes: LikeDocument[]
): PostDocument => ({
  ...post,
  likes: likes.filter((like) => like.postId === post.$id),
  likeCount:
    typeof post.likeCount === "number"
      ? post.likeCount
      : likes.filter((like) => like.postId === post.$id).length,
});

export async function hydratePostLikes(post: PostDocument) {
  try {
    const likes = await getLikesByPostId(post.$id);

    return withLikes(post, likes.documents);
  } catch {
    return withLikes(post, []);
  }
}

export async function hydratePostsLikes<T extends { documents: PostDocument[] }>(
  postList: T
) {
  const postIds = postList.documents.map((post) => post.$id);
  try {
    const likes = await getLikesByPostIds(postIds);

    return {
      ...postList,
      documents: postList.documents.map((post) =>
        withLikes(post, likes.documents)
      ),
    };
  } catch {
    return {
      ...postList,
      documents: postList.documents.map((post) => withLikes(post, [])),
    };
  }
}

export async function getFollowByUsers(
  followerId: string,
  followingId: string
) {
  if (!isFollowsCollectionConfigured()) return null;

  try {
    const follows = await databases.listDocuments<FollowDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal("followerId", followerId),
        Query.equal("followingId", followingId),
        Query.limit(1),
      ]
    );

    return follows.documents[0] || null;
  } catch {
    return null;
  }
}

export async function getFollowsByFollowerAndTargets(
  followerId?: string,
  followingIds: string[] = []
) {
  const targetIds = followingIds.filter(
    (followingId) => followingId && followingId !== followerId
  );

  if (!followerId || !isFollowsCollectionConfigured() || targetIds.length === 0) {
    return {
      total: 0,
      documents: [],
    };
  }

  try {
    return await databases.listDocuments<FollowDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal("followerId", followerId),
        Query.equal("followingId", targetIds),
        Query.limit(Math.min(targetIds.length, 100)),
      ]
    );
  } catch {
    return {
      total: 0,
      documents: [],
    };
  }
}

export async function followUser(followerId: string, followingId: string) {
  if (!isFollowsCollectionConfigured()) {
    throw new Error("Follows collection is not configured.");
  }

  if (followerId === followingId) {
    throw new Error("You cannot follow yourself.");
  }

  try {
    return await databases.createDocument<FollowDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      followId(followerId, followingId),
      {
        followerId,
        followingId,
      }
    );
  } catch {
    const follow = await getFollowByUsers(followerId, followingId);

    return assertResult(follow, "Follow action failed.");
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  if (!isFollowsCollectionConfigured()) {
    throw new Error("Follows collection is not configured.");
  }

  if (followerId === followingId) {
    throw new Error("You cannot unfollow yourself.");
  }

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      followId(followerId, followingId)
    );

    assertResult(statusCode, "Unfollow action failed.");
  } catch {
    const follow = await getFollowByUsers(followerId, followingId);

    if (!follow) return { status: "Ok" };

    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      follow.$id
    );

    assertResult(statusCode, "Unfollow action failed.");
  }

  return { status: "Ok" };
}

export async function getFollowerCount(userId: string) {
  if (!isFollowsCollectionConfigured()) return 0;

  const followers = await databases.listDocuments<FollowDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.followsCollectionId,
    [Query.equal("followingId", userId), Query.limit(1)]
  );

  return followers.total;
}

export async function getFollowingCount(userId: string) {
  if (!isFollowsCollectionConfigured()) return 0;

  const following = await databases.listDocuments<FollowDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.followsCollectionId,
    [Query.equal("followerId", userId), Query.limit(1)]
  );

  return following.total;
}

export async function hydrateUserFollowCounts<T extends { $id: string }>(
  user: T
) {
  const [followersCount, followingCount] = await Promise.all([
    getFollowerCount(user.$id).catch(() => 0),
    getFollowingCount(user.$id).catch(() => 0),
  ]);

  return {
    ...user,
    followersCount,
    followingCount,
  };
}
