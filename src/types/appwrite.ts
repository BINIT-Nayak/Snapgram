import { Models } from "appwrite";

export type UserDocument = Models.Document & {
  accountId: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  imageId?: string;
  bio: string;
  followersCount?: number;
  followingCount?: number;
  posts?: PostDocument[];
  save?: SaveDocument[];
};

export type PostDocument = Models.Document & {
  creator: UserDocument;
  caption: string;
  imageUrl: string;
  imageId: string;
  location: string;
  tags?: string[];
  searchableTags?: string;
  likeCount?: number;
  commentCount?: number;
  saveCount?: number;
  likes?: LikeDocument[];
};

export type SaveDocument = Models.Document & {
  user: UserDocument | string;
  post: PostDocument | string;
};

export type LikeDocument = Models.Document & {
  userId: string;
  postId: string;
};

export type FollowDocument = Models.Document & {
  followerId: string;
  followingId: string;
};

export type DocumentList<T extends Models.Document> = Models.DocumentList<T>;
