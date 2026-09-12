import { Models, Query } from "appwrite";

import {
  DocumentList,
  PostDocument,
  SnapgramSearchResults,
  UserDocument,
} from "@/types";
import { appwriteConfig, databases } from "./config";
import { hydratePostsLikes } from "./relationships";

const emptyDocumentList = <T extends Models.Document>(): DocumentList<T> =>
  ({
    total: 0,
    documents: [],
  } as DocumentList<T>);

const normalize = (value: string) => value.trim().toLowerCase();

const uniqueById = <T extends Models.Document>(items: T[]) =>
  Array.from(new Map(items.map((item) => [item.$id, item])).values());

const toDocumentList = <T extends Models.Document>(
  documents: T[]
): DocumentList<T> =>
  ({
    total: documents.length,
    documents,
  } as DocumentList<T>);

const safeListPosts = async (queries: string[]) => {
  try {
    return await databases.listDocuments<PostDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries
    );
  } catch {
    return emptyDocumentList<PostDocument>();
  }
};

const safeListUsers = async (queries: string[]) => {
  try {
    return await databases.listDocuments<UserDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries
    );
  } catch {
    return emptyDocumentList<UserDocument>();
  }
};

const buildTagResults = (posts: PostDocument[], searchTerm: string) => {
  const normalizedTerm = normalize(searchTerm);
  const tags = posts.flatMap((post) => post.tags || []);
  const tagCounts = tags.reduce<Map<string, number>>((counts, tag) => {
    const normalizedTag = normalize(tag);

    if (!normalizedTag.includes(normalizedTerm)) return counts;

    counts.set(normalizedTag, (counts.get(normalizedTag) || 0) + 1);
    return counts;
  }, new Map());

  return [...tagCounts.entries()]
    .map(([tag, postCount]) => ({ tag, postCount }))
    .sort((first, second) => second.postCount - first.postCount)
    .slice(0, 12);
};

const buildLocationResults = (posts: PostDocument[], searchTerm: string) => {
  const normalizedTerm = normalize(searchTerm);
  const locationCounts = posts.reduce<Map<string, number>>((counts, post) => {
    const location = post.location?.trim();

    if (!location || !normalize(location).includes(normalizedTerm)) {
      return counts;
    }

    counts.set(location, (counts.get(location) || 0) + 1);
    return counts;
  }, new Map());

  return [...locationCounts.entries()]
    .map(([location, postCount]) => ({ location, postCount }))
    .sort((first, second) => second.postCount - first.postCount)
    .slice(0, 12);
};

export async function searchSnapgram(searchTerm: string): Promise<SnapgramSearchResults> {
  const trimmedSearch = searchTerm.trim();

  if (!trimmedSearch) {
    return {
      posts: emptyDocumentList<PostDocument>(),
      people: emptyDocumentList<UserDocument>(),
      tags: [],
      locations: [],
    };
  }

  const [
    captionPosts,
    locationPosts,
    tagPosts,
    usersByName,
    usersByUsername,
  ] = await Promise.all([
    safeListPosts([Query.search("caption", trimmedSearch), Query.limit(20)]),
    safeListPosts([Query.search("location", trimmedSearch), Query.limit(20)]),
    safeListPosts([Query.search("searchableTags", trimmedSearch), Query.limit(20)]),
    safeListUsers([Query.search("name", trimmedSearch), Query.limit(20)]),
    safeListUsers([Query.search("username", trimmedSearch), Query.limit(20)]),
  ]);
  const matchedPosts = uniqueById([
    ...captionPosts.documents,
    ...locationPosts.documents,
    ...tagPosts.documents,
  ]);
  const hydratedPosts = await hydratePostsLikes(toDocumentList(matchedPosts));

  return {
    posts: hydratedPosts,
    people: toDocumentList(
      uniqueById([...usersByName.documents, ...usersByUsername.documents])
    ),
    tags: buildTagResults(matchedPosts, trimmedSearch),
    locations: buildLocationResults(matchedPosts, trimmedSearch),
  };
}
