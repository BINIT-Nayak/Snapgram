import type { NavLink } from "./navigation";
import type {
  AuthUser,
  NewPost,
  NewUser,
  UpdatePostInput,
  UpdateUserInput,
} from "./forms";

export type { DocumentList, PostDocument, SaveDocument, UserDocument } from "./appwrite";
export type {
  AuthUser,
  NewPost,
  NewUser,
  UpdatePostInput,
  UpdateUserInput,
} from "./forms";
export type { NavLink } from "./navigation";

export type INavLink = NavLink;
export type INewPost = NewPost;
export type INewUser = NewUser;
export type IUpdatePost = UpdatePostInput;
export type IUpdateUser = UpdateUserInput;
export type IUser = AuthUser;
