import { Models } from "appwrite";

export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type IUpdateUser = {
  userId: string;
  name: string;
  bio: string;
  imageId: string;
  imageUrl: URL | string;
  file: File[];
};

export type INewPost = {
  userId: string;
  caption: string;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: URL | string;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
};

export type UserDocument = Models.Document & {
  accountId: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  imageId?: string;
  bio: string;
  posts?: PostDocument[];
  save?: SaveDocument[];
};

export type PostDocument = Models.Document & {
  creator: UserDocument;
  caption: string;
  imageUrl: string;
  imageId: string;
  location: string;
  tags: string[];
  likes: UserDocument[];
};

export type SaveDocument = Models.Document & {
  user: UserDocument;
  post: PostDocument;
};

export type DocumentList<T extends Models.Document> = Models.DocumentList<T>;
