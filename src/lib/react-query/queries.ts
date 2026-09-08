import {
  InfiniteData,
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  QueryFunctionContext,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/react-query/queryKeys";
import {
  invalidateCurrentUser,
  invalidatePostDetail,
  invalidatePostLists,
  invalidateSavedPosts,
  invalidateUserDetail,
  invalidateUserPosts,
  invalidateUsers,
} from "@/lib/react-query/invalidation";
import {
  createUserAccount,
  signInAccount,
  getCurrentUser,
  signOutAccount,
  getUsers,
  createPost,
  getPostById,
  updatePost,
  getUserPosts,
  deletePost,
  likePost,
  getUserById,
  followUser,
  updateUser,
  unfollowUser,
  getRecentPosts,
  getInfinitePosts,
  searchPosts,
  savePost,
  deleteSavedPost,
  getSavedPosts,
} from "@/lib/appwrite/api";
import {
  DocumentList,
  NewPost,
  NewUser,
  PostDocument,
  SaveDocument,
  UpdatePostInput,
  UpdateUserInput,
  UserDocument,
} from "@/types";

type QuerySnapshot = Array<{
  queryKey: QueryKey;
  data: unknown;
}>;

type LikePostInput = {
  postId: string;
  likesArray: string[];
  userId: string;
  post: PostDocument;
};

type SavePostInput = {
  userId: string;
  postId: string;
  post: PostDocument;
};

type DeleteSavedPostInput = {
  savedRecordId: string;
  postId: string;
};

const getRelatedPostId = (post: PostDocument | string | undefined) =>
  typeof post === "string" ? post : post?.$id;

const uniqueSnapshots = (snapshots: QuerySnapshot) => {
  const seen = new Set<string>();

  return snapshots.filter(({ queryKey }) => {
    const key = JSON.stringify(queryKey);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const snapshotQueries = (
  queryClient: QueryClient,
  queryKeys: QueryKey[]
): QuerySnapshot =>
  uniqueSnapshots(
    queryKeys.flatMap((queryKey) =>
      queryClient
        .getQueriesData({ queryKey })
        .map(([key, data]) => ({ queryKey: key, data }))
    )
  );

const restoreQueries = (queryClient: QueryClient, snapshots?: QuerySnapshot) => {
  snapshots?.forEach(({ queryKey, data }) => {
    queryClient.setQueryData(queryKey, data);
  });
};

const updatePostInList = (
  data: DocumentList<PostDocument> | undefined,
  postId: string,
  updatePost: (post: PostDocument) => PostDocument
) => {
  if (!data) return data;

  return {
    ...data,
    documents: data.documents.map((post) =>
      post.$id === postId ? updatePost(post) : post
    ),
  };
};

const updatePostInInfiniteList = (
  data: InfiniteData<DocumentList<PostDocument>> | undefined,
  postId: string,
  updatePost: (post: PostDocument) => PostDocument
) => {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      documents: page.documents.map((post) =>
        post.$id === postId ? updatePost(post) : post
      ),
    })),
  };
};

const updatePostArray = (
  posts: PostDocument[] | undefined,
  postId: string,
  updatePost: (post: PostDocument) => PostDocument
) => posts?.map((post) => (post.$id === postId ? updatePost(post) : post));

