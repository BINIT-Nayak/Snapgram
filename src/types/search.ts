import type { DocumentList, PostDocument, UserDocument } from "./appwrite";

export type ExploreSearchType = "all" | "posts" | "people" | "tags" | "locations";

export type TagSearchResult = {
  tag: string;
  postCount: number;
};

export type LocationSearchResult = {
  location: string;
  postCount: number;
};

export type SnapgramSearchResults = {
  posts: DocumentList<PostDocument>;
  people: DocumentList<UserDocument>;
  tags: TagSearchResult[];
  locations: LocationSearchResult[];
};
