import { QueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/react-query/queryKeys";

export const invalidatePostLists = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
  });
  queryClient.invalidateQueries({
    queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
  });
};

export const invalidateUserPosts = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    queryKey: [QUERY_KEYS.GET_USER_POSTS],
  });
};

export const invalidateCurrentUser = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
  });
};

export const invalidateSavedPosts = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    queryKey: [QUERY_KEYS.GET_SAVED_POSTS],
  });
};

export const invalidateUsers = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    queryKey: [QUERY_KEYS.GET_USERS],
  });
};

export const invalidatePostDetail = (
  queryClient: QueryClient,
  postId?: string
) => {
  queryClient.invalidateQueries({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
  });
};

export const invalidateUserDetail = (
  queryClient: QueryClient,
  userId?: string
) => {
  queryClient.invalidateQueries({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
  });
};