const updatePostCaches = (
  queryClient: QueryClient,
  postId: string,
  updatePost: (post: PostDocument) => PostDocument
) => {
  queryClient.setQueryData<PostDocument>(
    [QUERY_KEYS.GET_POST_BY_ID, postId],
    (post) => (post ? updatePost(post) : post)
  );

  queryClient.setQueriesData<DocumentList<PostDocument>>(
    { queryKey: [QUERY_KEYS.GET_RECENT_POSTS] },
    (data) => updatePostInList(data, postId, updatePost)
  );

  queryClient.setQueriesData<InfiniteData<DocumentList<PostDocument>>>(
    { queryKey: [QUERY_KEYS.GET_INFINITE_POSTS] },
    (data) => updatePostInInfiniteList(data, postId, updatePost)
  );

  queryClient.setQueriesData<DocumentList<PostDocument>>(
    { queryKey: [QUERY_KEYS.GET_USER_POSTS] },
    (data) => updatePostInList(data, postId, updatePost)
  );

  queryClient.setQueriesData<DocumentList<PostDocument>>(
    { queryKey: [QUERY_KEYS.SEARCH_POSTS] },
    (data) => updatePostInList(data, postId, updatePost)
  );

  queryClient.setQueriesData<PostDocument[]>(
    { queryKey: [QUERY_KEYS.GET_SAVED_POSTS] },
    (posts) => updatePostArray(posts, postId, updatePost)
  );
};

const buildOptimisticLikes = (
  post: PostDocument,
  likesArray: string[],
  currentUser?: UserDocument | null
) =>
  likesArray.map((likedUserId) => {
    const existingLikedUser = (post.likes || []).find(
      (likedUser) => likedUser.$id === likedUserId
    );

    if (existingLikedUser) return existingLikedUser;
    if (currentUser?.$id === likedUserId) return currentUser;

    return { $id: likedUserId } as UserDocument;
  });

const updateCurrentUserLikedPosts = (
  queryClient: QueryClient,
  userId: string,
  post: PostDocument,
  isLiked: boolean
) => {
  const updateUser = (user?: UserDocument | null) => {
    if (!user || user.$id !== userId) return user;

    const likedPosts = user.liked || [];
    const nextLikedPosts = isLiked
      ? [
          post,
          ...likedPosts.filter((likedPost) => likedPost.$id !== post.$id),
        ]
      : likedPosts.filter((likedPost) => likedPost.$id !== post.$id);

    return {
      ...user,
      liked: nextLikedPosts,
    };
  };

  queryClient.setQueryData<UserDocument | null>(
    [QUERY_KEYS.GET_CURRENT_USER],
    updateUser
  );
  queryClient.setQueryData<UserDocument>(
    [QUERY_KEYS.GET_USER_BY_ID, userId],
    (user) => (user ? (updateUser(user) as UserDocument) : user)
  );
};

const updateCurrentUserSavedPosts = (
  queryClient: QueryClient,
  userId: string,
  postId: string,
  savedRecord?: SaveDocument
) => {
  const updateUser = (user?: UserDocument | null) => {
    if (!user || user.$id !== userId) return user;

    const savedRecords = user.save || [];
    const nextSavedRecords = savedRecord
      ? [
          savedRecord,
          ...savedRecords.filter(
            (record) => getRelatedPostId(record.post) !== postId
          ),
        ]
      : savedRecords.filter((record) => getRelatedPostId(record.post) !== postId);

    return {
      ...user,
      save: nextSavedRecords,
    };
  };

  queryClient.setQueryData<UserDocument | null>(
    [QUERY_KEYS.GET_CURRENT_USER],
    updateUser
  );
  queryClient.setQueryData<UserDocument>(
    [QUERY_KEYS.GET_USER_BY_ID, userId],
    (user) => (user ? (updateUser(user) as UserDocument) : user)
  );
};

const updateSavedPostLists = (
  queryClient: QueryClient,
  post: PostDocument,
  isSaved: boolean
) => {
  queryClient.setQueriesData<PostDocument[]>(
    { queryKey: [QUERY_KEYS.GET_SAVED_POSTS] },
    (posts) => {
      if (!posts) return posts;

      if (isSaved) {
        return [post, ...posts.filter((savedPost) => savedPost.$id !== post.$id)];
      }

      return posts.filter((savedPost) => savedPost.$id !== post.$id);
    }
  );
};

