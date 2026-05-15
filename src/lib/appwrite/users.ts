import { Query } from "appwrite";

import { UpdateUserInput, UserDocument } from "@/types";
import { appwriteConfig, databases } from "./config";
import { deleteFile, getFilePreview, uploadFile } from "./storage";
import { assertResult } from "./utils";

export async function getUsers(limit?: number) {
  const queries: string[] = [Query.orderDesc("$createdAt")];

  if (limit) {
    queries.push(Query.limit(limit));
  }

  return databases.listDocuments<UserDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    queries
  );
}

export async function getUserById(userId: string) {
  return databases.getDocument<UserDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    userId
  );
}

export async function updateUser(user: UpdateUserInput) {
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

  const updatedUser = await databases.updateDocument<UserDocument>(
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

export async function followUser(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) {
    throw new Error("You cannot follow yourself.");
  }

  const [currentUser, targetUser] = await Promise.all([
    getUserById(currentUserId),
    getUserById(targetUserId),
  ]);

  const following = Array.from(
    new Set([...(currentUser.following || []), targetUserId])
  );
  const followers = Array.from(
    new Set([...(targetUser.followers || []), currentUserId])
  );

  await Promise.all([
    databases.updateDocument<UserDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      currentUserId,
      { following }
    ),
    databases.updateDocument<UserDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      targetUserId,
      { followers }
    ),
  ]);

  return { status: "Ok" };
}

export async function unfollowUser(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) {
    throw new Error("You cannot unfollow yourself.");
  }

  const [currentUser, targetUser] = await Promise.all([
    getUserById(currentUserId),
    getUserById(targetUserId),
  ]);

  const following = (currentUser.following || []).filter(
    (userId) => userId !== targetUserId
  );
  const followers = (targetUser.followers || []).filter(
    (userId) => userId !== currentUserId
  );

  await Promise.all([
    databases.updateDocument<UserDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      currentUserId,
      { following }
    ),
    databases.updateDocument<UserDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      targetUserId,
      { followers }
    ),
  ]);

  return { status: "Ok" };
}
