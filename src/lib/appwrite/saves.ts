import { ID, Query } from "appwrite";

import { PostDocument, SaveDocument } from "@/types";
import { appwriteConfig, databases } from "./config";
import { assertResult } from "./utils";
import { getPostById } from "./posts";

const getRelatedDocumentId = (document: PostDocument | string) =>
  typeof document === "string" ? document : document.$id;

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

  return Promise.all(postIds.map((postId) => getPostById(postId)));
}
