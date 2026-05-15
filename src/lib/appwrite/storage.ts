import { ID, Permission, Role } from "appwrite";

import { appwriteConfig, storage } from "./config";

export async function uploadFile(file: File) {
  if (!file) {
    throw new Error("Please select an image before posting.");
  }

  return storage.createFile(appwriteConfig.storageId, ID.unique(), file, [
    Permission.read(Role.any()),
  ]);
}

export function getFilePreview(fileId: string) {
  return storage.getFileView(appwriteConfig.storageId, fileId);
}

export async function deleteFile(fileId: string) {
  await storage.deleteFile(appwriteConfig.storageId, fileId);

  return { status: "ok" };
}
