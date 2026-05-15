import { ID, Query } from "appwrite";

import { INewPost, IUpdatePost, PostDocument } from "@/types";
import { appwriteConfig, databases } from "./config";
import { deleteFile, getFilePreview, uploadFile } from "./storage";
import { assertResult, parseTags } from "./utils";

export async function createPost(post: INewPost) {
  const uploadedFile = await uploadFile(post.file[0]);
  const fileUrl = getFilePreview(uploadedFile.$id);

  if (!fileUrl) {
    await deleteFile(uploadedFile.$id);
    throw new Error("Could not create file view URL.");
  }

  const newPost = await databases.createDocument<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    ID.unique(),
    {
      creator: post.userId,
      caption: post.caption,
      imageUrl: fileUrl.toString(),
      imageId: uploadedFile.$id,
      location: post.location,
      tags: parseTags(post.tags),
    }
  );

  return assertResult(newPost, "Post creation failed.");
}

export async function searchPosts(searchTerm: string) {
  return databases.listDocuments<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    [Query.search("caption", searchTerm)]
  );
}

export async function getInfinitePosts({ pageParam }: { pageParam?: string }) {
  const queries: string[] = [Query.orderDesc("$updatedAt"), Query.limit(9)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam));
  }

  return databases.listDocuments<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    queries
  );
}

export async function getPostById(postId?: string) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  return databases.getDocument<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    postId
  );
}

export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  let image: { imageUrl: string | URL; imageId: string } = {
    imageUrl: post.imageUrl,
    imageId: post.imageId,
  };

  if (hasFileToUpdate) {
    const uploadedFile = await uploadFile(post.file[0]);
    const fileUrl = getFilePreview(uploadedFile.$id);

    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw new Error("Could not create file view URL.");
    }

    image = {
      ...image,
      imageUrl: fileUrl.toString(),
      imageId: uploadedFile.$id,
    };
  }

  const updatedPost = await databases.updateDocument<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    post.postId,
    {
      caption: post.caption,
      imageUrl: image.imageUrl.toString(),
      imageId: image.imageId,
      location: post.location,
      tags: parseTags(post.tags),
    }
  );

  if (!updatedPost && hasFileToUpdate) {
    await deleteFile(image.imageId);
  }

  const result = assertResult(updatedPost, "Post update failed.");

  if (hasFileToUpdate) {
    await deleteFile(post.imageId);
  }

  return result;
}

export async function deletePost(postId?: string, imageId?: string) {
  if (!postId || !imageId) return;

  const statusCode = await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    postId
  );

  assertResult(statusCode, "Post deletion failed.");
  await deleteFile(imageId);

  return { status: "Ok" };
}

export async function likePost(postId: string, likesArray: string[]) {
  const updatedPost = await databases.updateDocument<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    postId,
    {
      likes: likesArray,
    }
  );

  return assertResult(updatedPost, "Post like update failed.");
}

export async function getUserPosts(userId?: string) {
  if (!userId) return;

  return databases.listDocuments<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
  );
}

export async function getRecentPosts() {
  return databases.listDocuments<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    [Query.orderDesc("$createdAt"), Query.limit(20)]
  );
}