const cancelPostInteractionQueries = (queryClient: QueryClient, postId: string) =>
  Promise.all([
    queryClient.cancelQueries({ queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId] }),
    queryClient.cancelQueries({ queryKey: [QUERY_KEYS.GET_RECENT_POSTS] }),
    queryClient.cancelQueries({ queryKey: [QUERY_KEYS.GET_INFINITE_POSTS] }),
    queryClient.cancelQueries({ queryKey: [QUERY_KEYS.GET_USER_POSTS] }),
    queryClient.cancelQueries({ queryKey: [QUERY_KEYS.SEARCH_POSTS] }),
    queryClient.cancelQueries({ queryKey: [QUERY_KEYS.GET_CURRENT_USER] }),
    queryClient.cancelQueries({ queryKey: [QUERY_KEYS.GET_SAVED_POSTS] }),
  ]);

const postInteractionQueryKeys = (postId: string): QueryKey[] => [
  [QUERY_KEYS.GET_POST_BY_ID, postId],
  [QUERY_KEYS.GET_RECENT_POSTS],
  [QUERY_KEYS.GET_INFINITE_POSTS],
  [QUERY_KEYS.GET_USER_POSTS],
  [QUERY_KEYS.SEARCH_POSTS],
  [QUERY_KEYS.GET_CURRENT_USER],
  [QUERY_KEYS.GET_SAVED_POSTS],
];

export const useCreateUserAccount = () => {
  return useMutation({
    mutationFn: (user: NewUser) => createUserAccount(user),
  });
};

export const useSignInAccount = () => {
  return useMutation({
    mutationFn: (user: { email: string; password: string }) =>
      signInAccount(user),
  });
};

export const useSignOutAccount = () => {
  return useMutation({
    mutationFn: signOutAccount,
  });
};

export const useGetPosts = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
    queryFn: ({ pageParam }: QueryFunctionContext) =>
      getInfinitePosts({ pageParam: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => {
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }

      const lastId = lastPage.documents[lastPage.documents.length - 1].$id;
      return lastId;
    },
  });
};

export const useSearchPosts = (searchTerm: string) => {
  const trimmedSearch = searchTerm.trim();

  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS, trimmedSearch],
    queryFn: () => searchPosts(trimmedSearch),
    enabled: !!trimmedSearch,
  });
};

export const useGetRecentPosts = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
    queryFn: getRecentPosts,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: NewPost) => createPost(post),
    onSuccess: () => {
      invalidatePostLists(queryClient);
      invalidateUserPosts(queryClient);
    },
  });
};

export const useGetPostById = (postId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });
};

export const useGetUserPosts = (userId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_POSTS, userId],
    queryFn: () => getUserPosts(userId),
    enabled: !!userId,
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: UpdatePostInput) => updatePost(post),
    onSuccess: (data) => {
      invalidatePostDetail(queryClient, data?.$id);
      invalidatePostLists(queryClient);
      invalidateUserPosts(queryClient);
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, imageId }: { postId?: string; imageId: string }) =>
      deletePost(postId, imageId),
    onSuccess: () => {
      invalidatePostLists(queryClient);
      invalidateUserPosts(queryClient);
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, likesArray }: LikePostInput) =>
      likePost(postId, likesArray),
    onMutate: async (variables: LikePostInput) => {
      await cancelPostInteractionQueries(queryClient, variables.postId);

      const previousQueries = snapshotQueries(
        queryClient,
        postInteractionQueryKeys(variables.postId)
      );
      const currentUser = queryClient.getQueryData<UserDocument | null>([
        QUERY_KEYS.GET_CURRENT_USER,
      ]);

      updatePostCaches(queryClient, variables.postId, (post) => ({
        ...post,
        likes: buildOptimisticLikes(post, variables.likesArray, currentUser),
      }));
      updateCurrentUserLikedPosts(
        queryClient,
        variables.userId,
        variables.post,
        variables.likesArray.includes(variables.userId)
      );

      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      restoreQueries(queryClient, context?.previousQueries);
    },
    onSettled: (_data, _error, variables) => {
      invalidatePostDetail(queryClient, variables?.postId);
      invalidatePostLists(queryClient);
      invalidateCurrentUser(queryClient);
      invalidateUserPosts(queryClient);
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, postId }: SavePostInput) => savePost(userId, postId),
    onMutate: async (variables: SavePostInput) => {
      await cancelPostInteractionQueries(queryClient, variables.postId);

      const previousQueries = snapshotQueries(
        queryClient,
        postInteractionQueryKeys(variables.postId)
      );
      const optimisticSaveRecord = {
        $id: `optimistic-save-${variables.postId}`,
        user: variables.userId,
        post: variables.post,
      } as SaveDocument;

      updateCurrentUserSavedPosts(
        queryClient,
        variables.userId,
        variables.postId,
        optimisticSaveRecord
      );
      updateSavedPostLists(queryClient, variables.post, true);

      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      restoreQueries(queryClient, context?.previousQueries);
    },
    onSettled: () => {
      invalidatePostLists(queryClient);
      invalidateCurrentUser(queryClient);
      invalidateSavedPosts(queryClient);
    },
  });
};

