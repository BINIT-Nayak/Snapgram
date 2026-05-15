import { ID, Permission, Query, Role } from "appwrite";

import { appwriteConfig, account, databases, storage, avatars } from "./config";
import { IUpdatePost, INewPost, INewUser, IUpdateUser } from "@/types";

const assertResult = <T>(value: T | null | undefined, message: string): T => {
  if (!value) {
    throw new Error(message);
  }

  return value;
};

// ============================================================
// AUTH
// ============================================================

// ============================== SIGN UP
export async function createUserAccount(user: INewUser) {
  const newAccount = await account.create(
    ID.unique(),
    user.email,
    user.password,
    user.name
  );

  const avatarUrl = avatars.getInitials(user.name);

  return saveUserToDB({
    accountId: newAccount.$id,
    name: newAccount.name,
    email: newAccount.email,
    username: user.username,
    imageUrl: avatarUrl,
  });
}

// ============================== SAVE USER TO DB
export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: URL;
  username?: string;
}) {
  return databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    ID.unique(),
    user
  );
}

// ============================== SIGN IN
export async function signInAccount(user: { email: string; password: string }) {
  return account.createEmailSession(user.email, user.password);
}

// ============================== GET ACCOUNT
export async function getAccount() {
  return account.get();
}

// ============================== GET USER
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    return currentUser.documents[0];
  } catch {
    return null;
  }
}

// ============================== SIGN OUT
export async function signOutAccount() {
  return account.deleteSession("current");
}

// ============================================================
// POSTS
// ============================================================

// ============================== CREATE POST
export async function createPost(post: INewPost) {
  const uploadedFile = await uploadFile(post.file[0]);
  const fileUrl = getFilePreview(uploadedFile.$id);

  if (!fileUrl) {
    await deleteFile(uploadedFile.$id);
    throw new Error("Could not create file view URL.");
  }

  const tags = post.tags?.replace(/ /g, "").split(",").filter(Boolean) || [];

  const newPost = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    ID.unique(),
    {
      creator: post.userId,
      caption: post.caption,
      imageUrl: fileUrl.toString(),
      imageId: uploadedFile.$id,
      location: post.location,
      tags: tags,
    }
  );

  return assertResult(newPost, "Post creation failed.");
}

// ============================== UPLOAD FILE
export async function uploadFile(file: File) {
  if (!file) {
    throw new Error("Please select an image before posting.");
  }

  return storage.createFile(appwriteConfig.storageId, ID.unique(), file, [
    Permission.read(Role.any()),
  ]);
}

// ============================== GET FILE URL
export function getFilePreview(fileId: string) {
  return storage.getFileView(appwriteConfig.storageId, fileId);
}

// ============================== DELETE FILE
export async function deleteFile(fileId: string) {
  await storage.deleteFile(appwriteConfig.storageId, fileId);

  return { status: "ok" };
}

// ============================== GET POSTS
export async function searchPosts(searchTerm: string) {
  return databases.listDocuments(
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

  return databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    queries
  );
}

// ============================== GET POST BY ID
export async function getPostById(postId?: string) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  return databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    postId
  );
}

// ============================== UPDATE POST
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

  const tags = post.tags?.replace(/ /g, "").split(",").filter(Boolean) || [];

  const updatedPost = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    post.postId,
    {
      caption: post.caption,
      imageUrl: image.imageUrl.toString(),
      imageId: image.imageId,
      location: post.location,
      tags: tags,
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

// ============================== DELETE POST
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

// ============================== LIKE / UNLIKE POST
export async function likePost(postId: string, likesArray: string[]) {
  const updatedPost = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    postId,
    {
      likes: likesArray,
    }
  );

  return assertResult(updatedPost, "Post like update failed.");
}

// ============================== SAVE POST
export async function savePost(userId: string, postId: string) {
  const savedPost = await databases.createDocument(
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
// ============================== DELETE SAVED POST
export async function deleteSavedPost(savedRecordId: string) {
  const statusCode = await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.savesCollectionId,
    savedRecordId
  );

  assertResult(statusCode, "Saved post deletion failed.");

  return { status: "Ok" };
}

// ============================== GET USER'S POST
export async function getUserPosts(userId?: string) {
  if (!userId) return;

  return databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
  );
}

// ============================== GET POPULAR POSTS (BY HIGHEST LIKE COUNT)
export async function getRecentPosts() {
  return databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    [Query.orderDesc("$createdAt"), Query.limit(20)]
  );
}

// ============================================================
// USER
// ============================================================

// ============================== GET USERS
export async function getUsers(limit?: number) {
  const queries: string[] = [Query.orderDesc("$createdAt")];

  if (limit) {
    queries.push(Query.limit(limit));
  }

  return databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    queries
  );
}

// ============================== GET USER BY ID
export async function getUserById(userId: string) {
  return databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    userId
  );
}

// ============================== UPDATE USER
export async function updateUser(user: IUpdateUser) {
  const hasFileToUpdate = user.file.length > 0;
  let image = {
    imageUrl: user.imageUrl,
    imageId: user.imageId,
  };

  if (hasFileToUpdate) {
    const uploadedFile = await uploadFile(user.file[0]);
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

  const updatedUser = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    user.userId,
    {
      name: user.name,
      bio: user.bio,
      imageUrl: image.imageUrl.toString(),
      imageId: image.imageId,
    }
  );

  if (!updatedUser && hasFileToUpdate) {
    await deleteFile(image.imageId);
  }

  const result = assertResult(updatedUser, "User update failed.");

  if (user.imageId && hasFileToUpdate) {
    await deleteFile(user.imageId);
  }

  return result;
}
