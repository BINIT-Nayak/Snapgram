import { ID } from "appwrite";

import { SaveDocument } from "@/types";
import { appwriteConfig, databases } from "./config";
import { assertResult } from "./utils";

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
