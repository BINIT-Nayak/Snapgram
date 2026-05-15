import { ID, Query } from "appwrite";

import { NewUser, UserDocument } from "@/types";
import { appwriteConfig, account, avatars, databases } from "./config";

export async function createUserAccount(user: NewUser) {
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

export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: URL;
  username?: string;
}) {
  return databases.createDocument<UserDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    ID.unique(),
    user
  );
}

export async function signInAccount(user: { email: string; password: string }) {
  return account.createEmailSession(user.email, user.password);
}

export async function getAccount() {
  return account.get();
}

export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();

    const currentUser = await databases.listDocuments<UserDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    return currentUser.documents[0] || null;
  } catch {
    return null;
  }
}

export async function signOutAccount() {
  return account.deleteSession("current");
}
