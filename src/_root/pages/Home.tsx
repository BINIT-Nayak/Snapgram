import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { ErrorState, Loader, PostCard, UserCard } from "@/components/shared";
import { useUserContext } from "@/context/AuthContext";
import {
  useGetFollowStatuses,
  useGetRecentPosts,
  useGetUsers,
} from "@/lib/react-query/queries";

const Home = () => {
  const { user } = useUserContext();
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const {
    data: posts,
    isLoading: isPostLoading,
    isError: isErrorPosts,
    refetch: refetchPosts,
  } = useGetRecentPosts();
  const {
    data: creators,
    isLoading: isUserLoading,
    isError: isErrorCreators,
    refetch: refetchCreators,
  } = useGetUsers(10);
  const feedPosts = useMemo(() => posts?.documents || [], [posts?.documents]);
  const creatorIds = useMemo(
    () => creators?.documents.map((creator) => creator.$id) || [],
    [creators?.documents]
  );
  const { data: followStatuses } = useGetFollowStatuses(user.id, creatorIds);
  const hasRequestedFollowStatuses = creatorIds.length > 0;
  const followStatusByUserId = useMemo(
    () =>
      new Map(
        (followStatuses?.documents || []).map((follow) => [
          follow.followingId,
          follow,
        ])
      ),
    [followStatuses?.documents]
  );
  const feedVirtualizer = useVirtualizer({
    count: feedPosts.length,
    getScrollElement: () => feedScrollRef.current,
    estimateSize: () => 760,
    overscan: 4,
  });

  if (isErrorPosts || isErrorCreators) {
    return (
      <div className="flex flex-1">
        <div className="home-container" ref={feedScrollRef}>
          <ErrorState
            message="Could not load your feed."
            onRetry={() => refetchPosts()}
          />
        </div>
        <div className="home-creators">
          <ErrorState
            message="Could not load creators."
            onRetry={() => refetchCreators()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <div className="home-container" ref={feedScrollRef}>
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>
          {isPostLoading && !posts ? (
            <Loader />
          ) : feedPosts.length === 0 ? (
            <p className="text-light-4 mt-10 text-center w-full">
              No posts yet
            </p>
          ) : (
            <ul
              className="virtual-feed"
              style={{ height: `${feedVirtualizer.getTotalSize()}px` }}>
              {feedVirtualizer.getVirtualItems().map((virtualPost) => {
                const post = feedPosts[virtualPost.index];

                return (
                  <li
                    key={post.$id}
                    data-index={virtualPost.index}
                    ref={feedVirtualizer.measureElement}
                    className="virtual-feed_item"
                    style={{
                      transform: `translateY(${virtualPost.start}px)`,
                    }}>
                    <PostCard post={post} eagerImage={virtualPost.index === 0} />
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="home-creators">
        <h3 className="h3-bold text-light-1">Top Creators</h3>
        {isUserLoading && !creators ? (
          <Loader />
        ) : (
          <ul className="grid 2xl:grid-cols-2 gap-6">
            {creators?.documents.map((creator) => (
              <li key={creator?.$id}>
                <UserCard
                  user={creator}
                  followRecord={followStatusByUserId.get(creator.$id) || null}
                  hasFollowStatus={hasRequestedFollowStatuses}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;
