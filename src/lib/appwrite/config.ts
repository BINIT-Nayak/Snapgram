import { Client, Account, Databases, Storage, Avatars } from "appwrite";

const getRequiredEnv = (key: string) => {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const appwriteConfig = {
  url: getRequiredEnv("VITE_APPWRITE_URL"),
  projectId: getRequiredEnv("VITE_APPWRITE_PROJECT_ID"),
  databaseId: getRequiredEnv("VITE_APPWRITE_DATABASE_ID"),
  storageId: getRequiredEnv("VITE_APPWRITE_STORAGE_ID"),
  userCollectionId: getRequiredEnv("VITE_APPWRITE_USER_COLLECTION_ID"),
  postCollectionId: getRequiredEnv("VITE_APPWRITE_POST_COLLECTION_ID"),
  savesCollectionId: getRequiredEnv("VITE_APPWRITE_SAVES_COLLECTION_ID"),
};

export const client = new Client();

client.setEndpoint(appwriteConfig.url);
client.setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
