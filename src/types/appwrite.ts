import { Models } from "appwrite";

export type UserDocument = Models.Document & {
  accountId: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  imageId?: string;
  bio: string;
  followers?: string[];
  following?: string[];
  posts?: PostDocument[];
  save?: SaveDocument[];
  liked?: PostDocument[];
};

export type PostDocument = Models.Document & {
  creator: UserDocument;
  caption: string;
  imageUrl: string;
  imageId: string;
  location: string;
  tags?: string[];
  likes?: UserDocument[];
};

export type SaveDocument = Models.Document & {
  user: UserDocument | string;
  post: PostDocument | string;
};

export type DocumentList<T extends Models.Document> = Models.DocumentList<T>;
