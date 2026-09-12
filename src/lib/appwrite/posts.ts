import { ID, Query } from "appwrite";

import { NewPost, PostDocument, UpdatePostInput } from "@/types";
import { appwriteConfig, databases } from "./config";
import { hydratePostLikes, hydratePostsLikes } from "./relationships";
import { deleteFile, getFilePreview, uploadFile } from "./storage";
import { assertResult, parseTags } from "./utils";

export async function createPost(post: NewPost) {
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
  const normalizedSearch = searchTerm.trim().toLowerCase();

  try {
    const posts = await databases.listDocuments<PostDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.search("caption", searchTerm)]
    );

    return hydratePostsLikes(posts);
  } catch {
    const posts = await databases.listDocuments<PostDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(50)]
    );

    const filteredPosts = {
      ...posts,
      documents: posts.documents.filter((post) => {
        const searchableText = [
          post.caption,
          post.location,
          post.creator?.name,
          post.creator?.username,
          ...(post.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      }),
    };

    return hydratePostsLikes(filteredPosts);
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam?: string }) {
  const queries: string[] = [Query.orderDesc("$updatedAt"), Query.limit(9)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam));
  }

  const posts = await databases.listDocuments<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    queries
  );

  return hydratePostsLikes(posts);
}

export async function getPostById(postId?: string) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const post = await databases.getDocument<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    postId
  );

  return hydratePostLikes(post);
}

export async function updatePost(post: UpdatePostInput) {
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

export async function getUserPosts(userId?: string) {
  if (!userId) return;

  const posts = await databases.listDocuments<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
  );

  return hydratePostsLikes(posts);
}

export async function getRecentPosts() {
  const posts = await databases.listDocuments<PostDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    [Query.orderDesc("$createdAt"), Query.limit(20)]
  );

  return hydratePostsLikes(posts);
}