export const useDeleteSavedPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ savedRecordId }: DeleteSavedPostInput) =>
      deleteSavedPost(savedRecordId),
    onMutate: async (variables: DeleteSavedPostInput) => {
      await cancelPostInteractionQueries(queryClient, variables.postId);

      const previousQueries = snapshotQueries(
        queryClient,
        postInteractionQueryKeys(variables.postId)
      );
      const currentUser = queryClient.getQueryData<UserDocument | null>([
        QUERY_KEYS.GET_CURRENT_USER,
      ]);
      const savedPost = currentUser?.save?.find((record) => {
        return (
          record.$id === variables.savedRecordId ||
          getRelatedPostId(record.post) === variables.postId
        );
      });
      const savedPostDocument =
        typeof savedPost?.post === "string" ? undefined : savedPost?.post;

      if (currentUser) {
        updateCurrentUserSavedPosts(
          queryClient,
          currentUser.$id,
          variables.postId
        );
      }

      if (savedPostDocument) {
        updateSavedPostLists(queryClient, savedPostDocument, false);
      } else {
        queryClient.setQueriesData<PostDocument[]>(
          { queryKey: [QUERY_KEYS.GET_SAVED_POSTS] },
          (posts) =>
            posts?.filter((post) => post.$id !== variables.postId) || posts
        );
      }

      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      restoreQueries(queryClient, context?.previousQueries);
    },
    onSettled: () => {
      invalidatePostLists(queryClient);
      invalidateCurrentUser(queryClient);
      invalidateSavedPosts(queryClient);
    },
  });
};

export const useGetSavedPosts = (userId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_SAVED_POSTS, userId],
    queryFn: () => getSavedPosts(userId),
    enabled: !!userId,
  });
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser,
  });
};

export const useGetUsers = (limit?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USERS],
    queryFn: () => getUsers(limit),
  });
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: UpdateUserInput) => updateUser(user),
    onSuccess: (data) => {
      invalidateCurrentUser(queryClient);
      invalidateUserDetail(queryClient, data?.$id);
    },
  });
};

type FollowMutationInput = {
  currentUserId: string;
  targetUserId: string;
};

const invalidateFollowState = (
  queryClient: ReturnType<typeof useQueryClient>,
  { currentUserId, targetUserId }: FollowMutationInput
) => {
  invalidateCurrentUser(queryClient);
  invalidateUsers(queryClient);
  invalidateUserDetail(queryClient, currentUserId);
  invalidateUserDetail(queryClient, targetUserId);
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ currentUserId, targetUserId }: FollowMutationInput) =>
      followUser(currentUserId, targetUserId),
    onSuccess: (_data, variables) => {
      invalidateFollowState(queryClient, variables);
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ currentUserId, targetUserId }: FollowMutationInput) =>
      unfollowUser(currentUserId, targetUserId),
    onSuccess: (_data, variables) => {
      invalidateFollowState(queryClient, variables);
    },
  });
};
