import { ID, Query } from "appwrite";

import { DocumentList, PostDocument, SaveDocument } from "@/types";
import { appwriteConfig, databases } from "./config";
import { hydratePostsLikes } from "./relationships";
import { assertResult } from "./utils";

const getRelatedDocumentId = (document: PostDocument | string) =>
  typeof document === "string" ? document : document.$id;

const getRelatedPostDocument = (document: PostDocument | string) =>
  typeof document === "string" ? undefined : document;

export async function savePost(userId: string, postId: string) {
  const savedPost = await databases.createDocument<SaveDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.savesCollectionId,
    ID.unique(),
    {
      user: userId,
      post: postId,
    }
  );

  return assertResult(savedPost, "Post save failed.");
}

export async function deleteSavedPost(savedRecordId: string) {
  const statusCode = await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.savesCollectionId,
    savedRecordId
  );

  assertResult(statusCode, "Saved post deletion failed.");

  return { status: "Ok" };
}

export async function getSavedPosts(userId?: string) {
  if (!userId) {
    return [];
  }

  const savedRecords = await databases.listDocuments<SaveDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.savesCollectionId,
    [Query.equal("user", userId), Query.orderDesc("$createdAt")]
  );

  const postIds = savedRecords.documents
    .map((record) => getRelatedDocumentId(record.post))
    .filter(Boolean);

  const embeddedPosts = savedRecords.documents
    .map((record) => getRelatedPostDocument(record.post))
    .filter((post): post is PostDocument => !!post);
  const embeddedPostsById = new Map(
    embeddedPosts.map((post) => [post.$id, post])
  );
  const missingPostIds = postIds.filter((postId) => !embeddedPostsById.has(postId));
  const fetchedPosts =
    missingPostIds.length > 0
      ? await databases.listDocuments<PostDocument>(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          [Query.equal("$id", missingPostIds), Query.limit(missingPostIds.length)]
        )
      : ({
          total: embeddedPosts.length,
          documents: [],
        } as DocumentList<PostDocument>);
  const postsById = new Map([
    ...embeddedPostsById,
    ...fetchedPosts.documents.map(
      (post) => [post.$id, post] as [string, PostDocument]
    ),
  ]);
  const orderedPosts = postIds
    .map((postId) => postsById.get(postId))
    .filter((post): post is PostDocument => !!post);
  const hydratedPosts = await hydratePostsLikes({
    total: orderedPosts.length,
    documents: orderedPosts,
  } as DocumentList<PostDocument>);

  return hydratedPosts.documents;
}
